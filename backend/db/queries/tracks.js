import db from "#db/client";

export async function getTracks() {
    const SQL =`
        SELECT *
        FROM tracks    
    `;

    const { rows: tracks } = await db.query(SQL, []);
    return tracks;
};

export async function getTracksById(id) {
    const SQL = `
        SELECT tracks.*
        FROM tracks
        JOIN playlists_tracks ON playlists_tracks.track_id = tracks.id
        JOIN playlists ON playlists.id = playlists_tracks.playlist_id
        WHERE playlists.id = $1
    `;

    const { rows: tracks } = await db.query(SQL, [id]);
    return tracks;
};