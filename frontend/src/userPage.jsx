import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingLoading, setFollowingLoading] = useState(true);
    const [error, setError] = useState("");
    const [followingError, setFollowingError] = useState("");

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

    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            return;
        }

        async function fetchFollowing() {
            try {
                setFollowingLoading(true);
                setFollowingError("");

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
                    const text =
                        await response.text();

                    throw new Error(
                        text ||
                            "Failed to fetch following"
                    );
                }

                const followingUsers =
                    await response.json();

                setFollowing(
                    Array.isArray(followingUsers)
                        ? followingUsers
                        : []
                );
            } catch (err) {
                console.error(err);

                setFollowingError(
                    err.message ||
                        "Failed to load following"
                );

                setFollowing([]);
            } finally {
                setFollowingLoading(false);
            }
        }

        fetchFollowing();
    }, [
        isAuthenticated,
        user?.id,
        token,
    ]);

    const handleDelete = async (projectId) => {
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

            setUserProjects((prev) =>
                prev.filter(
                    (project) =>
                        project.id !== projectId
                )
            );
        } catch (err) {
            alert(
                `Delete failed: ${err.message}`
            );
        }
    };

    const handleOpen = (projectId) => {
        navigate(
            `/sequencer?projectId=${projectId}`
        );
    };

    const handleNewProject = () => {
        navigate("/sequencer");
    };

    if (!isAuthenticated) {
        return null;
    }

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

    return (
        <main className="dashboard">
            <section className="welcomeCard">
                <h1>
                    Welcome,{" "}
                    {user?.username || "User"}
                </h1>

                <p>
                    Manage your music projects
                    below.
                </p>
            </section>

            <section className="followingSection">
                <div className="followingHeader">
                    <h2>People You Follow</h2>
                </div>

                {followingLoading && (
                    <p>Loading following...</p>
                )}

                {followingError && (
                    <p className="error-message">
                        {followingError}
                    </p>
                )}

                {!followingLoading &&
                    !followingError &&
                    following.length === 0 && (
                        <p>
                            You aren't following
                            anyone yet.
                        </p>
                    )}

                {!followingLoading &&
                    following.length > 0 && (
                        <ul>
                            {following.map(
                                (followedUser) => (
                                    <li
                                        key={
                                            followedUser.id
                                        }
                                    >
                                        <FollowingItem
                                            following={
                                                followedUser
                                            }
                                        />
                                    </li>
                                )
                            )}
                        </ul>
                    )}
            </section>

            <section className="projectsSection">
                <div className="projectsHeader">
                    <div>
                        <h2>Your Projects</h2>

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
                userProjects.length === 0 ? (
                    <div className="emptyProjects">
                        <h3>
                            No projects yet
                        </h3>

                        <p>
                            Start creating your
                            first track.
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
                                            Open in
                                            Sequencer
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