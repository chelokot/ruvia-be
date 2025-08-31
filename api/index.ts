import { handle } from 'hono/vercel';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../src/services/app';

export const config = {
  runtime: 'nodejs',
};

const app = buildApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  const h = handle(app);
  // @ts-expect-error hono/vercel types are edge-first; node adapts at runtime
  return h(req, res);
}
