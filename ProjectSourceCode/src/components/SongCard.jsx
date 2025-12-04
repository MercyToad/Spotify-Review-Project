/**
 * Displays the minimal song information. The component stays fully stateless
 * and communicates intent upwards via callbacks.
 */
export default function SongCard({ song, onSelect, actionSlot }) {
  if (!song) return null;

  return (
    <article className="song-card" data-song-id={song.id}>
      <div className="song-card__media">
        {song.coverUrl ? (
          <img src={song.coverUrl} alt={`Album art for ${song.title}`} loading="lazy" />
        ) : (
          <div className="song-card__placeholder" aria-hidden="true">
            ART
          </div>
        )}
      </div>

      <div className="song-card__body">
        <header>
          <h3>{song.title}</h3>
          <p className="song-card__artist">{song.artist}</p>
        </header>
        <p className="song-card__meta">
          <span>{song.album}</span>
          <span> / </span>
          <span>{song.duration}</span>
        </p>
        <p className="song-card__rating">
          Avg. rating: {Number.isFinite(song.averageRating) ? song.averageRating.toFixed(1) : '0.0'} / 5
        </p>
      </div>

      <footer className="song-card__footer">
        {actionSlot}
        {onSelect && (
          <button type="button" className="song-card__cta" onClick={() => onSelect(song)}>
            View song
          </button>
        )}
      </footer>
    </article>
  );
}

SongCard.defaultProps = {
  actionSlot: null,
  onSelect: null,
};

