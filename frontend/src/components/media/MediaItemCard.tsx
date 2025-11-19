import type { Media } from "../../types/media.types";

type Props = {
  item: Media;
  selected?: boolean;
  onClick: () => void;
  onDelete: () => void;
};

export default function MediaItemCard({ item, selected, onClick, onDelete }: Props) {
  const isImage = item.type === "image";

  return (
    <div
      className={`media-card ${selected ? "selected" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <button
        type="button"
        className="media-card-delete"
        title="Eliminar"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        🗑
      </button>

      <div className="media-thumb">
        {isImage ? (
          <img src={item.url} alt={item.name} />
        ) : (
          <div className="media-audio-icon" aria-label="Audio">🎵</div>
        )}
      </div>

      <div className="media-name" title={item.name}>{item.name}</div>
    </div>
  );
}