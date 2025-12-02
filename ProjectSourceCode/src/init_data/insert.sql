-- NOTE: the following SQL was written by gemini AI
-- Prompt: can you create mock data for the following database schema, but for the songs table, use the following spotify ids and song names: 1lNRVjK8MukRZpeurYssIx Shakedown Street by grateful dead, 6aBUnkXuCEQQHAlTokv9or This must be the place by talking heads, 5exa8iAaKpyO6dm8MZgGHV for like or like like by miniature tiger, and 1q9siR3OqGFnTeqFxwzN1S the sweet escape by gwen stefani. here is the database schema CREATE INDEX idx_review_target ON review(target_type, target_id);
-- (Followed by our existing database schema)


-- 1. Insert Users
INSERT INTO users (username, password_hash) VALUES
('retro_groover', 'hashed_secret_123'),
('indie_vibe_check', 'secure_pass_456'),
('pop_anthem_fan', 'password_789');

-- 2. Insert Artists 
-- (IDs are now auto-generated via SERIAL, so we only insert details)
INSERT INTO artist (name, spotify_url, image_url, genres) VALUES
('Grateful Dead', 'http://open.spotify.com/artist/dead', 'https://placehold.co/400', ARRAY['classic rock', 'jam band']),
('Talking Heads', 'http://open.spotify.com/artist/heads', 'https://placehold.co/400', ARRAY['new wave', 'art punk']),
('Miniature Tigers', 'http://open.spotify.com/artist/tigers', 'https://placehold.co/400', ARRAY['indie pop', 'synthpop']),
('Gwen Stefani', 'http://open.spotify.com/artist/gwen', 'https://placehold.co/400', ARRAY['pop', 'dance pop']);

-- 3. Insert Songs (with the specific Spotify IDs requested)
INSERT INTO songs (spotify_id, title, artist, album, average_rating) VALUES
('1lNRVjK8MukRZpeurYssIx', 'Shakedown Street', 'Grateful Dead', 'Shakedown Street', 4.9),
('6aBUnkXuCEQQHAlTokv9or', 'This Must Be the Place (Naive Melody)', 'Talking Heads', 'Speaking in Tongues', 4.2),
('5exa8iAaKpyO6dm8MZgGHV', 'Like or Like Like', 'Miniature Tigers', 'Tell It to the Volcano', 3.1),
('1q9siR3OqGFnTeqFxwzN1S', 'The Sweet Escape', 'Gwen Stefani', 'The Sweet Escape', 4.0);

-- 4. Link Songs to Artists
-- We must look up the IDs dynamically because they are SERIAL integers now
INSERT INTO song_to_artist (song_id, artist_id) VALUES
(
    (SELECT song_id FROM songs WHERE spotify_id = '1lNRVjK8MukRZpeurYssIx'), -- Shakedown Street
    (SELECT artist_id FROM artist WHERE name = 'Grateful Dead')
),
(
    (SELECT song_id FROM songs WHERE spotify_id = '6aBUnkXuCEQQHAlTokv9or'), -- This Must Be The Place
    (SELECT artist_id FROM artist WHERE name = 'Talking Heads')
),
(
    (SELECT song_id FROM songs WHERE spotify_id = '5exa8iAaKpyO6dm8MZgGHV'), -- Like or Like Like
    (SELECT artist_id FROM artist WHERE name = 'Miniature Tigers')
),
(
    (SELECT song_id FROM songs WHERE spotify_id = '1q9siR3OqGFnTeqFxwzN1S'), -- Sweet Escape
    (SELECT artist_id FROM artist WHERE name = 'Gwen Stefani')
);

-- 5. Insert Reviews
-- Since review.song_id is VARCHAR(64), I am inserting the Spotify ID here.
INSERT INTO review (user_id, song_id, title, review_text, rating) VALUES
(
    (SELECT user_id FROM users WHERE username = 'retro_groover'),
    (SELECT song_id FROM songs WHERE spotify_id = '1lNRVjK8MukRZpeurYssIx'), -- Shakedown Street
    'Iconic Bassline',
    'The bassline in this is absolutely iconic. A bit disco, a bit rock, pure dead.',
    5
),
(
    (SELECT user_id FROM users WHERE username = 'indie_vibe_check'),
    (SELECT song_id FROM songs WHERE spotify_id = '6aBUnkXuCEQQHAlTokv9or'), -- This Must Be the Place
    'Home',
    'The quintessential home song. David Byrne is a genius.',
    5
),
(
    (SELECT user_id FROM users WHERE username = 'retro_groover'),
    (SELECT song_id FROM songs WHERE spotify_id = '6aBUnkXuCEQQHAlTokv9or'), -- This Must Be the Place
    'Live version is better',
    'Great song, but I prefer the live version from Stop Making Sense.',
    4
),
(
    (SELECT user_id FROM users WHERE username = 'indie_vibe_check'),
    (SELECT song_id FROM songs WHERE spotify_id = '5exa8iAaKpyO6dm8MZgGHV'), -- Like or Like Like
    'Earworm',
    'Super catchy indie pop. Stuck in my head all day.',
    4
),
(
    (SELECT user_id FROM users WHERE username = 'pop_anthem_fan'),
    (SELECT song_id FROM songs WHERE spotify_id = '1q9siR3OqGFnTeqFxwzN1S'), -- The Sweet Escape
    'Nostalgia!',
    'Nostalgia overload! Akon and Gwen were the perfect duo.',
    5
),
(
    (SELECT user_id FROM users WHERE username = 'retro_groover'),
    (SELECT song_id FROM songs WHERE spotify_id = '1q9siR3OqGFnTeqFxwzN1S'), -- The Sweet Escape
    'Too polished',
    'A little too polished for my taste, but catchy hook.',
    2
);