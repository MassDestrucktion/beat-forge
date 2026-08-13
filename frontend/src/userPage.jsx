import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import ListItem from "./components/projectList";
import { FollowingItem } from "./components/followingItem";

import { useAuth } from "./AuthContext/AuthContext";
import "./styles/userPage.css";

function timeAgo(dateStr) {
    if (!dateStr) return "";

    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;

    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);

    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDay = Math.floor(diffHr / 24);

    if (diffDay < 30) return `${diffDay}d ago`;

    return new Date(dateStr).toLocaleDateString();
}

export default function userPage() {
    const { user, isAuthenticated, token } = useAuth();
    const navigate = useNavigate();

    const [userProjects, setUserProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [following, setFollowing] = useState([]);

    /**
     * ---------------------------------------------------------
     * LOAD USER PROJECTS
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        if (!user?.id) return;

        async function fetchProjects() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/users/${user.id}/projects`,
                    {
                        headers: {
                            Authorization: token
                                ? `Bearer ${token}`
                                : "",
                        },
                    }
                );

                if (!response.ok) {
                    const text = await response.text();

                    throw new Error(
                        text || "Failed to fetch projects"
                    );
                }

                const projects = await response.json();

                setUserProjects(projects);
            } catch (err) {
                console.error(err);

                setError(
                    err.message ||
                        "Failed to load projects"
                );
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
    }, [
        isAuthenticated,
        user?.id,
        token,
        navigate,
    ]);

    /**
     * ---------------------------------------------------------
     * LOAD FOLLOWING
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        if (!user?.id) {
            return;
        }

        async function fetchFollowing() {
            console.log("TOKEN:", token);
    console.log("USER:", user);
            try {
                const response = await fetch(
                    `/api/users/${user.id}/following`,
                    {
                        headers: {
                            Authorization: token
                                ? `Bearer ${token}`
                                : "",
                        },
                    }
                );

                if (!response.ok) {
    const text = await response.text();
    
    console.log("STATUS:", response.status);
    console.log("SERVER ERROR:", text);

    throw new Error(text || "Failed to fetch following");
}

                const followingUsers =
                    await response.json();
                    console.log("Following users:", followingUsers);
                setFollowing(
                    Array.isArray(
                        followingUsers
                    )
                        ? followingUsers
                        : []
                );
            } catch (error) {
                console.error(
                    "Failed to load following:",
                    error
                );

                setFollowing([]);
            }
        }

        fetchFollowing();
    }, [
        isAuthenticated,
        user?.id,
        token,
    ]);

    /**
     * ---------------------------------------------------------
     * DELETE PROJECT
     * ---------------------------------------------------------
     */

    const handleDelete = async (
        projectId
    ) => {
        if (
            !window.confirm(
                "Delete this project? This cannot be undone."
            )
        ) {
            return;
        }

        try {
            const response = await fetch(
                `/api/users/${user?.id}/projects/`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization: token
                            ? `Bearer ${token}`
                            : "",
                    },
                }
            );

            if (!response.ok) {
                const text =
                    await response.text();

                throw new Error(
                    text ||
                        "Failed to delete project"
                );
            }

            setUserProjects(
                (prev) =>
                    prev.filter(
                        (project) =>
                            project.id !==
                            projectId
                    )
            );
        } catch (err) {
            alert(
                `Delete failed: ${err.message}`
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * OPEN PROJECT
     * ---------------------------------------------------------
     */

    const handleOpen = (
        projectId
    ) => {
        navigate(
            `/sequencer?projectId=${projectId}`
        );
    };

    /**
     * ---------------------------------------------------------
     * NEW PROJECT
     * ---------------------------------------------------------
     */

    const handleNewProject = () => {
        navigate("/sequencer");
    };

    /**
     * ---------------------------------------------------------
     * AUTH GUARD
     * ---------------------------------------------------------
     */

    if (!isAuthenticated) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * LOADING
     * ---------------------------------------------------------
     */

    if (loading) {
        return (
            <main className="dashboard">
                <section className="welcomeCard">
                    <h1>
                        Loading projects...
                    </h1>
                </section>
            </main>
        );
    }

    /**
     * ---------------------------------------------------------
     * RENDER
     * ---------------------------------------------------------
     */

    return (
        <main className="dashboard">

            {/* =========================
                WELCOME
            ========================== */}

            <section className="welcomeCard">
                <h1>
                    Welcome,{" "}
                    {user?.username ||
                        "User"}
                </h1>

                <p>
                    Manage your music
                    projects below.
                </p>
            </section>

            {/* =========================
                FOLLOWING
            ========================== */}

            <section className="followingSection">
                <div className="followingHeader">
                    <h2>
                        People You Follow
                    </h2>
                </div>
                {following.length === 0 ? (
                    <p>
                        You aren't following
                        anyone yet.
                    </p>
                ) : (
                    <div>
                    <ul>
                        {following.map(
                            (followingUser) => (
                                <li key={followingUser.id}>
                                    <FollowingItem following={followingUser} />  
                                </li>
                            )
                        )}
                    </ul>
                    <button onClick={handleFollow}>Follow</button>
                    </div>
                )}
            </section>

            {/* =========================
                PROJECTS
            ========================== */}

            <section className="projectsSection">

                <div className="projectsHeader">
                    <div>
                        <h2>
                            Your Projects
                        </h2>

                        <p className="user-name">
                            👤{" "}
                            {user?.username ||
                                "User"}
                        </p>
                    </div>

                    <button
                        className="newProjectBtn"
                        onClick={
                            handleNewProject
                        }
                    >
                        + New Project
                    </button>
                </div>

                {error && (
                    <p className="error-message">
                        {error}
                    </p>
                )}

                {!error &&
                userProjects.length ===
                    0 ? (
                    <div className="emptyProjects">
                        <h3>
                            No projects yet
                        </h3>

                        <p>
                            Start creating
                            your first
                            track.
                        </p>

                        <button
                            className="link-btn"
                            onClick={
                                handleNewProject
                            }
                        >
                            Start one now!
                        </button>
                    </div>
                ) : (
                    <div className="projectsGrid">
                        {userProjects.map(
                            (project) => (
                                <div
                                    key={
                                        project.id
                                    }
                                    className="project-card"
                                >
                                    <div className="project-card-header">
                                        <h3>
                                            {project.name ||
                                                "Untitled Project"}
                                        </h3>

                                        <span className="project-date">
                                            {timeAgo(
                                                project.created_at
                                            )}
                                        </span>
                                    </div>

                                    <div className="project-card-details">
                                        <span>
                                            BPM:{" "}
                                            {project.tempo ||
                                                120}
                                        </span>

                                        <span>
                                            Tracks:{" "}
                                            {Array.isArray(
                                                project.grid
                                            )
                                                ? project
                                                      .grid
                                                      .length
                                                : "—"}
                                        </span>
                                    </div>

                                    <div className="project-card-actions">
                                        <button
                                            className="nav-btn"
                                            onClick={() =>
                                                handleOpen(
                                                    project.id
                                                )
                                            }
                                        >
                                            Open in Sequencer
                                        </button>

                                        <button
                                            className="nav-btn delete-btn"
                                            onClick={() =>
                                                handleDelete(
                                                    project.id
                                                )
                                            }
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}