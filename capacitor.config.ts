import type { CapacitorConfig } from '@capacitor/cli';

/**
 * هوش‌یار — Capacitor (Android) configuration
 *
 * The Android app is a secure WebView shell around the deployed Next.js app.
 * Set CAP_SERVER_URL (env) or edit `server.url` below to your public HTTPS
 * deployment URL (e.g. https://app.hooshyar.ir) before running:
 *   bunx cap sync android
 */
const config: CapacitorConfig = {
  appId: 'ir.hooshyar.app',
  appName: 'هوش‌یار',
  webDir: 'public',
  server: {
    // Deployed backend/UI URL — the AI brain (API routes) runs there.
    // Set with: repo variable CAP_SERVER_URL in GitHub, or env locally.
    url: process.env.CAP_SERVER_URL?.trim() || 'https://APP_URL_PLACEHOLDER.example.com',
    cleartext: false, // HTTPS only — required for store compliance
    errorPath: 'offline.html',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#FFF7ED',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
