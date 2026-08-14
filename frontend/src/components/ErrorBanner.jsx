import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <div className="error-content">
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          className="btn-close-error"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
