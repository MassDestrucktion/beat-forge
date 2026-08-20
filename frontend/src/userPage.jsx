import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FollowingItem } from "./components/followingItem";
import { useAuth } from "./AuthContext/AuthContext";
import UserSearch from "./components/userSearch";
import "./styles/userPage.css";

import cool from "./media/cool.jpg";
import glasses from "./media/glasses.jpg";
import headphones from "./media/DarkHeadphones.jpg";
import gorilla from "./media/Gorilla.jpg";
import AVDreds from "./media/AVDreds.png";

const profilePictures = [
  { id: "cool", src: cool },
  { id: "glasses", src: glasses },
  { id: "headphones", src: headphones },
  { id: "gorilla", src: gorilla },
  { id: "AVDreds", src: AVDreds },
];

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

export default function UserPage() {
  const { id } = useParams();
  const { user, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  const loggedInUserId = user?.id;
  const profileUserId = id || loggedInUserId;
  const isOwnProfile = loggedInUserId === profileUserId;

  const [profileUser, setProfileUser] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [error, setError] = useState("");
  const [followingError, setFollowingError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [myPicUrl, setMyPicUrl] = useState(null);
  const [selectedPicture, setSelectedPicture] = useState(null);

  const myProfilePicture = profilePictures.find(
    (picture) => picture.id === myPicUrl
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !profileUserId || !token) {
      return;
    }

    async function fetchProfileUser() {
      try {
        const response = await fetch(`/api/users/${profileUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfileUser(data);
      } catch (err) {
        console.error("PROFILE ERROR:", err);
      }
    }

    fetchProfileUser();
  }, [isAuthenticated, profileUserId, token]);

  useEffect(() => {
    if (!isAuthenticated || !profileUserId) {
      return;
    }

    async function fetchProjects() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/users/${profileUserId}/projects`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to fetch projects");
        }

        const projects = await response.json();

        setUserProjects(Array.isArray(projects) ? projects : []);
      } catch (err) {
        console.error("PROJECT ERROR:", err);
        setError(err.message || "Failed to load projects");
        setUserProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [isAuthenticated, profileUserId, token]);

  useEffect(() => {
    if (!isAuthenticated || !loggedInUserId) {
      return;
    }

    async function fetchFollowing() {
      try {
        setFollowingLoading(true);
        setFollowingError("");

        const response = await fetch(
          `/api/users/${loggedInUserId}/following`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to fetch following");
        }

        const followingUsers = await response.json();

        setFollowing(
          Array.isArray(followingUsers) ? followingUsers : []
        );
      } catch (err) {
        console.error("FOLLOWING ERROR:", err);

        setFollowingError(
          err.message || "Failed to load following"
        );

        setFollowing([]);
      } finally {
        setFollowingLoading(false);
      }
    }

    fetchFollowing();
  }, [isAuthenticated, loggedInUserId, token]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !loggedInUserId ||
      !profileUserId ||
      !token ||
      isOwnProfile
    ) {
      return;
    }

    async function fetchFollowStatus() {
      try {
        const response = await fetch(
          `/api/users/${profileUserId}/follow-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const text = await response.text();

          console.error(
            "FOLLOW STATUS ERROR:",
            response.status,
            text
          );

          return;
        }

        const data = await response.json();

        setIsFollowing(Boolean(data.isFollowing));
      } catch (err) {
        console.error("Failed to get follow status:", err);
      }
    }

    fetchFollowStatus();
  }, [
    isAuthenticated,
    loggedInUserId,
    profileUserId,
    token,
    isOwnProfile,
  ]);

  async function handleFollow() {
    if (!profileUserId || !token || isOwnProfile) {
      return;
    }

    try {
      const method = isFollowing ? "DELETE" : "POST";

      const response = await fetch(
        `/api/users/${profileUserId}/follow`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text || "Failed to update follow status"
        );
      }

      setIsFollowing((prev) => !prev);
    } catch (err) {
      console.error("FOLLOW ERROR:", err);
      alert(err.message || "Failed to update follow status");
    }
  }

  useEffect(() => {
    if (!loggedInUserId || !token) {
      return;
    }

    async function fetchMyPic() {
      try {
        const response = await fetch(
          `/api/users/${loggedInUserId}/pic`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile picture");
        }

        const data = await response.json();

        setMyPicUrl(data.picurl);
        setSelectedPicture(data.picurl);
      } catch (err) {
        console.error("MY PIC ERROR:", err);
      }
    }

    fetchMyPic();
  }, [loggedInUserId, token]);

  async function saveProfilePicture() {
    if (!loggedInUserId || !token || !selectedPicture) {
      return;
    }

    try {
      const response = await fetch(
        `/api/users/${loggedInUserId}/profile-picture`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            picurl: selectedPicture,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text || "Failed to save profile picture"
        );
      }

      const data = await response.json();

      setMyPicUrl(data.picurl || selectedPicture);
    } catch (err) {
      console.error("PROFILE PICTURE ERROR:", err);
      alert(err.message || "Failed to save profile picture");
    }
  }

  async function handleDelete(projectId) {
    if (!isOwnProfile || !loggedInUserId) {
      return;
    }

    if (
      !window.confirm(
        "Delete this project? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/users/${loggedInUserId}/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text || "Failed to delete project"
        );
      }

      setUserProjects((prev) =>
        prev.filter((project) => project.id !== projectId)
      );
    } catch (err) {
      console.error("DELETE PROJECT ERROR:", err);
      alert(`Delete failed: ${err.message}`);
    }
  }

  function handleOpen(projectId) {
    navigate(
      `/sequencer?projectId=${projectId}&userID=${profileUserId}`
    );
  }

  function handleNewProject() {
    navigate("/sequencer");
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <main className="dashboard">
        <section className="welcomeCard">
          <h1>Loading projects...</h1>
        </section>
      </main>
    );
  }

  const displayName =
    profileUser?.username ||
    (isOwnProfile ? user?.username : "User") ||
    "User";

  return (
    <div>
      <div className="searchBar">
        {!isOwnProfile && (
          <button
            className="follow"
            onClick={handleFollow}
          >
            {isFollowing
              ? "Unfollow Artist"
              : "Follow Artist"}
          </button>
        )}

        <UserSearch />
      </div>

      <main className="dashboard">
        <section className="welcomeCard">
          <h1 className="pixel-title">
            Welcome, {displayName}
          </h1>

          {isOwnProfile && (
            <div className="my-profile">
              <img
                className="my-profile-avatar"
                src={myProfilePicture?.src}
                alt={`${user?.username || "User"}'s avatar`}
              />

              <h2>{user?.username || "User"}</h2>
            </div>
          )}

          {isOwnProfile && (
            <>
              <div className="profile-picture-selection">
                {profilePictures.map((picture) => (
                  <img
                    key={picture.id}
                    src={picture.src}
                    alt={picture.id}
                    onClick={() =>
                      setSelectedPicture(picture.id)
                    }
                    className={
                      selectedPicture === picture.id
                        ? "profile-picture selected"
                        : "profile-picture"
                    }
                  />
                ))}
              </div>

              <button onClick={saveProfilePicture}>
                Save Profile Picture
              </button>
            </>
          )}

          <p>
            {isOwnProfile
              ? "Manage your music projects below."
              : `Explore ${displayName}'s music projects.`}
          </p>
        </section>

        {isOwnProfile && (
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
                  You aren't following anyone yet.
                </p>
              )}

            {!followingLoading &&
              following.length > 0 && (
                <div className="followingList">
                  {following.map((followedUser) => (
                    <div key={followedUser.id}>
                      <FollowingItem
                        following={followedUser}
                      />
                    </div>
                  ))}
                </div>
              )}
          </section>
        )}

        <section className="projectsSection">
          <div className="projectsHeader">
            <div>
              <h2>
                {isOwnProfile
                  ? "Your Projects"
                  : `${displayName}'s Projects`}
              </h2>

              <p className="user-name">
                👤 {displayName}
              </p>
            </div>

            {isOwnProfile && (
              <button
                className="newProjectBtn"
                onClick={handleNewProject}
              >
                + New Project
              </button>
            )}
          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {!error && userProjects.length === 0 ? (
            <div className="emptyProjects">
              <h3>No projects yet</h3>

              <p>
                {isOwnProfile
                  ? "Start creating your first track."
                  : `${displayName} hasn't created any projects yet.`}
              </p>

              {isOwnProfile && (
                <button
                  className="link-btn"
                  onClick={handleNewProject}
                >
                  Start one now!
                </button>
              )}
            </div>
          ) : (
            <div className="projectsGrid">
              {userProjects.map((project) => (
                <div
                  key={project.id}
                  className="project-card"
                >
                  <div className="project-card-header">
                    <h3>
                      {project.name ||
                        "Untitled Project"}
                    </h3>

                    <span className="project-date">
                      {timeAgo(project.created_at)}
                    </span>
                  </div>

                  <div className="project-card-details">
                    <span>
                      BPM: {project.tempo || 120}
                    </span>

                    <span>
                      Tracks:{" "}
                      {Array.isArray(project.grid)
                        ? project.grid.length
                        : "—"}
                    </span>
                  </div>

                  <div className="project-card-actions">
                    <button
                      className="nav-btn"
                      onClick={() =>
                        handleOpen(project.id)
                      }
                    >
                      Open in Sequencer
                    </button>

                    {isOwnProfile && (
                      <button
                        className="nav-btn delete-btn"
                        onClick={() =>
                          handleDelete(project.id)
                        }
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}