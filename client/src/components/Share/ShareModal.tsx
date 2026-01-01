import React, { useState, useEffect } from 'react';
import { shareApi } from '../../api/share.api';
import { ShareSettings, MapVisibility } from '../../types';
import './ShareModal.css';

interface ShareModalProps {
  conceptMapId: string;
  conceptMapName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  conceptMapId,
  conceptMapName,
  isOpen,
  onClose
}) => {
  const [sharing, setSharing] = useState<ShareSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current sharing settings when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSharingSettings();
    }
  }, [isOpen, conceptMapId]);

  const loadSharingSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await shareApi.getSettings(conceptMapId);
      setSharing(settings);
    } catch (err: any) {
      console.error('Failed to load sharing settings:', err);
      // If not shared yet, that's okay
      setSharing(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableSharing = async (visibility: 'public' | 'unlisted') => {
    setLoading(true);
    setError(null);
    try {
      const result = await shareApi.enableSharing(conceptMapId, { visibility });
      setSharing(result);
    } catch (err: any) {
      console.error('Failed to enable sharing:', err);
      setError('Failed to enable sharing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSharing = async () => {
    if (!confirm('Disable sharing? The share URL will stop working.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await shareApi.disableSharing(conceptMapId);
      setSharing(null);
    } catch (err: any) {
      console.error('Failed to disable sharing:', err);
      setError('Failed to disable sharing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeVisibility = async (visibility: 'public' | 'unlisted') => {
    if (sharing?.visibility === visibility) return;
    await handleEnableSharing(visibility);
  };

  const copyShareUrl = () => {
    if (!sharing?.shareUrl) return;

    navigator.clipboard.writeText(sharing.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    if (!sharing?.shareSlug) return;
    const url = shareApi.downloadJSON(sharing.shareSlug, sharing.shareToken || undefined);
    window.open(url, '_blank');
  };

  const downloadHTML = () => {
    if (!sharing?.shareSlug) return;
    const url = shareApi.downloadHTML(sharing.shareSlug, sharing.shareToken || undefined);
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Share "{conceptMapName}"</h2>
          <button className="share-close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="share-modal-body">
          {loading && <div className="share-loading">Loading...</div>}

          {error && <div className="share-error">{error}</div>}

          {!loading && !sharing && (
            <div className="share-not-enabled">
              <p className="share-description">
                Enable sharing to get a public link to this concept map.
                Anyone with the link will be able to view it.
              </p>

              <div className="share-enable-buttons">
                <button
                  className="share-enable-button primary"
                  onClick={() => handleEnableSharing('public')}
                >
                  🌐 Make Public
                </button>
                <button
                  className="share-enable-button secondary"
                  onClick={() => handleEnableSharing('unlisted')}
                  title="Create a secret link that's not publicly listed"
                >
                  🔒 Unlisted (Secret Link)
                </button>
              </div>

              <div className="share-info-box">
                <strong>Public:</strong> Anyone can discover and access via the share URL
                <br />
                <strong>Unlisted:</strong> Only people with the secret link can access (includes security token)
              </div>
            </div>
          )}

          {!loading && sharing && (
            <div className="share-enabled">
              <div className="share-visibility-selector">
                <label>Visibility:</label>
                <div className="share-visibility-buttons">
                  <button
                    className={`share-visibility-button ${sharing.visibility === 'public' ? 'active' : ''}`}
                    onClick={() => handleChangeVisibility('public')}
                    disabled={loading}
                  >
                    🌐 Public
                  </button>
                  <button
                    className={`share-visibility-button ${sharing.visibility === 'unlisted' ? 'active' : ''}`}
                    onClick={() => handleChangeVisibility('unlisted')}
                    disabled={loading}
                  >
                    🔒 Unlisted
                  </button>
                </div>
              </div>

              <div className="share-url-section">
                <label>Share URL:</label>
                <div className="share-url-container">
                  <input
                    type="text"
                    className="share-url-input"
                    value={sharing.shareUrl || ''}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    className="share-copy-button"
                    onClick={copyShareUrl}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>

              {sharing.visibility === 'unlisted' && sharing.shareToken && (
                <div className="share-info-box">
                  This is an unlisted map. The URL includes a secret token.
                  Only people with this exact URL can access the map.
                </div>
              )}

              <div className="share-actions">
                <button
                  className="share-download-button"
                  onClick={downloadJSON}
                >
                  📄 Download as JSON
                </button>

                <button
                  className="share-download-button"
                  onClick={downloadHTML}
                  title="Download self-contained HTML file that works offline"
                >
                  🌍 Download as HTML
                </button>

                <button
                  className="share-disable-button"
                  onClick={handleDisableSharing}
                  disabled={loading}
                >
                  Disable Sharing
                </button>
              </div>

              <div className="share-stats">
                <small>
                  Shared {sharing.sharedAt ? new Date(sharing.sharedAt).toLocaleString() : 'recently'}
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
