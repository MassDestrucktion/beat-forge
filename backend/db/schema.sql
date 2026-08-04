DROP TABLE if exists users CASCADE;
DROP TABLE if exists tracks CASCADE;
DROP TABLE if exists users_tracks CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    username text NOT NULL UNIQUE,
    password text NOT NULL,
    bio text
);

CREATE TABLE tracks (
    id UUID PRIMARY KEY,
    name text NOT NULL,
    description text
);

CREATE TABLE users_tracks (
    id serial PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    UNIQUE (user_id, track_id)
);