-- NOTE: the following SQL was written by gemini AI
-- Prompt: can you create mock data for the following database schema, but for the songs table, use the following spotify ids and song names: 1lNRVjK8MukRZpeurYssIx Shakedown Street by grateful dead, 6aBUnkXuCEQQHAlTokv9or This must be the place by talking heads, 5exa8iAaKpyO6dm8MZgGHV for like or like like by miniature tiger, and 1q9siR3OqGFnTeqFxwzN1S the sweet escape by gwen stefani. here is the database schema CREATE INDEX idx_review_target ON review(target_type, target_id);
-- (Followed by our existing database schema)


-- 1. Insert Users (Keeping your original users)
INSERT INTO users (username, password_hash) VALUES
('retro_groover', 'hashed_secret_123'),
('indie_vibe_check', 'secure_pass_456'),
('pop_anthem_fan', 'password_789');

-- 2. Insert Artists 
-- (Added the new artists from your list. Note: Grateful Dead is skipped here as they are in your original list)
INSERT INTO artist (name, spotify_url, image_url, genre) VALUES
('Grateful Dead', 'http://open.spotify.com/artist/dead', 'https://placehold.co/400', 'rock'),
('Talking Heads', 'http://open.spotify.com/artist/heads', 'https://placehold.co/400', 'indie'),
('Miniature Tigers', 'http://open.spotify.com/artist/tigers', 'https://placehold.co/400', 'indie'),
('Gwen Stefani', 'http://open.spotify.com/artist/gwen', 'https://placehold.co/400', 'pop'),
-- NEW ARTISTS BELOW
('Westside Gunn', 'http://googleusercontent.com/spotify.com/4', 'https://placehold.co/400', 'hip-hop'),
('Marvin Gaye', 'http://googleusercontent.com/spotify.com/5', 'https://placehold.co/400', 'rnb'),
('Daft Punk', 'http://googleusercontent.com/spotify.com/6', 'https://placehold.co/400', 'electronic'),
('Nick Drake', 'http://googleusercontent.com/spotify.com/7', 'https://placehold.co/400', 'indie'),
('The Microphones', 'http://googleusercontent.com/spotify.com/8', 'https://placehold.co/400', 'indie'),
('Wolfgang Amadeus Mozart', 'http://googleusercontent.com/spotify.com/9', 'https://placehold.co/400', 'classical'),
('Ella Fitzgerald', 'http://open.spotify.com/artist/heads0', 'https://placehold.co/400', 'jazz'),
('Buddha Trixie', 'http://open.spotify.com/artist/heads1', 'https://placehold.co/400', 'indie'),
('The Pale Saints', 'http://open.spotify.com/artist/heads2', 'https://placehold.co/400', 'indie'),
('Brooks & Dunn', 'http://open.spotify.com/artist/heads3', 'https://placehold.co/400', 'country'),
('Title Fight', 'http://open.spotify.com/artist/heads4', 'https://placehold.co/400', 'metal');

-- 3. Insert Songs 
INSERT INTO songs (spotify_id, title, artist, album, average_rating) VALUES
-- Original Request
('1lNRVjK8MukRZpeurYssIx', 'Shakedown Street', 'Grateful Dead', 'Shakedown Street', 4.9),
('6aBUnkXuCEQQHAlTokv9or', 'This Must Be the Place (Naive Melody)', 'Talking Heads', 'Speaking in Tongues', 4.2),
('5exa8iAaKpyO6dm8MZgGHV', 'Like or Like Like', 'Miniature Tigers', 'Tell It to the Volcano', 3.1),
('1q9siR3OqGFnTeqFxwzN1S', 'The Sweet Escape', 'Gwen Stefani', 'The Sweet Escape', 4.0),
-- New Request
('3TltuDrcQHAvg5KZntDVnS', 'Big Dump Ballad', 'Westside Gunn', 'And Then You Pray For Me', 4.1),
('7vpkmzisaB8R47XlxyTcfs', 'Distant Lover', 'Marvin Gaye', 'Lets Get It On', 4.8),
('1NeLwFETswx8Fzxl2AFl91', 'Something About Us', 'Daft Punk', 'Discovery', 4.7),
('2tlhnUxHtYDqu0i9KIraUu', 'Parasite', 'Nick Drake', 'Pink Moon', 4.3),
('1bAZV1EBTRi9t1cVg75i8t', 'I Want Wind to Blow', 'The Microphones', 'The Glow Pt. 2', 4.5),
('1134COXJLBupGpZ1sonOWY', 'Fantasia in D Minor', 'Wolfgang Amadeus Mozart', 'Piano Works', 5.0),
('4kF394GKEnI13QdZBM9mxM', 'Misty', 'Ella Fitzgerald', 'Hello, Love', 4.9),
('10EDH2xbcota8LOtQlABRw', 'RU DOWN?', 'Buddha Trixie', 'Real', 3.8),
('5hUCTgttGB1eS4GJdPEQEM', 'Kinky Love', 'The Pale Saints', 'The Comforts of Madness', 3.9),
('3EUl8M6SzxZl03NPkB8mUd', 'Neon Moon', 'Brooks & Dunn', 'Brand New Man', 4.2),
('449LuMpoIOhxnW2B246Aau', 'Head in the Ceiling Fan', 'Title Fight', 'Floral Green', 4.6),
('5ZLzl6T8JwqMTMdoE0nCbU', 'Friend of the Devil', 'Grateful Dead', 'American Beauty', 4.8),
('0mJQlCl9YgxW7kyeltNiVk', 'Touch of Grey - 2013 Remaster', 'Grateful Dead', 'In The Dark', 4.0);

-- 4. Link Songs to Artists
INSERT INTO song_to_artist (song_id, artist_id) VALUES
-- Originals
( (SELECT song_id FROM songs WHERE spotify_id = '1lNRVjK8MukRZpeurYssIx'), (SELECT artist_id FROM artist WHERE name = 'Grateful Dead') ),
( (SELECT song_id FROM songs WHERE spotify_id = '6aBUnkXuCEQQHAlTokv9or'), (SELECT artist_id FROM artist WHERE name = 'Talking Heads') ),
( (SELECT song_id FROM songs WHERE spotify_id = '5exa8iAaKpyO6dm8MZgGHV'), (SELECT artist_id FROM artist WHERE name = 'Miniature Tigers') ),
( (SELECT song_id FROM songs WHERE spotify_id = '1q9siR3OqGFnTeqFxwzN1S'), (SELECT artist_id FROM artist WHERE name = 'Gwen Stefani') ),
-- New Links
( (SELECT song_id FROM songs WHERE spotify_id = '3TltuDrcQHAvg5KZntDVnS'), (SELECT artist_id FROM artist WHERE name = 'Westside Gunn') ),
( (SELECT song_id FROM songs WHERE spotify_id = '7vpkmzisaB8R47XlxyTcfs'), (SELECT artist_id FROM artist WHERE name = 'Marvin Gaye') ),
( (SELECT song_id FROM songs WHERE spotify_id = '1NeLwFETswx8Fzxl2AFl91'), (SELECT artist_id FROM artist WHERE name = 'Daft Punk') ),
( (SELECT song_id FROM songs WHERE spotify_id = '2tlhnUxHtYDqu0i9KIraUu'), (SELECT artist_id FROM artist WHERE name = 'Nick Drake') ),
( (SELECT song_id FROM songs WHERE spotify_id = '1bAZV1EBTRi9t1cVg75i8t'), (SELECT artist_id FROM artist WHERE name = 'The Microphones') ),
( (SELECT song_id FROM songs WHERE spotify_id = '1134COXJLBupGpZ1sonOWY'), (SELECT artist_id FROM artist WHERE name = 'Wolfgang Amadeus Mozart') ),
( (SELECT song_id FROM songs WHERE spotify_id = '4kF394GKEnI13QdZBM9mxM'), (SELECT artist_id FROM artist WHERE name = 'Ella Fitzgerald') ),
( (SELECT song_id FROM songs WHERE spotify_id = '10EDH2xbcota8LOtQlABRw'), (SELECT artist_id FROM artist WHERE name = 'Buddha Trixie') ),
( (SELECT song_id FROM songs WHERE spotify_id = '5hUCTgttGB1eS4GJdPEQEM'), (SELECT artist_id FROM artist WHERE name = 'The Pale Saints') ),
( (SELECT song_id FROM songs WHERE spotify_id = '3EUl8M6SzxZl03NPkB8mUd'), (SELECT artist_id FROM artist WHERE name = 'Brooks & Dunn') ),
( (SELECT song_id FROM songs WHERE spotify_id = '449LuMpoIOhxnW2B246Aau'), (SELECT artist_id FROM artist WHERE name = 'Title Fight') ),
( (SELECT song_id FROM songs WHERE spotify_id = '5ZLzl6T8JwqMTMdoE0nCbU'), (SELECT artist_id FROM artist WHERE name = 'Grateful Dead') ),
( (SELECT song_id FROM songs WHERE spotify_id = '0mJQlCl9YgxW7kyeltNiVk'), (SELECT artist_id FROM artist WHERE name = 'Grateful Dead') );

-- 5. Insert Reviews
INSERT INTO review (user_id, song_id, title, review_text, rating) VALUES
-- Originals
( (SELECT user_id FROM users WHERE username = 'retro_groover'), (SELECT song_id FROM songs WHERE spotify_id = '1lNRVjK8MukRZpeurYssIx'), 'Iconic Bassline', 'The bassline in this is absolutely iconic.', 5 ),
( (SELECT user_id FROM users WHERE username = 'indie_vibe_check'), (SELECT song_id FROM songs WHERE spotify_id = '6aBUnkXuCEQQHAlTokv9or'), 'Home', 'The quintessential home song.', 5 ),
-- New Reviews (Mocked based on users personalities)
( (SELECT user_id FROM users WHERE username = 'indie_vibe_check'), (SELECT song_id FROM songs WHERE spotify_id = '3TltuDrcQHAvg5KZntDVnS'), 'Gritty', 'The adlibs on this track are insane.', 4 ),
( (SELECT user_id FROM users WHERE username = 'retro_groover'), (SELECT song_id FROM songs WHERE spotify_id = '7vpkmzisaB8R47XlxyTcfs'), 'Soulful', 'Marvin can do no wrong. Makes me want to cry.', 5 ),
( (SELECT user_id FROM users WHERE username = 'pop_anthem_fan'), (SELECT song_id FROM songs WHERE spotify_id = '1NeLwFETswx8Fzxl2AFl91'), 'Vibes', 'This is the perfect late night drive song.', 5 ),
( (SELECT user_id FROM users WHERE username = 'indie_vibe_check'), (SELECT song_id FROM songs WHERE spotify_id = '2tlhnUxHtYDqu0i9KIraUu'), 'Haunting', 'Nick Drake was gone too soon. Beautiful guitar work.', 4 ),
( (SELECT user_id FROM users WHERE username = 'indie_vibe_check'), (SELECT song_id FROM songs WHERE spotify_id = '1bAZV1EBTRi9t1cVg75i8t'), 'Lo-fi Masterpiece', 'The drums in the beginning are everything.', 5 ),
( (SELECT user_id FROM users WHERE username = 'retro_groover'), (SELECT song_id FROM songs WHERE spotify_id = '1134COXJLBupGpZ1sonOWY'), 'Heavy', 'One of his darker pieces, absolutely compelling.', 5 ),
( (SELECT user_id FROM users WHERE username = 'retro_groover'), (SELECT song_id FROM songs WHERE spotify_id = '4kF394GKEnI13QdZBM9mxM'), 'Standards', 'Ella has the voice of an angel. A jazz standard.', 5 ),
( (SELECT user_id FROM users WHERE username = 'indie_vibe_check'), (SELECT song_id FROM songs WHERE spotify_id = '10EDH2xbcota8LOtQlABRw'), 'Up and coming', 'Love finding new bands like this.', 4 ),
( (SELECT user_id FROM users WHERE username = 'indie_vibe_check'), (SELECT song_id FROM songs WHERE spotify_id = '5hUCTgttGB1eS4GJdPEQEM'), 'Dreamy', 'Shoegaze perfection. The reverb is just right.', 4 ),
( (SELECT user_id FROM users WHERE username = 'pop_anthem_fan'), (SELECT song_id FROM songs WHERE spotify_id = '3EUl8M6SzxZl03NPkB8mUd'), 'Line Dancing', 'Not usually my thing but this song slaps.', 4 ),
( (SELECT user_id FROM users WHERE username = 'indie_vibe_check'), (SELECT song_id FROM songs WHERE spotify_id = '449LuMpoIOhxnW2B246Aau'), 'Shoegaze Era', 'Title Fight really changed their sound here and it worked.', 5 ),
( (SELECT user_id FROM users WHERE username = 'retro_groover'), (SELECT song_id FROM songs WHERE spotify_id = '5ZLzl6T8JwqMTMdoE0nCbU'), 'Acoustic Dead', 'My favorite acoustic track by them. The lyrics tell such a story.', 5 ),
( (SELECT user_id FROM users WHERE username = 'retro_groover'), (SELECT song_id FROM songs WHERE spotify_id = '0mJQlCl9YgxW7kyeltNiVk'), 'MTV Era', 'A bit commercial but still a classic.', 4 );