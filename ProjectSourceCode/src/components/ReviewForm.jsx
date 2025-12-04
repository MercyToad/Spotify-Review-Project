import { useEffect, useState } from 'react';

const emptyForm = {
  songId: '',
  rating: 5,
  headline: '',
  body: '',
};

export default function ReviewForm({ songs, initialValues, onSubmit, onCancel, submitLabel }) {
  const [formState, setFormState] = useState({ ...emptyForm, ...initialValues });

  useEffect(() => {
    setFormState({ ...emptyForm, ...initialValues });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.songId) return;
    onSubmit?.({
      ...formState,
      rating: Number(formState.rating),
    });
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <label>
        Song
        <select name="songId" value={formState.songId} onChange={handleChange} required>
          <option value="" disabled>
            Select a song
          </option>
          {songs.map((song) => (
            <option key={song.id} value={song.id}>
              {song.title} - {song.artist}
            </option>
          ))}
        </select>
      </label>

      <label>
        Rating
        <input
          name="rating"
          type="number"
          min="0"
          max="5"
          step="1"
          value={formState.rating}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Headline
        <input name="headline" value={formState.headline} onChange={handleChange} placeholder="Quick summary" />
      </label>

      <label>
        Review
        <textarea
          name="body"
          value={formState.body}
          onChange={handleChange}
          placeholder="Tell everyone why you love or dislike the track"
        />
      </label>

      <div className="review-form__actions">
        <button type="submit">{submitLabel}</button>
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

ReviewForm.defaultProps = {
  songs: [],
  initialValues: emptyForm,
  onSubmit: null,
  onCancel: null,
  submitLabel: 'Save review',
};

