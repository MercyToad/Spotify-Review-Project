//(FROM LAB 7)
//-------------Import dependencies--------------------//
const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

//(FROM LAB 7)
//-------------Connect to database--------------------//

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    times: function (n, block) {
      let accum = '';
      for (let i = 0; i < n; ++i) {
        accum += block.fn(i);
      }
      return accum;
    },
    subtract: function (a, b) {
      return a - b;
    },
    default: function (value, defaultValue) {
      return value != null ? value : defaultValue;
    },
    range: function (start, end) {
      const result = [];
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
      return result;
    },
    gte: function (a, b) {
      return a >= b;
    },
    math: function (lvalue, operator, rvalue, options) {
      lvalue = parseFloat(lvalue);
      rvalue = parseFloat(rvalue);
      let result;

      if (isNaN(lvalue) || isNaN(rvalue)) {
        return '';
      }

      switch (operator) {
        case '+':
          result = lvalue + rvalue;
          break;
        case '-':
          result = lvalue - rvalue;
          break;
        case '*':
          result = lvalue * rvalue;
          break;
        case '/':
          result = lvalue / rvalue;
          break;
        case '%':
          result = lvalue % rvalue;
          break;
        default:
          return '';
      }

      // Handle additional operations like floor, ceil, round
      if (options && options.hash) {
        if (options.hash.floor) {
          result = Math.floor(result);
        } else if (options.hash.ceil) {
          result = Math.ceil(result);
        } else if (options.hash.round) {
          result = Math.round(result);
        }
      }

      return result;
    },
    mod: function (a, b) {
      return a % b;
    },
    pad: function (value, length, char) {
      value = String(value);
      char = char || '0';
      while (value.length < length) {
        value = char + value;
      }
      return value;
    },
    json: function (context) {
      return JSON.stringify(context);
    },
    substr: function (str, start, length, options) {
      if (!str) return '';
      str = String(str);
      start = parseInt(start) || 0;
      length = parseInt(length) || 1;
      if (start < 0) start = 0;
      if (start >= str.length) return '';
      return str.substring(start, start + length);
    },
    parseFloat: function (value) {
      return parseFloat(value) || 0;
    },
    eq: function (a, b) {
      return a == b;
    },
    lookup: function (obj, key) {
      return obj && obj[key] !== undefined ? obj[key] : null;
    },
    gt: function (a, b) {
      return a > b;
    }
  }
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// database configuration
const dbConfig = {
  host: 'process.env.HOST', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// Middleware
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

// Initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

const bearer_token = `Bearer ${process.env.API_KEY}`;



app.use(
  express.static(path.join(__dirname, 'resourses'))
);

// Root route — serve public landing page
app.get('/', async (req, res) => {
  const username = req.session && req.session.user ? req.session.user.username : null;
  const query = 'SELECT spotify_id FROM songs ORDER BY average_rating DESC LIMIT 7'
  const song_ids = await db.any(query);
  songs = [];
  for (const i of song_ids) {
    const response = await fetch(`https://api.spotify.com/v1/tracks/$${i.spotify_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': bearer_token,
      },
    });
    const data = await response.json();
    songs.push(data);
  }
  console.log(songs);
  return res.render('pages/public', {
    layout: 'main',
    username,
    songs: songs
  });
});

// In-memory store for user reviews added via song detail page (mock persistence)
// Shape: { [username]: [ { songId, title, artist, artworkUrl, rating, reviewText, createdAt, timestamp } ] }
const userReviewStore = {};

// In-memory store for deleted reviews so My Reviews and Home widgets can stay in sync
// Shape: { [username]: [ songId, ... ] }
const deletedReviewStore = {};

// In-memory store of per-song aggregate stats (average rating, review count) as last
// calculated on the song detail page. Used so home/discover cards can show the same
// final star rating and review count that you see on the song detail view.
// Shape: { [songId]: { averageRating: number, reviewCount: number } }
const songStatsStore = {};

// Minimal My Reviews route (mock data + in-memory user reviews)
app.get('/my-reviews', (req, res) => {
  const username = req.session && req.session.user ? req.session.user.username : 'User';

  // Base fake reviews for the user - seed with 6 reviews
  const baseReviews = [
    { title: 'Watermelon Sugar', artist: 'Harry Styles', artworkUrl: 'https://placehold.co/120x120/06b6d4/white?text=WS', rating: 4, reviewText: 'Such a feel-good track! Perfect for summer vibes.', createdAt: '2h ago', songId: 'watermelonsugar', timestamp: Date.now() - (2 * 60 * 60 * 1000) },
    { title: 'Don\'t Start Now', artist: 'Dua Lipa', artworkUrl: 'https://placehold.co/120x120/f97316/white?text=DSN', rating: 5, reviewText: 'Perfect dance track! Can\'t stop listening.', createdAt: '1 day ago', songId: 'dontstartnow', timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000) },
    { title: 'Blinding Lights', artist: 'The Weeknd', artworkUrl: 'https://placehold.co/120x120/f43f5e/white?text=BL', rating: 5, reviewText: 'Absolute banger! The synth is incredible.', createdAt: '3 days ago', songId: 'example1', timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) },
    { title: 'Levitating', artist: 'Dua Lipa', artworkUrl: 'https://placehold.co/120x120/8b5cf6/white?text=LV', rating: 4, reviewText: 'Perfect summer vibes. Love the production.', createdAt: '1 week ago', songId: 'example2', timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000) },
    { title: 'Flowers', artist: 'Miley Cyrus', artworkUrl: 'https://placehold.co/120x120/eab308/white?text=FL', rating: 5, reviewText: 'Amazing energy! Can\'t stop listening.', createdAt: '2 weeks ago', songId: 'example4', timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000) },
    { title: 'Kill Bill', artist: 'SZA', artworkUrl: 'https://placehold.co/120x120/10b981/white?text=KB', rating: 5, reviewText: 'One of my favorite tracks right now.', createdAt: '3 weeks ago', songId: 'example5', timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000) }
  ];

  // Merge in any user-added reviews from the in-memory store (one per songId)
  const dynamic = userReviewStore[username] || [];
  const deletedIds = deletedReviewStore[username] || [];
  const mergedMap = new Map();

  // Seed base reviews unless they've been deleted
  baseReviews.forEach(r => {
    if (!deletedIds.includes(r.songId)) {
      mergedMap.set(r.songId, r);
    }
  });
  // Overlay any dynamic user reviews, also respecting deletions
  dynamic.forEach(r => {
    if (!deletedIds.includes(r.songId)) {
      mergedMap.set(r.songId, r);
    }
  }); // overwrite base if same songId

  const mergedReviews = Array.from(mergedMap.values())
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  res.render('pages/my-reviews', {
    layout: 'main',
    username: username,
    reviews: mergedReviews
  });
});

app.get('/welcome', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Welcome!' });
});

// Login Page GET
app.get('/login', (req, res) => {
  res.render('pages/login', { layout: 'auth' });
});

// Discover Page
app.get('/discover', (req, res) => {
  res.render('pages/discover');
});

// Genre Page
app.get('/genre/:genre', async (req, res) => {
  const genre = req.params.genre;
  const username = req.session && req.session.user ? req.session.user.username : null;

  // Map genre slugs to Spotify search terms
  const genreMap = {
    'pop': 'genre:pop',
    'hip-hop': 'genre:hip hop',
    'rock': 'genre:rock',
    'indie': 'genre:indie',
    'electronic': 'genre:electronic',
    'rnb': 'genre:R&B',
    'country': 'genre:country',
    'jazz': 'genre:jazz',
    'classical': 'genre:classical',
    'metal': 'genre:metal'
  };

  const genreName = genre.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const spotifyGenre = genreMap[genre] || genre;

  try {
    // Search Spotify for tracks in this genre
    const params = new URLSearchParams({
      'q': spotifyGenre,
      'type': 'track',
      'limit': 20,
    });

    const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': bearer_token,
      },
    });

    let songs = [];
    let albums = [];

    if (response.ok) {
      const data = await response.json();
      songs = data.tracks ? data.tracks.items.slice(0, 10) : [];
    }

    // Also search for albums in this genre
    try {
      const albumParams = new URLSearchParams({
        'q': spotifyGenre,
        'type': 'album',
        'limit': 10,
      });

      const albumResponse = await fetch(`https://api.spotify.com/v1/search?${albumParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': bearer_token,
        },
      });

      if (albumResponse.ok) {
        const albumData = await albumResponse.json();
        albums = albumData.albums ? albumData.albums.items : [];
      }
    } catch (err) {
      console.error('Error fetching albums:', err);
    }

    res.render('pages/genre', {
      layout: 'main',
      username: username,
      genreName: genreName,
      songs: songs,
      albums: albums
    });
  } catch (error) {
    console.error('Error fetching genre songs:', error);
    res.render('pages/genre', {
      layout: 'main',
      username: username,
      genreName: genreName,
      songs: []
    });
  }
});

// Settings Page
app.get('/settings', (req, res) => {
  res.render('pages/settings');
});

// Profile Page
app.get('/profile', async (req, res) => {
  const username = req.session && req.session.user ? req.session.user.username : null;
  let joinDate = null;

  if (username) {
    try {
      const user = await db.oneOrNone('SELECT created_at FROM users WHERE username = $1', [username]);
      if (user && user.created_at) {
        // Format date as "Month Day, Year" (e.g., "January 15, 2024")
        const date = new Date(user.created_at);
        joinDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error fetching user join date:', error);
    }
  }

  res.render('pages/profile', {
    layout: 'main',
    username: username,
    joinDate: joinDate
  });
});

// Add Review POST route
app.post('/add-review', async (req, res) => {
  const { songId, rating, reviewText, songTitle, artistName, artworkUrl } = req.body;
  let username = req.session && req.session.user ? req.session.user.username : null;

  // For mock auth, allow review submission even without session
  // In production, this would require proper authentication
  if (!username) {
    // Use default username for mock auth
    username = 'User';
  }

  // Validate required fields
  if (!songId || !rating) {
    return res.redirect(`/song/${songId || 'error'}?error=missing_fields`);
  }

  // Mock persistence: store this review in memory so it appears on My Reviews and Home
  const now = Date.now();
  const storedReview = {
    title: songTitle || 'Unknown Title',
    artist: artistName || 'Unknown Artist',
    artworkUrl: artworkUrl || 'https://placehold.co/120x120/1DB954/white?text=SR',
    rating: parseInt(rating, 10) || 0,
    reviewText: reviewText || '',
    createdAt: 'Just now',
    songId,
    timestamp: now
  };
  if (!userReviewStore[username]) {
    userReviewStore[username] = [];
  }
  // Ensure only one review per song for this user
  const existingIndex = userReviewStore[username].findIndex(r => r.songId === songId);
  if (existingIndex >= 0) {
    userReviewStore[username][existingIndex] = storedReview;
  } else {
    userReviewStore[username].push(storedReview);
  }

  // If a review is (re)created for this song, ensure it's no longer marked as deleted
  if (deletedReviewStore[username]) {
    deletedReviewStore[username] = deletedReviewStore[username].filter(id => id !== songId);
  }

  // For now, redirect back to song page with query params to show the new review
  const params = new URLSearchParams({
    reviewed: 'true',
    rating: rating || '5',
    reviewText: reviewText || ''
  });
  return res.redirect(`/song/${songId}?${params.toString()}`);
});

// Song/Album Detail Page
app.get('/song/:id', async (req, res) => {
  const songId = req.params.id;
  // Check session first, then check for mock auth in cookies/query (for development)
  let username = req.session && req.session.user ? req.session.user.username : null;
  // If no session username, use a default for mock auth scenarios
  // In production, this would come from actual session
  if (!username) {
    // For development: assume user is logged in if they have reviews
    // In production, this would be handled by proper session management
    username = 'User'; // Default username for mock auth
  }

  let track = null;
  let releaseYear = null;

  // Handle placeholder/example IDs - must match what's displayed on cards
  const placeholderSongs = {
    'example1': {
      id: 'example1',
      name: 'Blinding Lights',
      artists: [{ name: 'The Weeknd' }],
      album: {
        name: 'After Hours',
        images: [{ url: 'https://placehold.co/400x400/f43f5e/white?text=Weeknd' }],
        release_date: '2019-11-29'
      }
    },
    'example2': {
      id: 'example2',
      name: 'Levitating',
      artists: [{ name: 'Dua Lipa' }],
      album: {
        name: 'Future Nostalgia',
        images: [{ url: 'https://placehold.co/400x400/8b5cf6/white?text=Dua' }],
        release_date: '2020-03-27'
      }
    },
    'example3': {
      id: 'example3',
      name: 'As It Was',
      artists: [{ name: 'Harry Styles' }],
      album: {
        name: "Harry's House",
        images: [{ url: 'https://placehold.co/400x400/06b6d4/white?text=Harry' }],
        release_date: '2022-04-01'
      }
    },
    'example4': {
      id: 'example4',
      name: 'Flowers',
      artists: [{ name: 'Miley Cyrus' }],
      album: {
        name: 'Endless Summer Vacation',
        images: [{ url: 'https://placehold.co/400x400/eab308/white?text=Miley' }],
        release_date: '2023-01-13'
      }
    },
    'example5': {
      id: 'example5',
      name: 'Kill Bill',
      artists: [{ name: 'SZA' }],
      album: {
        name: 'SOS',
        images: [{ url: 'https://placehold.co/400x400/10b981/white?text=SZA' }],
        release_date: '2022-12-09'
      }
    },
    'album1': {
      id: 'album1',
      name: 'After Hours',
      artists: [{ name: 'The Weeknd' }],
      album: {
        name: 'After Hours',
        images: [{ url: 'https://placehold.co/400x400/0284c7/white?text=After+Hours' }],
        release_date: '2020-03-20'
      }
    },
    'album2': {
      id: 'album2',
      name: 'Future Nostalgia',
      artists: [{ name: 'Dua Lipa' }],
      album: {
        images: [{ url: 'https://placehold.co/400x400/ec4899/white?text=FN' }],
        release_date: '2020-03-27'
      }
    },
    'album3': {
      id: 'album3',
      name: 'SOUR',
      artists: [{ name: 'Olivia Rodrigo' }],
      album: {
        images: [{ url: 'https://placehold.co/400x400/8b5cf6/white?text=SOUR' }],
        release_date: '2021-05-21'
      }
    },
    'album4': {
      id: 'album4',
      name: 'Midnights',
      artists: [{ name: 'Taylor Swift' }],
      album: {
        images: [{ url: 'https://placehold.co/400x400/6366f1/white?text=Mid' }],
        release_date: '2022-10-21'
      }
    },
    'album5': {
      id: 'album5',
      name: 'Planet Her',
      artists: [{ name: 'Doja Cat' }],
      album: {
        images: [{ url: 'https://placehold.co/400x400/f43f5e/white?text=PH' }],
        release_date: '2021-06-25'
      }
    },
    'watermelonsugar': {
      id: 'watermelonsugar',
      name: 'Watermelon Sugar',
      artists: [{ name: 'Harry Styles' }],
      album: {
        name: 'Fine Line',
        images: [{ url: 'https://placehold.co/400x400/06b6d4/white?text=WS' }],
        release_date: '2019-11-16'
      }
    },
    'dontstartnow': {
      id: 'dontstartnow',
      name: 'Don\'t Start Now',
      artists: [{ name: 'Dua Lipa' }],
      album: {
        name: 'Future Nostalgia',
        images: [{ url: 'https://placehold.co/400x400/f97316/white?text=DSN' }],
        release_date: '2019-10-31'
      }
    },
    'physical': {
      id: 'physical',
      name: 'Physical',
      artists: [{ name: 'Dua Lipa' }],
      album: {
        name: 'Future Nostalgia',
        images: [{ url: 'https://placehold.co/400x400/f97316/white?text=P' }],
        release_date: '2020-01-30'
      }
    },
    'antihero': {
      id: 'antihero',
      name: 'Anti-Hero',
      artists: [{ name: 'Taylor Swift' }],
      album: {
        name: 'Midnights',
        images: [{ url: 'https://placehold.co/400x400/8b5cf6/white?text=AH' }],
        release_date: '2022-10-21'
      }
    },
    'unholy': {
      id: 'unholy',
      name: 'Unholy',
      artists: [{ name: 'Sam Smith' }],
      album: {
        name: 'Gloria',
        images: [{ url: 'https://placehold.co/400x400/f97316/white?text=UH' }],
        release_date: '2023-01-27'
      }
    },
    'richflex': {
      id: 'richflex',
      name: 'Rich Flex',
      artists: [{ name: 'Drake' }],
      album: {
        name: 'Her Loss',
        images: [{ url: 'https://placehold.co/400x400/06b6d4/white?text=RF' }],
        release_date: '2022-11-04'
      }
    },
    'badhabit': {
      id: 'badhabit',
      name: 'Bad Habit',
      artists: [{ name: 'Steve Lacy' }],
      album: {
        name: 'Gemini Rights',
        images: [{ url: 'https://placehold.co/400x400/eab308/white?text=BH' }],
        release_date: '2022-07-15'
      }
    },
    'goldenhour': {
      id: 'goldenhour',
      name: 'Golden Hour',
      artists: [{ name: 'JVKE' }],
      album: {
        name: 'Golden Hour',
        images: [{ url: 'https://placehold.co/400x400/10b981/white?text=GH' }],
        release_date: '2022-09-23'
      }
    }
  };

  try {
    if (placeholderSongs[songId]) {
      track = placeholderSongs[songId];
      releaseYear = track.album.release_date.split('-')[0];
    } else {
      // Fetch song details from Spotify API
      const response = await fetch(`https://api.spotify.com/v1/tracks/${songId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': bearer_token,
        },
      });

      if (!response.ok) {
        // If track not found, render error page or redirect
        return res.status(404).render('pages/song-detail', {
          layout: 'main',
          username: username,
          track: { name: 'Song Not Found', artists: [{ name: 'Unknown' }], album: { images: [] } },
          releaseYear: null,
          reviews: [],
          averageRating: '0.0',
          reviewCount: 0,
          userHasReviewed: false,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          ratingPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }

      track = await response.json();

      // Extract year from release_date (format: YYYY-MM-DD or YYYY)
      if (track.album && track.album.release_date) {
        const dateStr = track.album.release_date;
        releaseYear = dateStr.split('-')[0]; // Extract year from YYYY-MM-DD format
      }
    }

    // Generate fake reviews (max 3) - use consistent reviews based on song ID
    const fakeUsernames = ['musiclover23', 'soundwave99', 'melody_maker', 'tune_seeker', 'audio_fan'];

    // Special reviews for specific songs - ensure ratings match what's shown on cards
    let reviews = [];
    if (songId === 'example1') {
      // Blinding Lights - card shows 4.5, need exactly 4.5 average: (5+4+4.5) not possible, so use (5+5+4)/3 = 4.67
      // Actually, to get 4.5 exactly with whole numbers: (5+4+4)/3 = 4.33, or (5+5+4)/3 = 4.67
      // Let's use 4 reviews: (5+5+4+4)/4 = 4.5 exactly
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'Absolutely love this track! The production is incredible.',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 45,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 5,
          reviewText: 'Great vibes! Perfect for my playlist.',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 32,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 4,
          reviewText: 'Solid track, really catchy!',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 28,
          isCurrentUser: false
        },
        {
          username: 'tune_seeker',
          rating: 4,
          reviewText: 'Good song, but not my favorite.',
          createdAt: '2 weeks ago',
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000),
          likes: 20,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'album1') {
      // After Hours album - limit to 5 fake reviews, still targeting ~4.8 average
      // (5+5+5+5+4) / 5 = 4.8 exactly
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'This album is a masterpiece! The Weeknd really outdid himself with this one.',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 60,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 5,
          reviewText: 'Great production and vocals. The whole album flows so well.',
          createdAt: '4 days ago',
          timestamp: Date.now() - (4 * 24 * 60 * 60 * 1000),
          likes: 48,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 5,
          reviewText: 'Absolutely love this album! Every track is a banger.',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 52,
          isCurrentUser: false
        },
        {
          username: 'tune_seeker',
          rating: 5,
          reviewText: 'Perfect blend of pop and R&B. A modern classic.',
          createdAt: '2 weeks ago',
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000),
          likes: 40,
          isCurrentUser: false
        },
        {
          username: 'audio_fan',
          rating: 4,
          reviewText: 'Great album overall, a few tracks stand out as amazing.',
          createdAt: '3 weeks ago',
          timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000),
          likes: 35,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'example2') {
      // Levitating - card shows 4.7, need exactly 4.7: (5+5+5+4)/4 = 4.75 ≈ 4.8, or (5+5+4+4)/4 = 4.5
      // Use 10 reviews: (7*5 + 3*4)/10 = (35+12)/10 = 4.7 exactly
      const fakeUsernames = ['musiclover23', 'soundwave99', 'melody_maker', 'tune_seeker', 'audio_fan', 'vinyl_collector', 'music_enthusiast'];
      reviews = [];
      // Generate 7 five-star reviews
      for (let i = 0; i < 7; i++) {
        reviews.push({
          username: fakeUsernames[i % fakeUsernames.length] + (i > 6 ? i : ''),
          rating: 5,
          reviewText: i === 0 ? 'Perfect summer vibes! Love the production.' : i === 1 ? 'Great dance track!' : 'One of my favorites this year!',
          createdAt: `${i + 1} ${i === 0 ? 'day' : 'days'} ago`,
          timestamp: Date.now() - ((i + 1) * 24 * 60 * 60 * 1000),
          likes: 40 + (i * 3),
          isCurrentUser: false
        });
      }
      // Generate 3 four-star reviews
      for (let i = 0; i < 3; i++) {
        reviews.push({
          username: fakeUsernames[(i + 2) % fakeUsernames.length] + '_alt' + i,
          rating: 4,
          reviewText: 'Good track, really enjoy it!',
          createdAt: `${i + 8} days ago`,
          timestamp: Date.now() - ((i + 8) * 24 * 60 * 60 * 1000),
          likes: 25 + (i * 2),
          isCurrentUser: false
        });
      }
      // Total: 10 reviews, average = (7*5 + 3*4) / 10 = 4.7 exactly
    } else if (songId === 'example3') {
      // As It Was - card shows 4.8, need exactly 4.8: (5+5+5+4)/4 = 4.75 ≈ 4.8, or (5+5+4+4)/4 = 4.5
      // To get 4.8 exactly: (5+5+5+4)/4 = 4.75, close enough. Or use 5 reviews: (5+5+5+5+4)/5 = 4.8 exactly
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'This song hits different. So emotional!',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 55,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 5,
          reviewText: 'Beautiful melody and lyrics.',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 40,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 5,
          reviewText: 'Perfect for any mood.',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 45,
          isCurrentUser: false
        },
        {
          username: 'tune_seeker',
          rating: 5,
          reviewText: 'One of my all-time favorites!',
          createdAt: '2 weeks ago',
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000),
          likes: 50,
          isCurrentUser: false
        },
        {
          username: 'audio_fan',
          rating: 4,
          reviewText: 'Great song, really enjoy it.',
          createdAt: '3 weeks ago',
          timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000),
          likes: 35,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'example4') {
      // Flowers - card shows 4.6, need exactly 4.6: (5+5+4)/3 = 4.67 ≈ 4.7, or (5+4+4)/3 = 4.33
      // Use 5 reviews: (5+5+5+4+4)/5 = 4.6 exactly
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'Amazing energy! Can\'t stop listening.',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 48,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 5,
          reviewText: 'Great empowerment anthem!',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 38,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 5,
          reviewText: 'The artist really delivered on this one.',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 52,
          isCurrentUser: false
        },
        {
          username: 'tune_seeker',
          rating: 4,
          reviewText: 'Good song, catchy melody.',
          createdAt: '2 weeks ago',
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000),
          likes: 30,
          isCurrentUser: false
        },
        {
          username: 'audio_fan',
          rating: 4,
          reviewText: 'Enjoyable track!',
          createdAt: '3 weeks ago',
          timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000),
          likes: 25,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'example5') {
      // Kill Bill - card shows 4.9
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'Absolute banger! The synth is incredible.',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 65,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 5,
          reviewText: 'One of my favorites this year!',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 58,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 5,
          reviewText: 'Perfect for any mood.',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 70,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'watermelonsugar') {
      // Watermelon Sugar - from recent reviews, shows 4.5, reviews: (5+4)/2 = 4.5
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'Such a feel-good track! Perfect for summer vibes.',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 42,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 4,
          reviewText: 'Great vibes!',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 30,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'dontstartnow') {
      // Don't Start Now - card shows 4.6
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'Perfect dance track!',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 46,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 4,
          reviewText: 'Great production!',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 34,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 5,
          reviewText: 'Love this song!',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 48,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'physical') {
      // Physical - card shows 4.3, need exactly 4.3: (4+4+5)/3 = 4.33 ≈ 4.3
      reviews = [
        {
          username: 'musiclover23',
          rating: 4,
          reviewText: 'Great workout song!',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 28,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 4,
          reviewText: 'Energetic and fun!',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 25,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 5,
          reviewText: 'Perfect for the gym!',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 35,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'antihero') {
      // Anti-Hero - card shows 4.5, need exactly 4.5: (5+5+4+4)/4 = 4.5
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'Taylor Swift at her best! Love the lyrics.',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 50,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 5,
          reviewText: 'Incredible songwriting and production.',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 45,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 4,
          reviewText: 'Great track, really catchy!',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 38,
          isCurrentUser: false
        },
        {
          username: 'tune_seeker',
          rating: 4,
          reviewText: 'Solid song from Midnights.',
          createdAt: '2 weeks ago',
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000),
          likes: 32,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'unholy') {
      // Unholy - card shows 4.2, need exactly 4.2: (5+4+4+4)/4 = 4.25 ≈ 4.2, or use (4+4+4+4+5)/5 = 4.2
      reviews = [
        {
          username: 'musiclover23',
          rating: 4,
          reviewText: 'Great collaboration!',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 40,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 4,
          reviewText: 'Catchy and unique sound.',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 35,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 4,
          reviewText: 'Interesting production!',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 30,
          isCurrentUser: false
        },
        {
          username: 'tune_seeker',
          rating: 4,
          reviewText: 'Good track overall.',
          createdAt: '2 weeks ago',
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000),
          likes: 28,
          isCurrentUser: false
        },
        {
          username: 'audio_fan',
          rating: 5,
          reviewText: 'Love this song!',
          createdAt: '3 weeks ago',
          timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000),
          likes: 42,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'richflex') {
      // Rich Flex - card shows 3.8, need exactly 3.8: (4+4+4+4+3)/5 = 3.8
      reviews = [
        {
          username: 'musiclover23',
          rating: 4,
          reviewText: 'Solid track from Her Loss.',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 35,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 4,
          reviewText: 'Good collaboration.',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 30,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 4,
          reviewText: 'Decent track.',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 28,
          isCurrentUser: false
        },
        {
          username: 'tune_seeker',
          rating: 4,
          reviewText: 'Not bad, but not my favorite.',
          createdAt: '2 weeks ago',
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000),
          likes: 25,
          isCurrentUser: false
        },
        {
          username: 'audio_fan',
          rating: 3,
          reviewText: 'Okay track.',
          createdAt: '3 weeks ago',
          timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000),
          likes: 20,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'badhabit') {
      // Bad Habit - card shows 4.8, need exactly 4.8: (5+5+5+5+4)/5 = 4.8
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'Amazing song! Steve Lacy is incredible.',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 55,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 5,
          reviewText: 'Love the vibe of this track!',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 50,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 5,
          reviewText: 'Perfect summer song!',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 48,
          isCurrentUser: false
        },
        {
          username: 'tune_seeker',
          rating: 5,
          reviewText: 'One of my favorites!',
          createdAt: '2 weeks ago',
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000),
          likes: 45,
          isCurrentUser: false
        },
        {
          username: 'audio_fan',
          rating: 4,
          reviewText: 'Great track!',
          createdAt: '3 weeks ago',
          timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000),
          likes: 40,
          isCurrentUser: false
        }
      ];
    } else if (songId === 'goldenhour') {
      // Golden Hour - card shows 4.4, need exactly 4.4: (5+5+4+4+4)/5 = 4.4
      reviews = [
        {
          username: 'musiclover23',
          rating: 5,
          reviewText: 'Beautiful song! JVKE is so talented.',
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 48,
          isCurrentUser: false
        },
        {
          username: 'soundwave99',
          rating: 5,
          reviewText: 'Love the emotional depth!',
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 42,
          isCurrentUser: false
        },
        {
          username: 'melody_maker',
          rating: 4,
          reviewText: 'Great track, really enjoy it.',
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 38,
          isCurrentUser: false
        },
        {
          username: 'tune_seeker',
          rating: 4,
          reviewText: 'Good song overall.',
          createdAt: '2 weeks ago',
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000),
          likes: 35,
          isCurrentUser: false
        },
        {
          username: 'audio_fan',
          rating: 4,
          reviewText: 'Nice track!',
          createdAt: '3 weeks ago',
          timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000),
          likes: 32,
          isCurrentUser: false
        }
      ];
    } else {
      // Create consistent reviews based on song ID hash for other songs
      const songIdHash = songId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

      // Different review texts for variety
      const reviewTexts = [
        'Absolutely love this track! The production is incredible.',
        'Great vibes! Perfect for my playlist.',
        'This song never gets old. Classic!',
        'Amazing energy! Can\'t stop listening.',
        'Beautiful melody and lyrics.',
        'One of my favorites this year!',
        'Perfect for any mood.',
        'The artist really delivered on this one.'
      ];

      const reviewSeeds = [
        {
          username: fakeUsernames[songIdHash % fakeUsernames.length],
          rating: 3 + (songIdHash % 3), // 3-5 stars
          reviewText: reviewTexts[songIdHash % reviewTexts.length],
          createdAt: '2 days ago',
          timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
          likes: 10 + (songIdHash % 90),
          isCurrentUser: false
        },
        {
          username: fakeUsernames[(songIdHash + 1) % fakeUsernames.length],
          rating: 3 + ((songIdHash + 1) % 3),
          reviewText: reviewTexts[(songIdHash + 1) % reviewTexts.length],
          createdAt: '5 days ago',
          timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
          likes: 10 + ((songIdHash + 1) % 90),
          isCurrentUser: false
        },
        {
          username: fakeUsernames[(songIdHash + 2) % fakeUsernames.length],
          rating: 3 + ((songIdHash + 2) % 3),
          reviewText: reviewTexts[(songIdHash + 2) % reviewTexts.length],
          createdAt: '1 week ago',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
          likes: 10 + ((songIdHash + 2) % 90),
          isCurrentUser: false
        }
      ];

      // Take 1-3 reviews based on hash to ensure different review counts per song
      const numReviews = 1 + (songIdHash % 3);
      reviews = reviewSeeds.slice(0, numReviews);
    }

    // Check if user just submitted a review (from query params)
    const justReviewed = req.query.reviewed === 'true';
    const isEdited = req.query.edited === 'true';
    const isDeleted = req.query.deleted === 'true';

    let userHasReviewed = false;
    let userReview = null;

    // Resolve current user's review for this song from the single shared store:
    // 1) dynamic in-memory reviews (authoritative once user has interacted)
    // 2) base seed reviews (only if no dynamic entry yet), via the same data used on My Reviews/Home
    if (!isDeleted) {
      let seedUserData = null;

      // Check dynamic store first
      const dynamicList = userReviewStore[username] || [];
      const dynamicEntry = dynamicList.find(r => r.songId === songId);
      if (dynamicEntry) {
        seedUserData = {
          rating: dynamicEntry.rating,
          reviewText: dynamicEntry.reviewText,
          createdAt: dynamicEntry.createdAt,
          timestamp: dynamicEntry.timestamp,
        };
      } else {
        // Fallback: seed from the same base data used on My Reviews/Home
        const baseSeedMap = {
          'watermelonsugar': { rating: 4, reviewText: 'Such a feel-good track! Perfect for summer vibes.', createdAt: '2h ago', timestamp: Date.now() - (2 * 60 * 60 * 1000) },
          'dontstartnow': { rating: 5, reviewText: 'Perfect dance track! Can\'t stop listening.', createdAt: '1 day ago', timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000) },
          'example1': { rating: 5, reviewText: 'Absolute banger! The synth is incredible.', createdAt: '3 days ago', timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) },
          'example2': { rating: 4, reviewText: 'Perfect summer vibes. Love the production.', createdAt: '1 week ago', timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000) }
        };
        if (baseSeedMap[songId]) {
          seedUserData = baseSeedMap[songId];
        }
      }

      if (seedUserData) {
        // First check if such a review already exists in this song's reviews list
        const existingUserReview = reviews.find(r =>
          parseInt(r.rating) === parseInt(seedUserData.rating) &&
          r.reviewText === seedUserData.reviewText &&
          r.createdAt === seedUserData.createdAt &&
          (r.username === username || r.isCurrentUser)
        );

        if (existingUserReview) {
          existingUserReview.isCurrentUser = true;
          userHasReviewed = true;
          userReview = existingUserReview;
        } else {
          // Create a current-user review for this song based on the shared data
          userReview = {
            username: username || 'You',
            rating: seedUserData.rating,
            reviewText: seedUserData.reviewText,
            createdAt: seedUserData.createdAt,
            timestamp: seedUserData.timestamp,
            likes: 0,
            isCurrentUser: true,
            isEdited: false
          };
          reviews.unshift(userReview);
          userHasReviewed = true;
        }
      }
    }

    // Also check if username matches any existing review (for session-based auth)
    if (username && username !== 'Guest' && username !== 'User' && !userHasReviewed && !isDeleted) {
      reviews.forEach(review => {
        if (review.username && review.username.toLowerCase() === username.toLowerCase()) {
          review.isCurrentUser = true;
          userHasReviewed = true;
          userReview = review;
        }
      });
    }

    // Handle review submission/editing/deletion AFTER checking for existing user review
    if (isDeleted) {
      // Remove user's review from the list - check both by username match and isCurrentUser flag
      reviews = reviews.filter(r => {
        // Remove if it's marked as current user's review
        if (r.isCurrentUser) return false;
        // Also remove if username matches (for session-based auth)
        if (username && r.username && r.username.toLowerCase() === username.toLowerCase()) return false;
        return true;
      });
      userHasReviewed = false;
      userReview = null;

      // Also remove from in-memory My Reviews / Home store so deletion is reflected everywhere
      if (username && userReviewStore[username]) {
        userReviewStore[username] = userReviewStore[username].filter(r => r.songId !== songId);
      }
      // Track deletion so we can also filter seeded base reviews for this song
      if (username) {
        if (!deletedReviewStore[username]) {
          deletedReviewStore[username] = [];
        }
        if (!deletedReviewStore[username].includes(songId)) {
          deletedReviewStore[username].push(songId);
        }
      }
    } else if (justReviewed) {
      const userRating = parseInt(req.query.rating) || 5;
      const userReviewText = req.query.reviewText || '';

      if (isEdited) {
        // Update existing user review - find by isCurrentUser flag or username match
        let userReviewIndex = reviews.findIndex(r => r.isCurrentUser === true);
        if (userReviewIndex === -1 && username) {
          userReviewIndex = reviews.findIndex(r => r.username && r.username.toLowerCase() === username.toLowerCase());
        }
        if (userReviewIndex !== -1) {
          // Update review in this page's list
          reviews[userReviewIndex].rating = userRating;
          reviews[userReviewIndex].reviewText = userReviewText;
          reviews[userReviewIndex].createdAt = 'Just now';
          reviews[userReviewIndex].timestamp = Date.now();
          reviews[userReviewIndex].isEdited = true;
          reviews[userReviewIndex].isCurrentUser = true;
          userReview = reviews[userReviewIndex];
          userHasReviewed = true;

          // Mirror the edit into the in-memory My Reviews / Home store
          if (username) {
            if (!userReviewStore[username]) {
              userReviewStore[username] = [];
            }
            const artworkUrl =
              (track && track.album && track.album.images && track.album.images[0] && track.album.images[0].url) ||
              'https://placehold.co/120x120/1DB954/white?text=SR';
            const artistName =
              (track && track.artists && track.artists[0] && track.artists[0].name) || 'Unknown Artist';
            const title = (track && track.name) || 'Unknown Title';

            const updatedStoredReview = {
              title,
              artist: artistName,
              artworkUrl,
              rating: userRating,
              reviewText: userReviewText || '',
              createdAt: 'Just now',
              songId,
              timestamp: reviews[userReviewIndex].timestamp || Date.now()
            };

            const existingIdx = userReviewStore[username].findIndex(r => r.songId === songId);
            if (existingIdx >= 0) {
              userReviewStore[username][existingIdx] = updatedStoredReview;
            } else {
              userReviewStore[username].push(updatedStoredReview);
            }
            // If user edits an existing review, make sure this song isn't treated as deleted
            if (deletedReviewStore[username]) {
              deletedReviewStore[username] = deletedReviewStore[username].filter(id => id !== songId);
            }
          }
        }
      } else {
        // New review via query params (should be rare; most new reviews go through POST /add-review)
        // Remove any existing user review first
        reviews = reviews.filter(r => !(r.username && r.username.toLowerCase() === username.toLowerCase() && r.isCurrentUser));
        // Add new user's review at the top
        userReview = {
          username: username,
          rating: userRating,
          reviewText: userReviewText,
          createdAt: 'Just now',
          timestamp: Date.now(),
          likes: 0,
          isCurrentUser: true,
          isEdited: false
        };
        reviews.unshift(userReview);
        userHasReviewed = true;

        // Persist this new review into the in-memory store as well
        if (username) {
          if (!userReviewStore[username]) {
            userReviewStore[username] = [];
          }
          const artworkUrl =
            (track && track.album && track.album.images && track.album.images[0] && track.album.images[0].url) ||
            'https://placehold.co/120x120/1DB954/white?text=SR';
          const artistName =
            (track && track.artists && track.artists[0] && track.artists[0].name) || 'Unknown Artist';
          const title = (track && track.name) || 'Unknown Title';

          const storedReview = {
            title,
            artist: artistName,
            artworkUrl,
            rating: userRating,
            reviewText: userReviewText || '',
            createdAt: 'Just now',
            songId,
            timestamp: userReview.timestamp || Date.now()
          };

          const existingIdxNew = userReviewStore[username].findIndex(r => r.songId === songId);
          if (existingIdxNew >= 0) {
            userReviewStore[username][existingIdxNew] = storedReview;
          } else {
            userReviewStore[username].push(storedReview);
          }
          // New review means this song should no longer be considered deleted
          if (deletedReviewStore[username]) {
            deletedReviewStore[username] = deletedReviewStore[username].filter(id => id !== songId);
          }
        }
      }
    }

    // Ensure user's review is at the top if it exists
    if (userReview && reviews.indexOf(userReview) > 0) {
      reviews = reviews.filter(r => r !== userReview);
      reviews.unshift(userReview);
    }

    // Calculate average rating from reviews (if any) - ALWAYS recalculate after edits/deletes
    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => {
        const rating = parseFloat(review.rating) || 0;
        return acc + rating;
      }, 0);
      averageRating = (sum / reviews.length).toFixed(1);
    }

    // Persist aggregate stats so home/discover cards can stay in sync with details page
    songStatsStore[songId] = {
      averageRating: parseFloat(averageRating) || 0,
      reviewCount: reviews.length,
    };

    // Calculate rating distribution (1-5 stars) - ALWAYS recalculate after edits/deletes
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    reviews.forEach(review => {
      const rating = parseInt(review.rating) || 0;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      }
    });

    // Calculate percentages for each rating
    const totalReviews = reviews.length;
    const ratingPercentages = {};
    for (let i = 1; i <= 5; i++) {
      // Store as number, not string, for easier JSON parsing
      ratingPercentages[i] = totalReviews > 0 ? parseFloat(((ratingDistribution[i] || 0) / totalReviews * 100).toFixed(0)) : 0;
    }

    // Debug logging
    console.log('Reviews count:', reviews.length);
    console.log('Average rating:', averageRating);
    console.log('Rating distribution:', ratingDistribution);
    console.log('Rating percentages:', ratingPercentages);

    res.render('pages/song-detail', {
      layout: 'main',
      username: username,
      track: track,
      releaseYear: releaseYear,
      reviews: reviews,
      averageRating: averageRating || '0.0',
      reviewCount: reviews.length,
      userHasReviewed: userHasReviewed,
      ratingDistribution: ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      ratingPercentages: ratingPercentages || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
  } catch (error) {
    console.error('Error fetching song details:', error);
    res.status(500).render('pages/song-detail', {
      layout: 'main',
      username: username,
      track: { name: 'Error Loading Song', artists: [{ name: 'Unknown' }], album: { images: [] } },
      releaseYear: null,
      reviews: [],
      averageRating: '0.0',
      reviewCount: 0,
      userHasReviewed: false,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      ratingPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
  }
});

// Login Page POST
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).render('pages/login', {
      layout: 'auth',
      error: 'Must enter username and password',
    });
  }

  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (!user) {
      return res.status(401).render('pages/login', {
        layout: 'auth',
        error: 'Username not found. Please register.',
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).render('pages/login', {
        layout: 'auth',
        error: 'Incorrect password.',
      });
    }

    req.session.user = { id: user.user_id, username: user.username };
    req.session.save(() => {
      return res.redirect('/home');
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).render('pages/login', {
      layout: 'auth',
      error: 'An error occurred during login. Please try again.',
    });
  }
});

// Register Page GET
app.get('/register', (req, res) => {
  res.render('pages/register', { layout: 'auth' });
});

// Register Page POST
app.post('/register', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).render('pages/register', {
      layout: 'auth',
      error: 'Must enter username and password',
    });
  }

  try {
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser) {
      return res.status(409).render('pages/register', {
        layout: 'auth',
        error: 'Username already exists. Please choose another.',
      });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.none('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
    return res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).render('pages/register', {
      layout: 'auth',
      error: 'An error occurred during registration. Please try again.',
    });
  }
});

// Authentication Middleware
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Home Page. If a user is logged in we pass the username, otherwise render public home.
app.get('/home', async (req, res) => {
  const username = req.session && req.session.user ? req.session.user.username : null;
  let songs;
  let highestRated = [];
  let recentReviews = [];

  // Fetch songs for the main grid - behaviour differs for public vs logged-in users
  if (!username) {
    const response = await fetch('https://api.spotify.com/v1/playlists/34NbomaTu7YuOYnky8nLXL/tracks?limit=3', { // hard coded top 50 playlist
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': bearer_token,
      },
    });
    const data = await response.json();
    songs = data.items;
    console.log(songs);
  } else {
    const query = 'SELECT spotify_id FROM songs ORDER BY average_rating DESC LIMIT 7';
    const song_ids = await db.any(query);
    // Logged-in experience uses the same recommended set used on the public landing
    songs = [];
    for (const i of song_ids) {
      const response = await fetch(`https://api.spotify.com/v1/tracks/$${i.spotify_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': bearer_token,
        },
      });
      const data = await response.json();
      songs.push(data);
    }
  }

  // Base user review data used across:
  // - My Reviews page
  // - Home \"Your Recent Reviews\"
  // - Home \"Your Highest Rated\"
  const baseUserReviews = [
    { title: 'Watermelon Sugar', artist: 'Harry Styles', artworkUrl: 'https://placehold.co/120x120/06b6d4/white?text=WS', rating: 4, reviewText: 'Such a feel-good track! Perfect for summer vibes.', createdAt: '2h ago', songId: 'watermelonsugar', timestamp: Date.now() - (2 * 60 * 60 * 1000) },
    { title: 'Don\'t Start Now', artist: 'Dua Lipa', artworkUrl: 'https://placehold.co/120x120/f97316/white?text=DSN', rating: 5, reviewText: 'Perfect dance track! Can\'t stop listening.', createdAt: '1 day ago', songId: 'dontstartnow', timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000) },
    { title: 'Blinding Lights', artist: 'The Weeknd', artworkUrl: 'https://placehold.co/120x120/f43f5e/white?text=BL', rating: 5, reviewText: 'Absolute banger! The synth is incredible.', createdAt: '3 days ago', songId: 'example1', timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) },
    { title: 'Levitating', artist: 'Dua Lipa', artworkUrl: 'https://placehold.co/120x120/8b5cf6/white?text=LV', rating: 4, reviewText: 'Perfect summer vibes. Love the production.', createdAt: '1 week ago', songId: 'example2', timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000) },
    { title: 'Flowers', artist: 'Miley Cyrus', artworkUrl: 'https://placehold.co/120x120/eab308/white?text=FL', rating: 5, reviewText: 'Amazing energy! Can\'t stop listening.', createdAt: '2 weeks ago', songId: 'example4', timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000) },
    { title: 'Kill Bill', artist: 'SZA', artworkUrl: 'https://placehold.co/120x120/10b981/white?text=KB', rating: 5, reviewText: 'One of my favorite tracks right now.', createdAt: '3 weeks ago', songId: 'example5', timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000) }
  ];

  // Merge in any dynamic user reviews
  const dynamicUserReviews = userReviewStore[username] || [];
  const deletedIdsHome = deletedReviewStore[username] || [];
  const mergedHomeMap = new Map();
  baseUserReviews.forEach(r => {
    if (!deletedIdsHome.includes(r.songId)) {
      mergedHomeMap.set(r.songId, r);
    }
  });
  dynamicUserReviews.forEach(r => {
    if (!deletedIdsHome.includes(r.songId)) {
      mergedHomeMap.set(r.songId, r);
    }
  });
  const mergedUserReviews = Array.from(mergedHomeMap.values());
  // Build a per-song stats map for the Trending Songs cards so they always match
  // the detail page's final rating and review count when available.
  const defaultSongStats = {
    example3: { averageRating: 4.7, reviewCount: 5 }, // As It Was
    example1: { averageRating: 5.0, reviewCount: 5 }, // Blinding Lights
    example2: { averageRating: 4.5, reviewCount: 4 }, // Levitating
    example4: { averageRating: 4.6, reviewCount: 5 }, // Flowers
    example5: { averageRating: 4.9, reviewCount: 5 }, // Kill Bill
    album1: { averageRating: 4.8, reviewCount: 5 }, // After Hours
  };

  const homeSongStats = {};
  Object.keys(defaultSongStats).forEach(id => {
    const stored = songStatsStore[id];
    const base = defaultSongStats[id];
    const avg = stored && typeof stored.averageRating === 'number'
      ? stored.averageRating
      : base.averageRating;
    const count = stored && typeof stored.reviewCount === 'number'
      ? stored.reviewCount
      : base.reviewCount;
    homeSongStats[id] = {
      averageRating: parseFloat(avg.toFixed ? avg.toFixed(1) : avg),
      reviewCount: count,
    };
  });

  // Highest Rated: use the merged review set, sorted by rating then recency.
  // Show top 5 so this widget has similar vertical height to the 2-row Trending Songs grid.
  highestRated = mergedUserReviews
    .slice()
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return (b.timestamp || 0) - (a.timestamp || 0);
    })
    .slice(0, 5);

  // Recent Reviews: show the 4 most recent reviews (same data as My Reviews plus any new ones).
  recentReviews = mergedUserReviews
    .slice()
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 4);

  return res.render('pages/home', {
    layout: 'main',
    username: username,
    songs: songs,
    highestRated: highestRated,
    recentReviews: recentReviews,
    homeSongStats: homeSongStats,
  });
});

// Logout
app.get('/logout', async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    // After logout, send user to the public landing page
    res.redirect('/');
  });
});

app.get('/searchResults', async (req, res) => {
  const query = req.query.song_name;
  const params = new URLSearchParams({
    'q': query,
    'type': 'track',
    'limit': 5,
  });
  console.log(params);
  const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': bearer_token,
    },
    // body: JSON.stringify(postData),
  });
  // console.log(response);
  const data = await response.json();
  console.log("data");
  console.log(data.tracks);
  res.json(data);
});

// starting the server and keeping the connection open to listen for more requests
// server?

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');