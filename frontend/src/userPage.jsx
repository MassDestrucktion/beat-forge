import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
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
  { id: "AVDreds", src: AVDreds }
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

export default function userPage() {
const { id } = useParams();
const { user, isAuthenticated, token } = useAuth();
    const navigate = useNavigate();
  console.log("PROFILE USER ID:", id);

  const loggedInUserId = user.id;
  const profileUserId = id;



    const [userProjects, setUserProjects] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingLoading, setFollowingLoading] = useState(true);
    const [error, setError] = useState("");
    const [followingError, setFollowingError] = useState("");
    const [isFollowing, setIsFollowing] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [selectedPicture, setSelectedPicture] = useState(user.picurl);
    const [myPicUrl, setMyPicUrl] = useState(null);
    const [showPictureChooser, setShowPictureChooser] = useState(false);

const myProfilePicture = profilePictures.find(
    (picture) => picture.id === myPicUrl
);

useEffect(() => {
    if (!user?.id || !token) return;

    async function fetchMyPic() {
        try {
            const response = await fetch(
                `/api/users/${user.id}/pic`,
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

            console.log("MY PIC DATA:", data);

            setMyPicUrl(data.picurl);
        } catch (error) {
            console.error("MY PIC ERROR:", error);
        }
    }

    fetchMyPic();
}, [user?.id, token]);


    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        if (!profileUserId) return;

        async function fetchProjects() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/users/${profileUserId}/projects`,
                    {
                        headers: {
                            Authorization: token
                                ? `Bearer ${token}`
                                : "",
                        },
                    }
                );

                if (!response.ok) {
                    console.log(response)
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
        profileUserId,
        token,
        navigate,
    ]);

    //show different page
    useEffect(() => {
    if (!profileUserId || !token) {
        return;
    }

    async function fetchProfileUser() {
        try {
            const response = await fetch(
                `/api/users/${profileUserId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to fetch profile"
                );
            }

            const data = await response.json();

            console.log("PROFILE USER:", data);

            setProfileUser(data);
        } catch (error) {
            console.error(
                "PROFILE ERROR:",
                error
            );
        }
    }

    fetchProfileUser();

}, [profileUserId, token]);


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
                console.log(followingUsers)
                setFollowing(followingUsers);

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

useEffect(() => {
    if (
        !isAuthenticated ||
        !user?.id ||
        !profileUserId ||
        !token
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
                console.log(
                    "FOLLOW STATUS:",
                    response.status
                );
                return;
            }

            const data = await response.json();

            setIsFollowing(data.isFollowing);

        } catch (error) {
            console.error(
                "Failed to get follow status:",
                error
            );
        }
    }

    fetchFollowStatus();

}, [
    isAuthenticated,
    user?.id,
    profileUserId,
    token
]);

async function handleFollow() {
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
    console.log("FOLLOW STATUS:", response.status);
    return;
  }

  setIsFollowing(!isFollowing);
}

useEffect(() => {
  if (
    !isAuthenticated ||
    !user?.id ||
    !profileUserId
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
        console.log(
          "FOLLOW STATUS:",
          response.status,
          text
        );
        return;
      }

      const data = await response.json();

      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error(
        "Failed to get follow status:",
        error
      );
    }
  }

  fetchFollowStatus();
}, [
  isAuthenticated,
  user?.id,
  profileUserId,
  token,
]);

// ProfilePic
async function saveProfilePicture() {
    const response = await fetch(
        `/api/users/${user.id}/profile-picture`,
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

    const data = await response.json();

    console.log("UPDATED USER:", data);

    if (response.ok) {
        window.location.reload();
    }
}

//Projects

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
                `/api/users/${user?.id}/projects/${projectId}`,
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
            `/sequencer?projectId=${projectId}&userID=${profileUserId}`
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
            <div>
               <div>
  <div className="searchBar">
    {loggedInUserId !== profileUserId && (
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
</div>
        <main className="dashboard">
            <section className="welcomeCard">
                <h1>
                    Welcome,{" "}
                    {profileUser?.username || "User"}
                </h1>
                <div className="my-profile">
  <img
    className="my-profile-avatar"
    src={myProfilePicture?.src}
    alt={`${user?.username}'s avatar`}
    onClick={() => setShowPictureChooser(!showPictureChooser)}
  />

  <h2>{user?.username}</h2>
{showPictureChooser && (  
<div className="profile-picture-chooser">
    <div className="profile-picture-selection">
    {profilePictures.map((picture) => (
        <img
         key={picture.id}
        src={picture.src}
        alt={picture.id}
        onClick={() => setSelectedPicture(picture.id)}
        className={ selectedPicture === picture.id
          ? "profile-picture selected"
          : "profile-picture"
      }
    />
  ))}
</div>

    <button onClick={saveProfilePicture}>
  Save Profile Picture
</button>
</div>
)}
</div>
                
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
                        <div className="followingList">
                            {following.map(
                                (followedUser) => (
                                    <div
                                        key={
                                            followedUser.id
                                        }
                                    >
                                        <FollowingItem
                                            following={
                                                followedUser
                                            }
                                        />
                                    </div>
                                )
                            )}
                        </div>
                    )}
            </section>

            <section className="projectsSection">
                <div className="projectsHeader">
                    <div>
                        <h2>
                            {profileUser?.username || "User"}'s Projects
                        </h2>

                        <p className="user-name">
                            👤{" "}
                                 {profileUser?.username || "User"}
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
        </div>
    );
}