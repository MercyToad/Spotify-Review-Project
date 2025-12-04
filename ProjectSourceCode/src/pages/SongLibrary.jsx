import { useMemo, useState } from 'react';
import SongList from '../components/SongList.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { useDataContext } from '../context/DataContext.jsx';

export default function SongLibraryPage({ onSongSelect }) {
  const { songs, status, error } = useDataContext();
  const [query, setQuery] = useState('');

  const filteredSongs = useMemo(() => {
    if (!query.trim()) return songs;
    const lower = query.trim().toLowerCase();
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(lower) ||
        song.artist.toLowerCase().includes(lower) ||
        song.genre.toLowerCase().includes(lower),
    );
  }, [songs, query]);

  return (
    <section className="page page--song-library">
      <SectionHeader
        title="Song Library"
        subtitle="Browse all preloaded tracks - this will soon map to real Spotify responses"
        actionSlot={
          <input
            type="search"
            placeholder="Search songs or artists"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        }
      />

      {status === 'loading' && <p>Loading songs...</p>}
      {status === 'error' && <p role="alert">Unable to load songs: {error}</p>}
      {status === 'ready' && (
        <SongList
          songs={filteredSongs}
          onSelectSong={onSongSelect}
          emptyLabel="No songs match your search just yet."
        />
      )}
    </section>
  );
}

SongLibraryPage.defaultProps = {
  onSongSelect: null,
};

