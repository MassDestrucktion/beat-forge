import { Link } from "react-router-dom";
import cool from "../media/cool.jpg";
import glasses from "../media/glasses.jpg";
import headphones from "../media/DarkHeadphones.jpg";
import gorilla from "../media/Gorilla.jpg";
import AVDreds from "../media/AVDreds.png";
import default_Pic from "../media/default_Pic.jpg";


const profilePictures = [
  { id: "default_Pic", src: default_Pic},
  { id: "cool", src: cool },
  { id: "glasses", src: glasses },
  { id: "headphones", src: headphones },
  { id: "gorilla", src: gorilla },
  { id: "AVDreds", src: AVDreds }
];

export function FollowingItem({ following }) {

    console.log("FOLLOWING OBJECT:", following);
    console.log("PICURL:", following?.picurl);
    //Testing Git

    return (
        <div className="following-item">
            <Link to={`/userPage/${following.id}`}>
            <h4 className="following-username">
                {following.username}
            </h4>

           <img
    className="following-avatar"
    src={profilePictures.find(
        (picture) => picture.id === following.picurl
    )?.src}
    alt={`${following.username}'s avatar`}
    height="125"
    width="125"
/>
    </Link>
        </div>
    );
}



