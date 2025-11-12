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
