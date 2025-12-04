import ReviewCard from './ReviewCard.jsx';

/**
 * Shared ReviewList to avoid repeating list layouts on each page.
 */
export default function ReviewList({ reviews, songsMap, onEditReview, onDeleteReview, emptyLabel }) {
  if (!reviews?.length) {
    return <p className="empty-state">{emptyLabel}</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          song={songsMap?.get(review.songId)}
          onEdit={onEditReview}
          onDelete={onDeleteReview}
        />
      ))}
    </div>
  );
}

ReviewList.defaultProps = {
  songsMap: new Map(),
  onEditReview: null,
  onDeleteReview: null,
  emptyLabel: 'No reviews yet.',
};

