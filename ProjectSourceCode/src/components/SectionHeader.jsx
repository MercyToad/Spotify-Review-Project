/**
 * Lightweight shared section heading with optional action slot.
 * Keeps typography consistent across all pages.
 */
export default function SectionHeader({ title, subtitle, actionSlot }) {
  return (
    <div className="section-header">
      <div className="section-header__text">
        <h2>{title}</h2>
        {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
      </div>
      {actionSlot && <div className="section-header__actions">{actionSlot}</div>}
    </div>
  );
}

SectionHeader.defaultProps = {
  subtitle: '',
  actionSlot: null,
};

