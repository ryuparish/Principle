import React from 'react';
import { useToastStore } from '../../store/toastStore';
import './ToastContainer.css';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
          role="alert"
          aria-atomic="true"
        >
          <div className="toast-icon" aria-hidden="true">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '⚠'}
            {toast.type === 'info' && 'ℹ'}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
