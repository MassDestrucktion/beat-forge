import { useActionState } from "react";

async function loginUser(prevState, formData) {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username) {
    return { status: "error", message: "Username is required." };
  }

  if (!password || password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters long.",
    };
  }

  const payload = {
    username,
    password,
  };

  try {
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    return { status: "success", message: `Welcome, ${data.username}!` };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginUser, {
    status: "idle",
    message: "",
  });

  return (
    <div>
      <h1>Login</h1>
      <form action={formAction}>
        <label>Username</label>
        <input type="text" name="username" required />

        <label>Password</label>
        <input type="password" name="password" required minLength="8" />

        <button type="submit" disabled={pending}>
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
      {state.message ? <p>{state.message}</p> : null}
    </div>
  );
}
