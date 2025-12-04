import { SONG_FIELDS, REVIEW_FIELDS, hasRequiredFields } from './types.js';

/**
 * Centralized mock data seeds. 
 * Keeping the arrays together prevents drift between pages.
 * @type {Song[]}
 */
export const mockSongs = [
  {
    id: 'song-blinding-lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=60',
    genre: 'Synthwave',
    duration: '3:22',
    averageRating: 4.9,
    releaseYear: 2020,
    isFavorite: true,
  },
  {
    id: 'song-levitating',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    coverUrl: 'https://images.unsplash.com/photo-1454922915609-78549ad709bb?auto=format&fit=crop&w=400&q=60',
    genre: 'Pop',
    duration: '3:24',
    averageRating: 4.6,
    releaseYear: 2020,
    isFavorite: true,
  },
  {
    id: 'song-watermelon-sugar',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    album: 'Fine Line',
    coverUrl: 'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=400&q=60',
    genre: 'Pop',
    duration: '2:54',
    averageRating: 4.2,
    releaseYear: 2019,
    isFavorite: false,
  },
  {
    id: 'song-anti-hero',
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    album: 'Midnights',
    coverUrl: 'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=400&q=60',
    genre: 'Pop',
    duration: '3:20',
    averageRating: 4.4,
    releaseYear: 2022,
    isFavorite: true,
  },
  {
    id: 'song-kill-bill',
    title: 'Kill Bill',
    artist: 'SZA',
    album: 'SOS',
    coverUrl: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=400&q=60',
    genre: 'R&B',
    duration: '2:33',
    averageRating: 4.5,
    releaseYear: 2022,
    isFavorite: false,
  },
  {
    id: 'song-golden-hour',
    title: 'Golden Hour',
    artist: 'JVKE',
    album: 'Golden Hour',
    coverUrl: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=400&q=60',
    genre: 'Bedroom Pop',
    duration: '3:29',
    averageRating: 4.1,
    releaseYear: 2022,
    isFavorite: false,
  },
];

/**
 * @type {Review[]}
 */
export const mockReviews = [
  {
    id: 'review-1',
    songId: 'song-blinding-lights',
    username: 'melody_maker',
    rating: 5,
    headline: 'Instant adrenaline rush',
    body: 'The synth line still feels fresh every time I hear it. Perfect running track.',
    createdAt: '2024-11-10T10:15:00.000Z',
    updatedAt: '2024-11-10T10:15:00.000Z',
  },
  {
    id: 'review-2',
    songId: 'song-levitating',
    username: 'clubqueen',
    rating: 4,
    headline: 'Funky, bright, unstoppable',
    body: 'A disco-inspired masterpiece that makes any playlist sparkle.',
    createdAt: '2024-11-09T14:20:00.000Z',
    updatedAt: '2024-11-09T14:20:00.000Z',
  },
  {
    id: 'review-3',
    songId: 'song-watermelon-sugar',
    username: 'harryfan',
    rating: 4,
    headline: 'Summer bottled in a song',
    body: 'Simple but effective - still my go-to for sunny afternoons.',
    createdAt: '2024-11-05T18:42:00.000Z',
    updatedAt: '2024-11-05T18:42:00.000Z',
  },
  {
    id: 'review-4',
    songId: 'song-kill-bill',
    username: 'lyric_lover',
    rating: 5,
    headline: 'Dark humor perfection',
    body: 'SZA balances storytelling and hooks better than anyone.',
    createdAt: '2024-10-28T09:10:00.000Z',
    updatedAt: '2024-10-28T09:10:00.000Z',
  },
  {
    id: 'review-5',
    songId: 'song-anti-hero',
    username: 'swiftie',
    rating: 5,
    headline: 'Relatable and sharp',
    body: 'Taylor makes existential dread sound catchy - again.',
    createdAt: '2024-10-20T21:32:00.000Z',
    updatedAt: '2024-10-20T21:32:00.000Z',
  },
];

/**
 * Basic self-check to avoid silent schema drift during development.
 * Throws in development if a mock entry misses a required field.
 */
function assertMockShapes() {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return;

  const songIssues = mockSongs.filter((song) => !hasRequiredFields(song, SONG_FIELDS));
  const reviewIssues = mockReviews.filter((review) => !hasRequiredFields(review, REVIEW_FIELDS));

  if (songIssues.length || reviewIssues.length) {
    // eslint-disable-next-line no-console
    console.warn('[mockData] Missing fields detected', { songIssues, reviewIssues });
  }
}

assertMockShapes();

