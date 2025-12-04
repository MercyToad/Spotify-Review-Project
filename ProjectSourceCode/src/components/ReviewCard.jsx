/**
 * Stateless review presentation used across all review-driven pages.
 */
export default function ReviewCard({ review, song, onEdit, onDelete }) {
  if (!review) return null;

  return (
    <article className="review-card" data-review-id={review.id}>
      <header className="review-card__header">
        <div>
          <p className="review-card__headline">{review.headline}</p>
          {song && (
            <p className="review-card__song">
              {song.title} - {song.artist}
            </p>
          )}
          <p className="review-card__meta">
            <span>{review.username}</span>
            <span> | </span>
            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
          </p>
        </div>
        <div className="review-card__rating">
          Rating: {review.rating} / 5
        </div>
      </header>

      <p className="review-card__body">{review.body}</p>

      {(onEdit || onDelete) && (
        <footer className="review-card__footer">
          {onEdit && (
            <button type="button" onClick={() => onEdit(review)}>
              Edit
            </button>
          )}
          {onDelete && (
            <button type="button" className="danger" onClick={() => onDelete(review.id)}>
              Delete
            </button>
          )}
        </footer>
      )}
    </article>
  );
}

ReviewCard.defaultProps = {
  song: null,
  onEdit: null,
  onDelete: null,
};

