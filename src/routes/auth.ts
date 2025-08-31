import { Hono } from 'hono';
import type { AppEnv } from '../services/app.js';

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const GOOGLE_AUTH_ROOT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const authRoutes = new Hono<AppEnv>()
  .get('/auth/google', (c) => {
    const clientId = getEnv('GOOGLE_CLIENT_ID');
    const redirectUri = new URL('/auth/google/callback', getEnv('PUBLIC_BASE_URL', 'https://api.ruvia.art')).toString();
    const state = c.req.query('redirect') || c.req.header('referer') || 'https://www.ruvia.art';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      include_granted_scopes: 'true',
      state,
    });
    return c.redirect(`${GOOGLE_AUTH_ROOT}?${params.toString()}`);
  })
  .get('/auth/google/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state') || 'https://www.ruvia.art';
    if (!code) return c.text('Missing code', 400);

    const clientId = getEnv('GOOGLE_CLIENT_ID');
    const clientSecret = getEnv('GOOGLE_CLIENT_SECRET');
    const redirectUri = new URL('/auth/google/callback', getEnv('PUBLIC_BASE_URL', 'https://api.ruvia.art')).toString();

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return c.text(`Token exchange failed: ${err}`, 500);
    }
    const tokenJson: any = await tokenRes.json();
    const idToken = tokenJson.id_token as string | undefined;
    if (!idToken) return c.text('No id_token from Google', 500);

    // Decode ID token (payload is base64url)
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString('utf8')) as any;
    const uid = (payload && (payload.sub || payload.email)) as string;
    const name = (payload && payload.name) as string | undefined;
    const email = (payload && payload.email) as string | undefined;
    if (!uid) return c.text('Invalid Google token', 500);

    const customToken = await c.var.auth.createCustomToken(uid, { name, email });

    const redirect = new URL(state as string);
    redirect.searchParams.set('customToken', customToken);
    return c.redirect(redirect.toString());
  });

