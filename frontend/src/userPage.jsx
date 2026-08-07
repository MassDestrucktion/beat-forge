import { useState, useEffect } from "react";
import ListItem from "./components/projectList";
import { useAuth } from "./AuthContext/AuthContext";

export default function UserPage() {
    const { user } = useAuth();

    const [userProjects, setUserProjects] = useState([]);

    useEffect(() => {
        async function fetchProjects() {
            try {
                if (!user?.id) {
                    return;
                }

                const response = await fetch(`/api/projects/user/${user.id}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch projects");
                }

                const projects = await response.json();

                setUserProjects(projects);
                console.log("User projects:", projects);

            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        }

        fetchProjects();
    }, [user]);


    return (
        <div className="profileGrid">

            <img
                className="pgrid1"
                src={null}
                alt="Profile"
            />


            <div className="pgrid2">
                <h1>Profile:</h1>

                {user ? (
                    <h3>{user.username}</h3>
                ) : (
                    <h3>Loading...</h3>
                )}

            </div>



            <ul className="pgrid3">
                {userProjects.length > 0 ? (
                    userProjects.map((project) => (
                        <ListItem
                            key={project.id}
                            project={project}
                        />
                    ))
                ) : (
                    <li>No projects yet</li>
                )}
            </ul>



            <button>
                Start New Project
            </button>

        </div>
    );
}