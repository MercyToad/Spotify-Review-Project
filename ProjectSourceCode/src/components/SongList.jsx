import SongCard from './SongCard.jsx';

/**
 * Simple wrapper to render a grid of songs without duplicating markup.
 */
export default function SongList({ songs, onSelectSong, emptyLabel }) {
  if (!songs?.length) {
    return <p className="empty-state">{emptyLabel}</p>;
  }

  return (
    <div className="song-list">
      {songs.map((song) => (
        <SongCard key={song.id} song={song} onSelect={onSelectSong} />
      ))}
    </div>
  );
}

SongList.defaultProps = {
  onSelectSong: null,
  emptyLabel: 'No songs found.',
};

