export async function getUserFriends(id) {
    const SQL = `
        SELECT u.id, u.username
        FROM friendships f
        JOIN users u ON u.id = f.addressee_id
        WHERE f.user_id = $1 AND f.status = 'accepted'
    `;
};