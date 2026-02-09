import type { Request, Response, NextFunction } from 'express';
import { verifyUserToken } from '../lib/supabase.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice(7);
  console.log('[auth] Token received:', token ? `${token.slice(0, 20)}...` : 'EMPTY');

  try {
    req.user = await verifyUserToken(token);
    console.log('[auth] Verified user:', req.user.id);
    next();
  } catch (err) {
    console.error('[auth] Verification failed:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
