import React from 'react';
import './Spinner.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullscreen?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  message,
  fullscreen = false
}) => {
  const content = (
    <div className={`spinner-container ${fullscreen ? 'fullscreen' : ''}`} role="status" aria-live="polite">
      <div className={`spinner spinner-${size}`} aria-label="Loading">
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      {message && <p className="spinner-message">{message}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );

  return content;
};

export default Spinner;
