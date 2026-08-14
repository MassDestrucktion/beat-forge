import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext/AuthContext.jsx";

export default function Navbar() {
  const { isAuthenticated, token, user, logout } = useAuth();
  const navigate = useNavigate();

  console.log("Navbar auth:", isAuthenticated, token, user);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <NavLink to="/">
          <span className="pixel-title">BeatForge</span>
        </NavLink>
      </div>

      <ul className="nav-links">
        <li>
          <NavLink to="/">
            <button className="nav-btn">Home</button>
          </NavLink>
        </li>

        <li>
          <NavLink to="/getting-started">
            <button className="nav-btn">Guide</button>
          </NavLink>
        </li>

        <li>
          <NavLink to="/sequencer">
            <button className="nav-btn">Sequencer</button>
          </NavLink>
        </li>

        {isAuthenticated ? (
          <>
            <li>
              <NavLink to="/userPage">
                <button className="nav-btn">
                  {user?.username || "Profile"}
                </button>
              </NavLink>
            </li>

            <li>
              <button className="nav-btn" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login">
                <button className="nav-btn">Login</button>
              </NavLink>
            </li>

            <li>
              <NavLink to="/register">
                <button className="nav-btn">Register</button>
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
