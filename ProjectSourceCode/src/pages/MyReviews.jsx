import { useMemo, useState } from 'react';
import ReviewForm from '../components/ReviewForm.jsx';
import ReviewList from '../components/ReviewList.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { useDataContext } from '../context/DataContext.jsx';

export default function MyReviewsPage({ username }) {
  const { songs, songsMap, reviews, status, addReview, updateReview, deleteReview } = useDataContext();
  const [editingReview, setEditingReview] = useState(null);

  const myReviews = useMemo(
    () => reviews.filter((review) => review.username === username),
    [reviews, username],
  );

  const isEditing = Boolean(editingReview);
  const defaultSongId = songs[0]?.id || '';
  const formInitialValues =
    editingReview || {
      songId: defaultSongId,
      rating: 5,
      headline: '',
      body: '',
    };

  const handleSubmit = (reviewInput) => {
    if (isEditing) {
      updateReview({ ...reviewInput, id: editingReview.id, username });
    } else {
      addReview({ ...reviewInput, username });
    }
    setEditingReview(null);
  };

  const handleEdit = (review) => {
    setEditingReview(review);
  };

  const handleDelete = (reviewId) => {
    deleteReview(reviewId);
  };

  const actionSlot = songs.length ? (
    <button type="button" onClick={() => setEditingReview(null)}>
      {isEditing ? 'Cancel edit' : 'Start new review'}
    </button>
  ) : null;

  return (
    <section className="page page--my-reviews">
      <SectionHeader
        title="My Reviews"
        subtitle="Create, edit, and remove your own Spotify takes"
        actionSlot={actionSlot}
      />

      {status === 'loading' && <p>Loading your reviews...</p>}
      {status === 'error' && <p role="alert">Unable to load reviews right now.</p>}

      {status === 'ready' && (
        <div className="my-reviews__layout">
          <div className="my-reviews__form">
            <ReviewForm
              songs={songs}
              initialValues={formInitialValues}
              submitLabel={isEditing ? 'Update review' : 'Add review'}
              onSubmit={handleSubmit}
              onCancel={isEditing ? () => setEditingReview(null) : null}
            />
          </div>

          <div className="my-reviews__list">
            <ReviewList
              reviews={myReviews}
              songsMap={songsMap}
              onEditReview={handleEdit}
              onDeleteReview={handleDelete}
              emptyLabel="You have not reviewed any tracks yet."
            />
          </div>
        </div>
      )}
    </section>
  );
}

MyReviewsPage.defaultProps = {
  username: 'Guest',
};

