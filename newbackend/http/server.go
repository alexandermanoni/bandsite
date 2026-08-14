package http

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	mysql "example.com/bandsite"

	newbackend "example.com/bandsite"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Server struct {
	router *gin.Engine

	UserService    newbackend.UserService
	BandService    newbackend.BandService
	SetlistService newbackend.SetlistService
	SongService    newbackend.SongService
}

func NewServer() *Server {
	var server Server

	server.router = gin.Default()
	server.router.Use(TimeoutMiddleware(5 * time.Second))

	return &server
}

func (s *Server) StartServer() {
	config := cors.DefaultConfig()
	// config.AllowOrigins = []string{"http://localhost:5173"}
	config.AllowOrigins = []string{"*"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowCredentials = true
	s.router.Use(cors.New(config))
	//s.router.Use(cors.Default())

	s.setHandlers()
	// s.router.Run("localhost:8080")
	//s.router.Run(":8080")
	s.router.Run(":" + os.Getenv("PORT"))
}

func (s *Server) setHandlers() {
	s.router.POST("/signup", s.signupUser)
	s.router.POST("/login", s.loginUser)
	s.router.POST("/auth", s.refreshAuth)

	// everything should be here when finished
	api := s.router.Group("/api")
	api.Use(AuthMiddleware())
	{
		api.GET("/bandlist", s.getBands)
		api.GET("/songs/:bandid", s.getSongs)
		api.GET("/setlists/:bandid", s.getSetlists)
		api.GET("/songpositions/:setlistid", s.getSongPositions)

		api.GET("/songsources/:songid", s.getSongSource)
		api.GET("/setlistzip/:setlistid", s.getSetlistZip)
		api.GET("/setlistpdf/:setlistid", s.getSetlistPdf)

		api.POST("/createband", s.createBand)
		api.POST("/createsong", s.createSong)
		api.POST("/createsetlist", s.createSetlist)
		api.POST("/uploadsong", s.uploadSongSource)
		api.POST("/uploadsongpositions", s.uploadSongPositions)

		api.POST("/deletesetlist/:setlistid", s.deleteSetlist)
		api.POST("/deletesong/:songid", s.deleteSong)
		api.POST("/deleteband/:bandid", s.deleteBand)

		api.POST("/logout", s.logoutUser)
	}
}

func createSignedJWTToken(userid int) (string, error) {
	claims := AccessClaims{
		Role: "user",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.Itoa(userid),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "bandsite-api",
			Audience:  []string{"bandsite-frontend"},
		},
	}

	// using HMAC as recommended here: https://www.latacora.com/blog/post-quantum-cryptographic-right-answers/#key-exchange
	// HS256 is HMAC as stated here: https://golang-jwt.github.io/jwt/usage/signing_methods/
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	accessToken, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", err
	}

	return accessToken, nil
}

func createRefreshToken() (string, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func (s *Server) signupUser(c *gin.Context) {
	var req SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Sign up request error: %v\n", err)
		return
	}

	// create user in db
	err := s.UserService.SignupUser(c.Request.Context(), req.Email, req.Password, req.Verify)
	if err != nil {
		fmt.Printf("Error adding user %v: %v\n", req.Email, err)

		if errors.Is(err, mysql.ErrPasswordsDoNotMatch) {
			c.JSON(http.StatusBadRequest, nil)
			return
		}

		if errors.Is(err, mysql.ErrEmailMalformed) {
			c.JSON(http.StatusBadRequest, nil)
			return
		}

		if errors.Is(err, mysql.ErrEmailAlreadyTaken) {
			c.JSON(http.StatusConflict, fmt.Errorf("Email already taken"))
			return
		}

		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	// log in user
	userid, err := s.UserService.LoginUser(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, nil)
		fmt.Printf("Error logging in newly added user %v: %v\n", req.Email, err)
		return
	}

	// this SHOULD only happen if password is incorrect
	if userid == -1 {
		c.JSON(http.StatusUnauthorized, nil)
		fmt.Printf("Invalid password for user %v\n", userid)
		return
	}

	// create JWT access token for user
	accesstoken, err := createSignedJWTToken(userid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, nil)
		fmt.Printf("Failed to create signed JWT for user %v: %v\n", userid, err)
		return
	}

	// create refresh token for user
	refreshtoken, err := createRefreshToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, nil)
		fmt.Printf("Failed to create refresh token: %v\n", err)
		return
	}

	// store refresh token for user
	err = s.UserService.StoreRefreshToken(c.Request.Context(), userid, refreshtoken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, nil)
		fmt.Printf("Failed to store refresh token: %v\n", err)
		return
	}

	// return refresh token as HttpsOnly cookie
	c.SetCookie(
		"refresh_token",
		refreshtoken,
		60*60*24*30, // 30 days
		"/auth",
		"",
		true, // secure
		true, // http only
	)

	// return JWT access token
	c.JSON(http.StatusOK, gin.H{
		"accessToken": accesstoken,
	})
}

func (s *Server) loginUser(c *gin.Context) {
	// check login request format (has email and password)
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Login request error: %v\n")
		return
	}

	// log in user
	userid, err := s.UserService.LoginUser(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, nil)
		fmt.Printf("Error loggin in user %v: %v\n", req.Email, err)
		return
	}

	// passwords don't match
	if userid == -1 {
		c.JSON(http.StatusUnauthorized, nil)
		fmt.Printf("Invalid password for user %v\n", req.Email)
		return
	}

	// create JWT access token for user
	accesstoken, err := createSignedJWTToken(userid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, nil)
		fmt.Printf("Failed to create signed JWT for user %v: %v\n", userid, err)
		return
	}

	// create refresh token for user
	refreshtoken, err := createRefreshToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, nil)
		fmt.Printf("Failed to create refresh token: %v\n", err)
		return
	}

	// store refresh token for user
	err = s.UserService.StoreRefreshToken(c.Request.Context(), userid, refreshtoken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, nil)
		fmt.Printf("Failed to store refresh token: %v\n", err)
		return
	}

	// return refresh token as HttpsOnly cookie
	c.SetCookie(
		"refresh_token",
		refreshtoken,
		60*60*24*30, // 30 days
		"/auth",
		"",
		true, // secure
		true, // http only
	)

	// return JWT access token
	c.JSON(http.StatusOK, gin.H{
		"accessToken": accesstoken,
	})
}

func (s *Server) refreshAuth(c *gin.Context) {
	// get token
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "missing refresh token",
		})
		return
	}

	userid, err := s.UserService.VerifyRefreshToken(c.Request.Context(), refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, nil)
		fmt.Printf("Error getting refresh token status: %v\n", err)
		return
	}

	// token isn't good
	if userid == -1 {
		c.JSON(http.StatusUnauthorized, nil)
		fmt.Printf("Token not fresh\n")
		return
	}

	// get new auth token
	accesstoken, err := createSignedJWTToken(userid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, nil)
		fmt.Printf("Failed to create signed JWT for user %v: %v\n", userid, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accessToken": accesstoken,
	})
}

func (s *Server) logoutUser(c *gin.Context) {
	// revoke refresh token
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no user ID"})
		fmt.Printf("Unauthorized get band: no user ID (%v)\n", userIDValue)
		return
	}

	userID, err := strconv.Atoi(userIDValue.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID"})
		fmt.Printf("Failed to get user ID %v\n", err)
		return
	}

	err = s.UserService.LogoutUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, nil)
		fmt.Printf("Failed to logout user %v: %v\n", userID, err)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func (s *Server) getBands(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	// get bands
	bands, err := s.BandService.FindBandsByUser(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, nil)
		fmt.Printf("SQL Error finding bands for user: %d\n", userID)
		return
	}

	c.JSON(http.StatusOK, bands)
}

func (s *Server) getSetlists(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	bandid, err := strconv.Atoi(c.Param("bandid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("No band: %v\n", bandid)
		return
	}

	// get setlists
	setlists, err := s.SetlistService.FindSetlistsByBand(c.Request.Context(), userID.(int), bandid)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Error getting user %v songs for band %v: %v\n", userID, bandid, err)
		return
	}

	c.JSON(http.StatusOK, setlists)
}

func (s *Server) getSongs(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	bandid, err := strconv.Atoi(c.Param("bandid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("No band: %v\n", bandid)
		return
	}

	// get songs
	songs, err := s.SongService.FindSongsByBand(c.Request.Context(), userID.(int), bandid)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Error getting user (%v) songs for band (%v): %v\n", userID, bandid, err)
		return
	}

	c.JSON(http.StatusOK, songs)
}

func (s *Server) getSongPositions(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	setlistid, err := strconv.Atoi(c.Param("setlistid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Error getting setlistid: %v\n", err)
		return
	}

	songpositions, err := s.SetlistService.FindSongPositionsBySetlist(c.Request.Context(), userID.(int), setlistid)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Failed to get song positions: %v\n", err)
		return
	}

	c.JSON(http.StatusOK, songpositions)
}

func (s *Server) getSongSource(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	songid, err := strconv.Atoi(c.Param("songid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Error getting songid: %v\n", err)
		return
	}

	err = s.SongService.GetSongSource(c, userID.(int), songid)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Failed to get song source: %v\n", err)
		return
	}

	// this v messes everything up
	// c.JSON(http.StatusOK, nil)
}

func (s *Server) getSetlistZip(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	setlistid, err := strconv.Atoi(c.Param("setlistid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Error getting songid: %v\n", err)
		return
	}

	err = s.SetlistService.GetSetlistZip(c, userID.(int), setlistid)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Failed to get setlist zip: %v\n", err)
		return
	}
}

func (s *Server) getSetlistPdf(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	setlistid, err := strconv.Atoi(c.Param("setlistid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Error getting songid: %v\n", err)
		return
	}

	buffer, err := s.SetlistService.GetSetlistPdf(c, userID.(int), setlistid)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Failed to get setlist pdf: %v\n", err)
		return
	}

	c.Header("Content-Disposition", `attachment; filename="setlist.pdf"`)
	c.Data(http.StatusOK, "application/pdf", buffer.Bytes())
}

func (s *Server) createBand(c *gin.Context) {
	// get band request
	var req CreateBandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Create band request error: %v\n", err)
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	// create band
	band, err := s.BandService.CreateBand(c.Request.Context(), userID.(int), req.BandName)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Error creating band: %v\n", err)
		return
	}

	c.JSON(http.StatusOK, band)
}

func (s *Server) createSong(c *gin.Context) {
	// get song request
	var req CreateSongRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Create song request error: %v\n", err)
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	bandid, err := strconv.Atoi(req.BandID)
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Invalid band ID: %v\n", req.BandID)
		return
	}

	// create song
	song, err := s.SongService.CreateSong(c.Request.Context(), userID.(int), bandid, req.SongName)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Error creating song: %v\n", err)
		return
	}

	c.JSON(http.StatusOK, song)
}

func (s *Server) createSetlist(c *gin.Context) {
	// get setlist request
	var req CreateSetlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Create setlist request error: %v\n", err)
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	bandid, err := strconv.Atoi(req.BandID)
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Invalid band ID: %v\n", req.BandID)
		return
	}

	// create setlist
	setlist, err := s.SetlistService.CreateSetlist(c.Request.Context(), userID.(int), bandid, req.SetlistName)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Error creating setlist: %v\n", err)
		return
	}

	c.JSON(http.StatusOK, setlist)
}

func (s *Server) uploadSongSource(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	songid, err := strconv.Atoi(c.PostForm("songid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Failed to get song id to upload song source: %v\n", err)
		return
	}
	songfile, err := c.FormFile("songsource")
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Failed to get song source to upload song source: %v\n", err)
		return
	}

	err = s.SongService.UploadSongSource(c, userID.(int), songid, songfile)
	if err != nil {
		c.IndentedJSON(http.StatusConflict, nil)
		fmt.Printf("Failed to upload song source: %v\n", err)
		return
	}

	c.IndentedJSON(http.StatusOK, nil)
}

func (s *Server) uploadSongPositions(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	// get position request
	var req UploadSetlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Upload setlist positions request error: %v\n", err)
		return
	}
	setlistid, err := strconv.Atoi(req.SetlistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Upload positions setlist id malformed: %v\n", err)
		return
	}

	// upload new positions
	err = s.SetlistService.UploadSongPositions(c.Request.Context(), userID.(int), setlistid, req.SongPositions)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Failed to upload song positions: %v\n", err)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func (s *Server) deleteSetlist(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	setlistid, err := strconv.Atoi(c.Param("setlistid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Error getting setlistid: %v\n", err)
		return
	}

	err = s.SetlistService.DeleteSetlist(c.Request.Context(), userID.(int), setlistid)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Failed to delete setlist %v: %v\n", setlistid, err)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func (s *Server) deleteSong(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	songid, err := strconv.Atoi(c.Param("songid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Error getting songid: %v\n", err)
		return
	}

	err = s.SongService.DeleteSong(c.Request.Context(), userID.(int), songid)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Failed to delete song %v: %v\n", songid, err)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func (s *Server) deleteBand(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	bandid, err := strconv.Atoi(c.Param("bandid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		fmt.Printf("Error getting bandid: %v\n", err)
		return
	}

	err = s.BandService.DeleteBand(c.Request.Context(), userID.(int), bandid)
	if err != nil {
		c.JSON(http.StatusConflict, nil)
		fmt.Printf("Failed to delete song %v: %v\n", bandid, err)
		return
	}

	c.JSON(http.StatusOK, nil)
}
