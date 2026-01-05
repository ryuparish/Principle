import { google } from 'googleapis';

// In-memory token storage (replace with database in production)
let tokenStore: {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
} | null = null;

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export const googleAuthService = {
  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(): string {
    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force consent to get refresh token
    });
  },

  /**
   * Exchange authorization code for tokens
   */
  async handleCallback(code: string): Promise<void> {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    tokenStore = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiryDate: tokens.expiry_date || Date.now() + 3600000
    };

    console.log('[GOOGLE AUTH] Tokens stored successfully');
  },

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string | null> {
    if (!tokenStore) {
      return null;
    }

    // Check if token is expired or about to expire (5 min buffer)
    const isExpired = Date.now() > tokenStore.expiryDate - 300000;

    if (isExpired && tokenStore.refreshToken) {
      try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
          refresh_token: tokenStore.refreshToken
        });

        const { credentials } = await oauth2Client.refreshAccessToken();

        tokenStore = {
          accessToken: credentials.access_token || tokenStore.accessToken,
          refreshToken: credentials.refresh_token || tokenStore.refreshToken,
          expiryDate: credentials.expiry_date || Date.now() + 3600000
        };

        console.log('[GOOGLE AUTH] Token refreshed successfully');
      } catch (error) {
        console.error('[GOOGLE AUTH] Failed to refresh token:', error);
        tokenStore = null;
        return null;
      }
    }

    return tokenStore.accessToken;
  },

  /**
   * Check if user is connected to Google
   */
  isConnected(): boolean {
    return tokenStore !== null;
  },

  /**
   * Get connection status with user info
   */
  async getStatus(): Promise<{ connected: boolean; email?: string }> {
    if (!tokenStore) {
      return { connected: false };
    }

    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return { connected: false };
      }

      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      return {
        connected: true,
        email: userInfo.data.email || undefined
      };
    } catch (error) {
      console.error('[GOOGLE AUTH] Failed to get user info:', error);
      return { connected: false };
    }
  },

  /**
   * Disconnect Google account
   */
  logout(): void {
    tokenStore = null;
    console.log('[GOOGLE AUTH] Logged out');
  },

  /**
   * Get authenticated Drive client
   */
  async getDriveClient() {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('Not connected to Google');
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    return google.drive({ version: 'v3', auth: oauth2Client });
  },

  /**
   * Get client ID for frontend Picker API
   */
  getClientId(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID not configured');
    }
    return clientId;
  },

  /**
   * Get API key for Picker API
   */
  getApiKey(): string {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }
    return apiKey;
  },

  /**
   * Get picker config (token + API key) for frontend
   */
  async getPickerConfig(): Promise<{ accessToken: string; apiKey: string } | null> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return null;
    }
    return {
      accessToken,
      apiKey: this.getApiKey()
    };
  }
};
