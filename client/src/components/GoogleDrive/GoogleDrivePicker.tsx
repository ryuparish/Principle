import React, { useEffect, useState, useCallback } from 'react';
import { googleDriveApi } from '../../api/googleDrive.api';
import type { DriveFile } from '../../types/drive';

declare global {
  interface Window {
    google?: {
      picker: {
        PickerBuilder: new () => PickerBuilder;
        DocsView: new () => DocsView;
        Action: {
          PICKED: string;
          CANCEL: string;
        };
        ViewId: {
          DOCS: string;
          FOLDERS: string;
        };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
      auth2?: {
        getAuthInstance: () => {
          currentUser: {
            get: () => {
              getAuthResponse: () => { access_token: string };
            };
          };
        };
      };
    };
  }
}

interface PickerBuilder {
  setAppId: (appId: string) => PickerBuilder;
  setOAuthToken: (token: string) => PickerBuilder;
  setDeveloperKey: (key: string) => PickerBuilder;
  setOrigin: (origin: string) => PickerBuilder;
  addView: (view: DocsView) => PickerBuilder;
  setCallback: (callback: (data: PickerResponse) => void) => PickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
}

interface DocsView {
  setIncludeFolders: (include: boolean) => DocsView;
  setSelectFolderEnabled: (enabled: boolean) => DocsView;
  setMimeTypes?: (mimeTypes: string) => DocsView;
}

interface PickerResponse {
  action: string;
  docs?: Array<{
    id: string;
    name: string;
    mimeType: string;
    iconUrl: string;
    url: string;
    sizeBytes?: number;
  }>;
}

interface GoogleDrivePickerProps {
  onFilesSelected: (files: DriveFile[]) => void;
  onCancel?: () => void;
  disabled?: boolean;
  buttonText?: string;
  className?: string;
}

// Track script loading state globally
let pickerApiLoaded = false;
let loadingPromise: Promise<void> | null = null;

const loadPickerApi = (): Promise<void> => {
  if (pickerApiLoaded) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.picker) {
      pickerApiLoaded = true;
      resolve();
      return;
    }

    // Load Google API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi?.load('picker', () => {
        pickerApiLoaded = true;
        resolve();
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google Picker API'));
    document.body.appendChild(script);
  });

  return loadingPromise;
};

export const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({
  onFilesSelected,
  onCancel,
  disabled = false,
  buttonText = 'Add from Drive',
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerReady, setPickerReady] = useState(pickerApiLoaded);

  useEffect(() => {
    loadPickerApi()
      .then(() => setPickerReady(true))
      .catch((err) => {
        console.error('Failed to load Picker API:', err);
        setError('Failed to load Google Picker');
      });
  }, []);

  const openPicker = useCallback(async () => {
    if (!pickerReady || !window.google?.picker) {
      setError('Google Picker not ready');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get picker config (access token + API key)
      const config = await googleDriveApi.getPickerConfig();

      // Create the picker view
      const view = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);

      const picker = new window.google.picker.PickerBuilder()
        .setAppId('962691565912')
        .setOAuthToken(config.accessToken)
        .setDeveloperKey(config.apiKey)
        .setOrigin(window.location.origin)
        .addView(view)
        .setCallback(async (data: PickerResponse) => {
          if (data.action === window.google?.picker.Action.PICKED && data.docs) {
            // Convert picker docs to our DriveFile format
            const files: DriveFile[] = await Promise.all(
              data.docs.map(async (doc) => {
                try {
                  // Get full file details from our backend
                  const fileDetails = await googleDriveApi.getFile(doc.id);
                  return fileDetails;
                } catch {
                  // Fallback to picker data if API call fails
                  return {
                    id: doc.id,
                    name: doc.name,
                    mimeType: doc.mimeType,
                    iconLink: doc.iconUrl,
                    webViewLink: doc.url,
                    size: doc.sizeBytes?.toString()
                  };
                }
              })
            );
            onFilesSelected(files);
          } else if (data.action === window.google?.picker.Action.CANCEL) {
            onCancel?.();
          }
          setLoading(false);
        })
        .build();

      picker.setVisible(true);
    } catch (err: any) {
      console.error('Failed to open picker:', err);
      setError(err.message || 'Failed to open file picker');
      setLoading(false);
    }
  }, [pickerReady, onFilesSelected, onCancel]);

  return (
    <div className="inline-block">
      <button
        onClick={openPicker}
        disabled={disabled || loading || !pickerReady}
        className={`px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${className}`}
      >
        {loading ? (
          <>
            <span className="animate-spin">...</span>
            Loading...
          </>
        ) : (
          <>
            <svg viewBox="0 0 87.3 78" className="w-4 h-4">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            {buttonText}
          </>
        )}
      </button>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};
