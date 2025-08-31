import { Hono } from 'hono';
import type { AppEnv } from '../services/app.js';

const AUTH_ROOT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function env(name: string, fallback?: string): string {
  const v = process.env[name] || fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function b64urlDecode(input: string): string {
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : '';
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}

type IdPayload = { sub?: string; email?: string; name?: string };

export const authRoutes = new Hono<AppEnv>()
  .get('/auth/google', (c) => {
    const clientId = env('GOOGLE_CLIENT_ID');
    const redirectUri = new URL('/auth/google/callback', env('PUBLIC_BASE_URL', 'https://api.ruvia.art')).toString();
    const state = c.req.query('redirect') || c.req.header('referer') || 'https://www.ruvia.art';
    const qs = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      include_granted_scopes: 'true',
      state,
    });
    return c.redirect(`${AUTH_ROOT}?${qs}`);
  })
  .get('/auth/google/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state') || 'https://www.ruvia.art';
    if (!code) return c.newResponse('Missing code', 400);
    const clientId = env('GOOGLE_CLIENT_ID');
    const clientSecret = env('GOOGLE_CLIENT_SECRET');
    const redirectUri = new URL('/auth/google/callback', env('PUBLIC_BASE_URL', 'https://api.ruvia.art')).toString();
    const form = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const r = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    if (!r.ok) return c.newResponse('Token exchange failed', 500);
    const j = (await r.json()) as { id_token?: string };
    if (!j.id_token) return c.newResponse('No id_token', 500);
    const payload: IdPayload = JSON.parse(b64urlDecode(j.id_token.split('.')[1] || '')) as IdPayload;
    const uid = payload.sub || payload.email || '';
    if (!uid) return c.newResponse('Invalid token', 500);
    const claims: Record<string, string> = {};
    if (payload.name) claims.name = payload.name;
    if (payload.email) claims.email = payload.email;
    const customToken = await c.var.auth.createCustomToken(uid, claims);
    const url = new URL(String(state));
    url.searchParams.set('customToken', customToken);
    return c.redirect(url.toString());
  });
