export function FollowingItem({ following }) {
    return(
        <div className="following-item">
            <div className="following-username">{following.username}</div>
            
            {/* <img className="following-avatar" src={following.avatar_url} alt={`${following.username}'s avatar`} /> */}
        </div>
    )
}