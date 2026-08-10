import { createContext, useContext, useState } from "react";

const AuthContext = createContext();


export function AuthProvider({ children }) {
    const [token, setToken] = useState(
        localStorage.getItem("token") || null
    );

    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );


    const register = async (credentials) => {
        const { username, password } = credentials;

        if (!username) {
            return {
                status: "error",
                message: "Username is required.",
            };
        }

        if (!password || password.length < 8) {
            return {
                status: "error",
                message: "Password must be at least 8 characters long.",
            };
        }


        try {
            const response = await fetch("/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials),
            });


            const data = await response.json();

            console.log("Register response:", data);


            if (!response.ok) {
                throw new Error(
                    data.message || "Registration failed"
                );
            }


            if (data.token) {
                setToken(data.token);
                localStorage.setItem("token", data.token);
            }


            if (data.user) {
                setUser(data.user);
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );
            }


            return {
                status: "success",
                message: `Registered ${data.user.username}`,
            };


        } catch (error) {
            return {
                status: "error",
                message: error.message,
            };
        }
    };



    const login = async (credentials) => {
        const { username, password } = credentials;


        if (!username) {
            return {
                status: "error",
                message: "Username is required.",
            };
        }


        if (!password || password.length < 8) {
            return {
                status: "error",
                message: "Password must be at least 8 characters long.",
            };
        }


        try {
            const response = await fetch("/api/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials),
            });


            const data = await response.json();

            console.log("Login response:", data);


            if (!response.ok) {
                throw new Error(
                    data.message || "Login failed"
                );
            }


            if (data.token) {
                setToken(data.token);
                localStorage.setItem("token", data.token);
            }


            if (data.user) {
                setUser(data.user);
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );
            }


            return {
                status: "success",
                message: `Welcome, ${data.user.username}`,
            };


        } catch (error) {
            return {
                status: "error",
                message: error.message,
            };
        }
    };



    const logout = () => {
        setToken(null);
        setUser(null);

        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };



    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                setUser,
                isAuthenticated: !!token,
                register,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}



export function useAuth() {
    const context = useContext(AuthContext);


    if (!context) {
        throw new Error(
            "useAuth must be used within AuthProvider"
        );
    }


    return context;
}