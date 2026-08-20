import cool from "../media/cool.jpg";
import glasses from "../media/glasses.jpg";
import headphones from "../media/DarkHeadphones.jpg";
import gorilla from "../media/Gorilla.jpg";
import AVDreds from "../media/AVDreds.png";

const profilePictures = [
  { id: "cool", src: cool },
  { id: "glasses", src: glasses },
  { id: "headphones", src: headphones },
  { id: "gorilla", src: gorilla },
  { id: "AVDreds", src: AVDreds }
];

export function FollowingItem({ following }) {

    console.log("FOLLOWING OBJECT:", following);
    console.log("PICURL:", following?.picurl);


    return (
        <div className="following-item">
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
        </div>
    );
}



