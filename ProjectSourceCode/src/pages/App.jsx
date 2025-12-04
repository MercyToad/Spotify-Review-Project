import { DataProvider } from '../context/DataContext.jsx';
import MyReviewsPage from './MyReviews.jsx';
import RecentReviewsPage from './RecentReviews.jsx';
import SongLibraryPage from './SongLibrary.jsx';

/**
 * High-level composition that keeps all pages wrapped in the shared context.
 * Swapping to real API data only requires changing DataProvider internals.
 */
export default function App() {
  const handleSongSelect = (song) => {
    // Placeholder to show where routing/navigation would occur.
    // eslint-disable-next-line no-console
    console.info('Selected song', song);
  };

  return (
    <DataProvider>
      <main className="app-shell">
        <SongLibraryPage onSongSelect={handleSongSelect} />
        <RecentReviewsPage limit={6} />
        <MyReviewsPage username="melody_maker" />
      </main>
    </DataProvider>
  );
}

