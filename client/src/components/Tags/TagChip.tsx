import React from 'react';
import { useTagStore } from '../../store/tagStore';
import './TagChip.css';

interface TagChipProps {
  tagName: string;
  color?: string;
  onClick?: (tagName: string) => void;
  onRemove?: (tagName: string) => void;
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  interactive?: boolean;
  className?: string;
}

export const TagChip: React.FC<TagChipProps> = ({
  tagName,
  color,
  onClick,
  onRemove,
  size = 'md',
  removable = false,
  interactive = true,
  className = '',
}) => {
  const { tags } = useTagStore();

  // Get color from tag store if not provided
  const tagData = tags.get(tagName);
  const chipColor = color || tagData?.color || '#3b82f6';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (interactive && onClick) {
      onClick(tagName);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(tagName);
    }
  };

  return (
    <div
      className={`tag-chip tag-chip-${size} ${interactive ? 'tag-chip-interactive' : ''} ${className}`}
      style={{ backgroundColor: chipColor }}
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Filter by tag ${tagName}` : `Tag ${tagName}`}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      <span className="tag-chip-text">{tagName}</span>
      {removable && (
        <button
          type="button"
          className="tag-chip-remove"
          onClick={handleRemove}
          aria-label={`Remove tag ${tagName}`}
          tabIndex={0}
        >
          ×
        </button>
      )}
    </div>
  );
};
