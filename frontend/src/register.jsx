import { useState } from "react";
import { useAuth } from "./AuthContext/AuthContext";
import { useNavigate } from "react-router";


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

    if (result.status === "success") {
      navigate("/userPage");
    }
    setMessage(result.message);
    setPending(false);
  }

  return (
    <div>
      <h1>Register</h1>

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
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}