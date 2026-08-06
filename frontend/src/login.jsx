import { useState } from "react";
import { useAuth } from "./AuthContext/AuthContext";
import { useNavigate } from "react-router";
import usersRouter from "../../backend/api/users";



export default function LoginPage() {
  const navigate = useNavigate();
  
  const { login } = useAuth();

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

    if(result.status !== 'error'){
      navigate("/userPage")
    }

    setMessage(result.message);
    setPending(false);
  }

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input type="text" name="username" required />

        <label>Password</label>
        <input
          type="password"
          name="password"
          required
          minLength={8}
        />

        <button type="submit" disabled={pending}>
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}