import { useState } from "react"
import { useEffect } from "react";
import listItem from "./components/projectList";
import DJ-pic from './media/DJ-pic.jpg';

export default function FeaturedProjects() {
    
    const[user, setUser] = useState(null);
    const[userProjects, setUserProjects] = useState([]);
    const[featuredprojects, setFeaturedProjects] = useState({});
      

    

    return(
        
    
        <div className="featuredGrid">
            <h1>Featured Projects </h1>
            <div className="featuregrid1">
            <img  src={DJ-pic} alt="MyIMG" height="100px" width="150px"/>
            <h4>Chill Groove</h4>
            <h5> A relaxing mellow groove to help relax and chill.
                created by Dj JohnnyLaw
            </h5>
            </div>
            <div className="featuregrid1">
            <img  src={DJ-pic}alt="MyIMG" height="100px" width="150px"/>
            <h4>Chill Groove</h4>
            <h5> A relaxing mellow groove to help relax and chill.
                created by Dj JohnnyLaw
            </h5>
            </div>
            <div className="featuregrid2">
            <img  src={djPic} alt="MyIMG" height="100px" width="150px"/>
            <h4>Beach Beats</h4>
            <h5> Perfect beat for paying and having fun in the sun!
                created by Dj KidJacob
            </h5>
            </div>
            <div className="featuregrid3">
            <img  src={djPic} alt="MyIMG" height="50px" width="100px"/>
            <h4>Chill Groove</h4>
            <h5> Late night work track, for burning the midnight oil.
                created by Dj Dee
            </h5>
            </div>

        </div>
    )
}