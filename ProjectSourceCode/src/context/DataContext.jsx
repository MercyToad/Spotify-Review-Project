import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { fetchData } from '../data/getData.js';
import { SONG_FIELDS, REVIEW_FIELDS } from '../data/types.js';

const DataContext = createContext(null);

const initialState = {
  songs: [],
  reviews: [],
  status: 'idle',
  error: null,
};

const clampRating = (value) => {
  const numeric = Number.isFinite(value) ? Number(value) : 0;
  return Math.min(5, Math.max(0, Math.round(numeric)));
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `review-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const normalizeSong = (song) => ({
  id: String(song.id),
  title: song.title?.trim() || 'Untitled Song',
  artist: song.artist?.trim() || 'Unknown Artist',
  album: song.album?.trim() || 'Unknown Album',
  coverUrl: song.coverUrl || '',
  genre: song.genre?.trim() || 'Unknown Genre',
  duration: song.duration || '0:00',
  averageRating: Math.min(5, Math.max(0, Number(song.averageRating) || 0)),
  releaseYear: Number.isFinite(song.releaseYear) ? Number(song.releaseYear) : new Date().getFullYear(),
  isFavorite: Boolean(song.isFavorite),
});

const normalizeReview = (review, allowedSongIds = null, { enforceId, preserveCreatedAt = false } = {}) => {
  const now = new Date().toISOString();
  const id = String(enforceId ?? review.id ?? generateId());
  const songId = String(review.songId || '');

  if (!songId) {
    throw new Error('Review requires a songId');
  }

  if (allowedSongIds && !allowedSongIds.has(songId)) {
    throw new Error(`Unknown songId "${songId}"`);
  }

  const createdAt = preserveCreatedAt ? review.createdAt || now : now;

  return {
    id,
    songId,
    username: (review.username || 'Guest').toString().trim() || 'Guest',
    rating: clampRating(review.rating),
    headline: review.headline?.trim() || 'Untitled review',
    body: review.body?.trim() || '',
    createdAt,
    updatedAt: now,
  };
};

const ensureRequiredFields = (items, requiredFields) =>
  items.filter((item) => requiredFields.every((field) => Object.prototype.hasOwnProperty.call(item, field)));

const recalcSongRatings = (songs, reviews) => {
  if (!songs.length) return songs;

  const ratingMap = reviews.reduce((acc, review) => {
    const existing = acc.get(review.songId) || { sum: 0, count: 0 };
    existing.sum += review.rating;
    existing.count += 1;
    acc.set(review.songId, existing);
    return acc;
  }, new Map());

  return songs.map((song) => {
    const ratingInfo = ratingMap.get(song.id);
    if (!ratingInfo || !ratingInfo.count) {
      return { ...song, averageRating: song.averageRating || 0 };
    }
    return {
      ...song,
      averageRating: Number((ratingInfo.sum / ratingInfo.count).toFixed(2)),
    };
  });
};

function dataReducer(state, action) {
  switch (action.type) {
    case 'loading':
      return { ...state, status: 'loading', error: null };
    case 'loadSuccess':
      return {
        ...state,
        status: 'ready',
        error: null,
        songs: action.payload.songs,
        reviews: action.payload.reviews,
      };
    case 'loadError':
      return { ...state, status: 'error', error: action.payload };
    case 'addReview': {
      const nextReviews = [action.payload, ...state.reviews];
      return {
        ...state,
        reviews: nextReviews,
        songs: recalcSongRatings(state.songs, nextReviews),
      };
    }
    case 'updateReview': {
      const nextReviews = state.reviews.map((review) =>
        review.id === action.payload.id ? action.payload : review,
      );
      return {
        ...state,
        reviews: nextReviews,
        songs: recalcSongRatings(state.songs, nextReviews),
      };
    }
    case 'deleteReview': {
      const nextReviews = state.reviews.filter((review) => review.id !== action.payload);
      return {
        ...state,
        reviews: nextReviews,
        songs: recalcSongRatings(state.songs, nextReviews),
      };
    }
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const loadData = useCallback(async () => {
    dispatch({ type: 'loading' });
    try {
      const { songs = [], reviews = [] } = await fetchData();
      const sanitizedSongs = ensureRequiredFields(songs, SONG_FIELDS).map(normalizeSong);
      const songIds = new Set(sanitizedSongs.map((song) => song.id));

      const sanitizedReviews = ensureRequiredFields(reviews, REVIEW_FIELDS).reduce((acc, review) => {
        try {
          acc.push(normalizeReview(review, songIds, { preserveCreatedAt: true }));
        } catch (error) {
          // ignore reviews that reference missing songs
        }
        return acc;
      }, []);

      dispatch({
        type: 'loadSuccess',
        payload: {
          songs: recalcSongRatings(sanitizedSongs, sanitizedReviews),
          reviews: sanitizedReviews,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch data';
      dispatch({ type: 'loadError', payload: message });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const songIdSet = useMemo(() => new Set(state.songs.map((song) => song.id)), [state.songs]);
  const songsMap = useMemo(() => {
    const map = new Map();
    state.songs.forEach((song) => map.set(song.id, song));
    return map;
  }, [state.songs]);

  const addReview = useCallback(
    (input) => {
      const normalized = normalizeReview(input, songIdSet);
      dispatch({ type: 'addReview', payload: normalized });
    },
    [songIdSet],
  );

  const updateReview = useCallback(
    (input) => {
      const existing = state.reviews.find((review) => review.id === input.id);
      if (!existing) return;
      const normalized = normalizeReview(
        { ...existing, ...input, createdAt: existing.createdAt },
        songIdSet,
        { enforceId: existing.id, preserveCreatedAt: true },
      );
      dispatch({ type: 'updateReview', payload: normalized });
    },
    [songIdSet, state.reviews],
  );

  const deleteReview = useCallback((reviewId) => {
    dispatch({ type: 'deleteReview', payload: reviewId });
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  const getSongById = useCallback((songId) => songsMap.get(songId) || null, [songsMap]);

  const getReviewsBySongId = useCallback(
    (songId) => state.reviews.filter((review) => review.songId === songId),
    [state.reviews],
  );

  const getReviewsByUser = useCallback(
    (username) => state.reviews.filter((review) => review.username === username),
    [state.reviews],
  );

  const getRecentReviews = useCallback(
    (limit = 5) =>
      [...state.reviews]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit),
    [state.reviews],
  );

  const value = useMemo(
    () => ({
      songs: state.songs,
      reviews: state.reviews,
      status: state.status,
      error: state.error,
      songsMap,
      addReview,
      updateReview,
      deleteReview,
      refreshData,
      getSongById,
      getReviewsBySongId,
      getReviewsByUser,
      getRecentReviews,
    }),
    [
      state.songs,
      state.reviews,
      state.status,
      state.error,
      songsMap,
      addReview,
      updateReview,
      deleteReview,
      refreshData,
      getSongById,
      getReviewsBySongId,
      getReviewsByUser,
      getRecentReviews,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}

