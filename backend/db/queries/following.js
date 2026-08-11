import db from "#db/client";

export async function getFollowing(id) {
    const SQL =`
        SELECT *
        FROM follows 
        WHERE follower_id = $1   
    `;

    const { rows: tracks } = await db.query(SQL, [id]);
    return tracks;
};