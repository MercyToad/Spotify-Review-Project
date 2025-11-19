<<<<<<< HEAD

-- ============================
-- USERS
-- ============================
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- ARTISTS
-- ============================
CREATE TABLE artist (
    artist_id VARCHAR(64) PRIMARY KEY,          -- Spotify artist ID
    name VARCHAR(255) NOT NULL,
    spotify_url TEXT,
    image_url TEXT,
    genres TEXT[]
);

-- ============================
-- SONGS
-- ============================
CREATE TABLE song (
    song_id VARCHAR(64) PRIMARY KEY,            -- Spotify track ID
    name VARCHAR(255) NOT NULL,
    length INTEGER NOT NULL,                    -- duration (seconds)
    genre VARCHAR(100),
    album_name VARCHAR(255),
    spotify_url TEXT,
    preview_url TEXT,
    popularity INTEGER
);

-- Many-to-many: Songs ↔ Artists
CREATE TABLE song_to_artist (
    song_id VARCHAR(64) REFERENCES song(song_id) ON DELETE CASCADE ON UPDATE CASCADE,
    artist_id VARCHAR(64) REFERENCES artist(artist_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (song_id, artist_id)
);

-- ============================
-- PLAYLISTS
-- ============================
--CREATE TABLE playlist (
--    playlist_id VARCHAR(64) PRIMARY KEY,        -- Spotify playlist ID
--    name VARCHAR(255) NOT NULL,
--    owner_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
--    description TEXT,
--    spotify_url TEXT,
--    created_at TIMESTAMP DEFAULT NOW()
--);

-- CREATE TABLE playlist_to_song (
--    song_id VARCHAR(64) REFERENCES song(song_id) ON DELETE CASCADE ON UPDATE CASCADE,
--    playlist_id VARCHAR(64) REFERENCES song(song_id) ON DELETE CASCADE ON UPDATE CASCADE,
--    PRIMARY KEY (song_id, playlist_id))



-- ============================
-- REVIEWS (Unified)
-- ============================
-- Enumerated target types: can be 'song', 'artist', or 'playlist'
CREATE TYPE review_target AS ENUM ('song', 'artist', 'playlist');

CREATE TABLE review (
    review_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_type review_target NOT NULL,
    target_id VARCHAR(64) NOT NULL,             -- song_id, artist_id, or playlist_id
    title VARCHAR(255),
    review_text TEXT,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_review_per_user UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX idx_review_target ON review(target_type, target_id);
=======
-- Stores basic user info (can come from Spotify’s OAuth later)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR(100) UNIQUE,  -- Spotify user ID (from their account)
    username VARCHAR(100),
    password VARCHAR(100), 
    email VARCHAR(255),              
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SONGS TABLE
-- Stores info about songs users review (linked to Spotify track IDs)
CREATE TABLE IF NOT EXISTS songs (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR(100) UNIQUE NOT NULL,  -- Spotify's track ID
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    album VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REVIEWS TABLE
-- Stores user ratings and reviews for each song
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
>>>>>>> lab10
