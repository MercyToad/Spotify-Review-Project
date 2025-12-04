import { mockSongs, mockReviews } from './mockData.js';

const clone = (payload) => JSON.parse(JSON.stringify(payload));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch both collections. Only need to replace this function
 * (or the helper functions below) when wiring to Spotify.
 * @returns {Promise<{songs: Song[], reviews: Review[]}>}
 */
export async function fetchData() {
  await delay(120);
  return {
    songs: clone(mockSongs),
    reviews: clone(mockReviews),
  };
}

export async function fetchSongs() {
  const { songs } = await fetchData();
  return songs;
}

export async function fetchReviews() {
  const { reviews } = await fetchData();
  return reviews;
}

