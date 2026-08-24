import { Link } from "react-router-dom";
import cool from "../public/media/cool.jpg";
import glasses from "../public/media/glasses.jpg";
import headphones from "../public/media/DarkHeadphones.jpg";
import gorilla from "../public/media/Gorilla.jpg";
import AVDreds from "../public/media/AVDreds.png";
import default_Pic from "../public/media/default_Pic.jpg";
import BlockParty from "../public/media/BlockParty.jpg";

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
