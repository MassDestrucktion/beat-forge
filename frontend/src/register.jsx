import { useActionState } from "react";

async function registerUser(prevState, formData) {
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
    const response = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    return { status: "success", message: `Registered ${data.user.username}` };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerUser, {
    status: "idle",
    message: "",
  });

  return (
    <div>
      <h1>Register</h1>
      <form action={formAction}>
        <label>Username</label>
        <input type="text" name="username" required />

        <label>Password</label>
        <input type="password" name="password" required minLength="8" />

        <button type="submit" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>
      {state.message ? <p>{state.message}</p> : null}
    </div>
  );
}
