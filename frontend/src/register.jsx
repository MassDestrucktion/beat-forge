import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.target);
    const result = await register({
      username: formData.get("username")?.toString().trim(),
      password: formData.get("password")?.toString(),
    });

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
          <h1>Register</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              name="username"
              placeholder="Pick a name"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              name="password"
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={pending}>
            {pending ? "Creating account…" : "Create Account"}
          </button>
        </form>

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-switch">
          Already have an account?{" "}
          <NavLink to="/login" className="auth-link">
            Log in
          </NavLink>
        </p>
      </div>
    </div>
  );
}
