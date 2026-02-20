import type { Request, Response, NextFunction } from 'express';
import { verifyUserToken } from '../lib/supabase.js';
import { supabase } from '../lib/supabase.js';

/**
 * Middleware that verifies the user is authenticated AND is_admin = true.
 * Sets req.user on success.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  if (!supabase) {
    res.status(500).json({ error: 'Database not configured' });
    return;
  }

  const token = header.slice(7);

  try {
    const user = await verifyUserToken(token);
    req.user = user;

    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
