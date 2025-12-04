/**
 * Shared data contracts for the frontend mock layer.
 * These JSDoc typedefs make it clear which fields exist on each entity
 * so components do not invent ad-hoc properties.
 */

/**
 * @typedef {Object} Song
 * @property {string} id - Stable identifier (can match Spotify track id later)
 * @property {string} title
 * @property {string} artist
 * @property {string} album
 * @property {string} coverUrl
 * @property {string} genre
 * @property {string} duration - Human readable string 
 * @property {number} averageRating - 0-5 aggregate sourced from reviews
 * @property {number} releaseYear
 * @property {boolean} isFavorite
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} songId - References the related Song.id
 * @property {string} username
 * @property {number} rating - 0-5 integer
 * @property {string} headline
 * @property {string} body
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

export const SONG_FIELDS = Object.freeze([
  'id',
  'title',
  'artist',
  'album',
  'coverUrl',
  'genre',
  'duration',
  'averageRating',
  'releaseYear',
  'isFavorite',
]);

export const REVIEW_FIELDS = Object.freeze([
  'id',
  'songId',
  'username',
  'rating',
  'headline',
  'body',
  'createdAt',
  'updatedAt',
]);

/**
 * Utility guard that can be reused anywhere mock data is loaded.
 * @param {Record<string, any>} entity
 * @param {string[]} requiredFields
 * @returns {boolean}
 */
export function hasRequiredFields(entity, requiredFields) {
  return Boolean(entity) && requiredFields.every((field) => Object.prototype.hasOwnProperty.call(entity, field));
}

