import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("token") || null
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

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
      }

      return {
        status: "success",
        message: `Registered ${data.username}`,
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

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
      }

      return {
        status: "success",
        message: `Welcome, ${data.username}`,
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
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}