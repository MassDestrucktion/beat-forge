import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.target);
    const result = await login({
      username: formData.get("username")?.toString().trim(),
      password: formData.get("password")?.toString(),
    });
    console.log("LOGIN RESULT:", result);
    setMessage(result.message);
    if (result.status === "success") {
      navigate(`/userPage/${result.user.id}`);
    }
    setPending(false);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🎵</span>
          <h1>Log In</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              name="username"
              placeholder="Your username"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              placeholder="Your password"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={pending}>
            {pending ? "Logging in…" : "Log In"}
          </button>
        </form>

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-switch">
          Need an account?{" "}
          <NavLink to="/register" className="auth-link">
            Register
          </NavLink>
        </p>
      </div>
    </div>
  );
}
