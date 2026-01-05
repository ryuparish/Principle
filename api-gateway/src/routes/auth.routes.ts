import { Router, Request, Response } from 'express';
import { googleAuthService } from '../services/google-auth.service';

const router = Router();

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow - redirects to Google consent screen
 */
router.get('/google', (req: Request, res: Response) => {
  try {
    const authUrl = googleAuthService.getAuthUrl();
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('[AUTH] Failed to generate auth URL:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to initiate Google authentication'
    });
  }
});

/**
 * GET /api/auth/google/callback
 * Handle OAuth callback from Google
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('[AUTH] OAuth error:', error);
      // Redirect to client with error
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientUrl}?auth_error=${encodeURIComponent(error as string)}`);
      return;
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'No authorization code provided' });
      return;
    }

    await googleAuthService.handleCallback(code);

    // Redirect back to client app
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}?auth_success=true`);
  } catch (error: any) {
    console.error('[AUTH] Callback error:', error.message);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}?auth_error=${encodeURIComponent('Authentication failed')}`);
  }
});

/**
 * GET /api/auth/google/status
 * Check if user is connected to Google
 */
router.get('/google/status', async (req: Request, res: Response) => {
  try {
    const status = await googleAuthService.getStatus();
    res.json(status);
  } catch (error: any) {
    console.error('[AUTH] Status check error:', error.message);
    res.json({ connected: false });
  }
});

/**
 * POST /api/auth/google/logout
 * Disconnect Google account
 */
router.post('/google/logout', (req: Request, res: Response) => {
  try {
    googleAuthService.logout();
    res.json({ success: true, message: 'Disconnected from Google' });
  } catch (error: any) {
    console.error('[AUTH] Logout error:', error.message);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * GET /api/auth/google/client-id
 * Get Google client ID for frontend Picker API
 */
router.get('/google/client-id', (req: Request, res: Response) => {
  try {
    const clientId = googleAuthService.getClientId();
    res.json({ clientId });
  } catch (error: any) {
    console.error('[AUTH] Get client ID error:', error.message);
    res.status(500).json({ error: 'Google OAuth not configured' });
  }
});

/**
 * GET /api/auth/google/picker-config
 * Get config needed for Google Picker (access token + API key)
 */
router.get('/google/picker-config', async (req: Request, res: Response) => {
  try {
    const config = await googleAuthService.getPickerConfig();
    if (!config) {
      res.status(401).json({ error: 'Not connected to Google' });
      return;
    }
    res.json(config);
  } catch (error: any) {
    console.error('[AUTH] Get picker config error:', error.message);
    res.status(500).json({ error: 'Failed to get picker config' });
  }
});

export default router;
