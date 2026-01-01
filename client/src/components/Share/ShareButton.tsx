import React from 'react';
import './ShareButton.css';

interface ShareButtonProps {
  onClick: () => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ onClick }) => {
  return (
    <button
      className="share-button"
      onClick={onClick}
      title="Share Concept Map"
      aria-label="Share concept map"
    >
      🔗
    </button>
  );
};
