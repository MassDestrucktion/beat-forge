import { useState, useEffect } from "react";
import ListItem from "./components/projectList";
import { useAuth } from "./AuthContext/AuthContext";
import "./styles/userPage.css";

export default function UserPage() {
    const { user } = useAuth();

    const [userProjects, setUserProjects] = useState([]);

    useEffect(() => {
        async function fetchProjects() {
            try {
                if (!user?.id) return;

                const response = await fetch(
                    `/api/projects/user/${user.id}`
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch projects");
                }

                const projects = await response.json();

                setUserProjects(projects);

            } catch (error) {
                console.error(error);
            }
        }

        fetchProjects();
    }, [user]);


    return (
        <main className="dashboard">

            <section className="welcomeCard">
                <h1>
                    Welcome, {user?.username || "User"}
                </h1>

                <p>
                    Manage your music projects below.
                </p>
            </section>


            <section className="projectsSection">

                <div className="projectsHeader">
                    <h2>Your Projects</h2>

                    <button className="newProjectBtn">
                        + New Project
                    </button>
                </div>


                <div className="projectsGrid">

                    {userProjects.length > 0 ? (
                        userProjects.map((project) => (
                            <ListItem
                                key={project.id}
                                project={project}
                            />
                        ))
                    ) : (
                        <div className="emptyProjects">
                            <h3>No projects yet</h3>

                            <p>
                                Start creating your first track.
                            </p>
                        </div>
                    )}

                </div>

            </section>

        </main>
    );
}