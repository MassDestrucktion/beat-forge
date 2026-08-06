import { NavLink } from "react-router-dom"; // or "react-router"

export default function Navbar() {
  
  return (
    
    <nav className="navbar">
      <div className="nav-brand">
        <NavLink to="/">BeatForge</NavLink>
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
        {}
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
      </ul>
    </nav>
  );
}
