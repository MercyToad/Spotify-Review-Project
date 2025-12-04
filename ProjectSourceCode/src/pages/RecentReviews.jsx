import { useMemo } from 'react';
import ReviewList from '../components/ReviewList.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { useDataContext } from '../context/DataContext.jsx';

export default function RecentReviewsPage({ limit }) {
  const { status, error, songsMap, getRecentReviews } = useDataContext();
  const reviews = useMemo(() => getRecentReviews(limit), [getRecentReviews, limit]);

  return (
    <section className="page page--recent-reviews">
      <SectionHeader title="Recent Reviews" subtitle="Live feed of community activity" />

      {status === 'loading' && <p>Loading reviews...</p>}
      {status === 'error' && <p role="alert">Unable to load reviews: {error}</p>}
      {status === 'ready' && (
        <ReviewList reviews={reviews} songsMap={songsMap} emptyLabel="No one has reviewed anything yet." />
      )}
    </section>
  );
}

RecentReviewsPage.defaultProps = {
  limit: 5,
};

