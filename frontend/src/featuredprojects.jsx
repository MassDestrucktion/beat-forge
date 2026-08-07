import { useState } from "react"
import { useEffect } from "react";
import listItem from "./components/projectList";

export default function FeaturedProjects() {
    const[user, setUser] = useState(null);
    const[userProjects, setUserProjects] = useState([]);
    const[featuredprojects, setFeaturedProjects] = useState({});
      

    
    const projects = setUserProjects();

    return(
        
    
        <div className="profileGrid">
            <image className="pgrid1" src="beat-forge\frontend\src\media\pacha-wide-LEAD.webp" alt="MyIMG" />
            <div className="pgrid2">
            <h1>Featured Projects </h1>
            <h3 >{"username" }</h3>
            </div>
            <ul className="pgrid3">
                {userProjects.map((project) =>{
                    <li>project.name </li>
                })} 
            </ul>
            <button>Start New Project</button>

        </div>
    )
}