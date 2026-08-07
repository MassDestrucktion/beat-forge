import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext/AuthContext.jsx";

export default function Navbar() {
    const { isAuthenticated, token, user, logout } = useAuth();

    console.log("Navbar auth:", isAuthenticated, token);

    return (
        <nav className="navbar">

            <div className="nav-brand">
                <NavLink to="/">
                    BeatForge
                </NavLink>
            </div>


            <ul className="nav-links">

                <li>
                    <NavLink to="/">
                        <button className="nav-btn">
                            Home
                        </button>
                    </NavLink>
                </li>


                <li>
                    <NavLink to="/getting-started">
                        <button className="nav-btn">
                            Guide
                        </button>
                    </NavLink>
                </li>


                <li>
                    <NavLink to="/sequencer">
                        <button className="nav-btn">
                            Sequencer
                        </button>
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
                            <button
                                className="nav-btn"
                                onClick={logout}
                            >
                                Logout
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            <NavLink to="/login">
                                <button className="nav-btn">
                                    Login
                                </button>
                            </NavLink>
                        </li>


                        <li>
                            <NavLink to="/register">
                                <button className="nav-btn">
                                    Register
                                </button>
                            </NavLink>
                        </li>
                    </>
                )}

            </ul>

        </nav>
    );
}