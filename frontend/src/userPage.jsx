import { useState } from "react";
import ListItem from "./components/projectList";
import { useAuth } from "./AuthContext/AuthContext";

export default function UserPage() {
    const { user } = useAuth();

    const [userProjects, setUserProjects] = useState([]);


    return (
        <div className="profileGrid">

            <img
                className="pgrid1"
                src=""
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