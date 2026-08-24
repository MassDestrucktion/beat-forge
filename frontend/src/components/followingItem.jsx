import { Link } from "react-router-dom";
import cool from "../media/cool.jpg";
import glasses from "../media/glasses.jpg";
import headphones from "../media/DarkHeadphones.jpg";
import gorilla from "../media/Gorilla.jpg";
import AVDreds from "../media/AVDreds.png";
import default_Pic from "../media/default_Pic.jpg";
import BlockParty from "../media/BlockParty.jpg";

const profilePictures = [
  { id: "default_pic", src: default_Pic },
  { id: "default_Pic", src: default_Pic },
  { id: "BlockParty", src: BlockParty },
  { id: "cool", src: cool },
  { id: "glasses", src: glasses },
  { id: "headphones", src: headphones },
  { id: "gorilla", src: gorilla },
  { id: "AVDreds", src: AVDreds },
];

export function FollowingItem({ following }) {
  return (
    <div className="following-item">
      <Link to={`/userPage/${following.id}`}>
        <img
          className="following-avatar"
          src={
            profilePictures.find((picture) => picture.id === following.picurl)
              ?.src || default_Pic
          }
          alt={`${following.username}'s avatar`}
          height="125"
          width="125"
        />
        <h4 className="following-username">{following.username}</h4>
      </Link>
    </div>
  );
}
