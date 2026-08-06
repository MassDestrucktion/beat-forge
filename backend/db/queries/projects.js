import db from "#db/client";

export async function createProject() {
    const SQL =`
        INSERT INTO tracks (id, name, tempo)  
        VALUES ($1, $2, $3)
        returning *
    `;

    const { rows: track } = await db.query(SQL, [id, name, tempo]);
    return track;
};