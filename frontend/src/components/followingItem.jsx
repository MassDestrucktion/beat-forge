import glasses from "../media/glasses.jpg";

export function FollowingItem({ following }) {
    return(
        <div className="following-item">
            <h4 className="following-username">{following.username}</h4>
            
            <img className="following-avatar" src={glasses} alt={`${following.username}'s avatar`} height="200" width="200" /> 
        </div>
    )
}