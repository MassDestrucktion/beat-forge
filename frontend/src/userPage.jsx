import { useState } from "react"
import { useEffect } from "react";
import listItem from "./components/projectList";

export default function UserPage() {
    const[user, setUser] = useState(null);
    const[userProjects, setUserProjects] = useState([]);

useEffect(() => {
    async () => {
        const response = await fetch("/", {
      });
        const user = response.json();
        setUser(user);
    }
      
});
    
    const projects = setUserProjects();

    return(
        <div className="profileGrid">
            <image className="pgrid1" src="" alt="MyIMG" />
            <div className="pgrid2">
            <h1>Profile: </h1>
            <h3 >{user.username }</h3>
            </div>
            <ul className="pgrid3">
                {userProjects.map((project) =>{
                    <listItem projects={projects} />
                })} 
            </ul>
            <button>Start New Project</button>

        </div>
    )
}