package http

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AccessClaims struct {
	Role string `json:"role"`

	jwt.RegisteredClaims
}

// wrap requests with a deadline
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		context, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		// replace request with one that has new context
		c.Request = c.Request.WithContext(context)
		c.Next()
	}
}

// check that JWT token is good
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// check that auth header exists
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "missing authorization header",
			})
			return
		}

		// expect Bearer <token>
		const prefix = "Bearer "

		if !strings.HasPrefix(authHeader, prefix) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "invalid authorization header",
			})
			return
		}

		// get token, exclude prefix
		tokenstring := strings.TrimPrefix(authHeader, prefix)

		parser := jwt.NewParser(
			jwt.WithIssuer("bandsite-api"),
			jwt.WithAudience("bandsite-frontend"),
		)

		claims := &AccessClaims{}

		token, err := parser.ParseWithClaims(tokenstring, claims, func(token *jwt.Token) (interface{}, error) {
			// make sure token uses expected algorithm
			if token.Method != jwt.SigningMethodHS256 {
				return nil, fmt.Errorf("unexpected signing method")
			}

			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "invalid/expired token",
			})
			return
		}

		// verify userid
		if claims.RegisteredClaims.Subject == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "missing subject",
			})
			return
		}

		useridstring := claims.RegisteredClaims.Subject
		userID, err := strconv.Atoi(useridstring)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "subject malformatted",
			})
			return
		}

		c.Set("userID", userID)

		c.Next()
	}
}
