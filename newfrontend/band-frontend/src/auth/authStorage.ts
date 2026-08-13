// Stores tokens

let token: string = "";

export const authStorage = {
    getToken() {
        return token;
    },

    setToken(newtoken: string) {
        token = newtoken;
    },

    clearToken() {
        token = "";
    },
};