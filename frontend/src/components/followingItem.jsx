export function FollowingItem({ following }) {
    return(
        <li className="following-item">
            <span className="following-username">{following.username}</span>
            <h4>Test following item</h4>
            {/* <img className="following-avatar" src={following.avatar_url} alt={`${following.username}'s avatar`} /> */}
        </li>
    )
}