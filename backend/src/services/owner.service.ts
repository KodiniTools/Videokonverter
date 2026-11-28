import { randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Bindet Aufträge an den Browser, der sie hochgeladen hat.
 *
 * Jeder Browser bekommt ein zufälliges Token als HttpOnly-Cookie. Uploads,
 * Konvertierungen, Downloads, die Auftragsliste und WebSocket-Meldungen sind
 * nur für den Besitzer dieses Tokens sichtbar. Ohne gültiges Token sieht ein
 * Browser keine fremden Aufträge.
 */

export const OWNER_COOKIE = 'vk_owner';
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;
/** Ergebnisse leben höchstens 15 Minuten; ein Tag reicht für Reloads und lange Uploads. */
const COOKIE_MAX_AGE_S = 24 * 60 * 60;

/** Liest das Besitzer-Token aus einem Cookie-Header; null bei fehlendem oder ungültigem Wert. */
export function readOwner(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== OWNER_COOKIE) continue;
    const value = part.slice(eq + 1).trim();
    return TOKEN_PATTERN.test(value) ? value : null;
  }
  return null;
}

export function newOwnerToken(): string {
  return randomBytes(24).toString('base64url'); // 32 Zeichen
}

/**
 * Stellt `res.locals.owner` bereit. Fehlt das Cookie, wird ein neues Token
 * erzeugt und gesetzt; ein vorhandenes wird verlängert.
 */
export function ownerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const owner = readOwner(req.headers.cookie) ?? newOwnerToken();
  const attrs = [
    `${OWNER_COOKIE}=${owner}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE_S}`,
    'HttpOnly',
    'SameSite=Strict',
  ];
  if (req.secure) attrs.push('Secure');
  res.append('Set-Cookie', attrs.join('; '));
  res.locals.owner = owner;
  next();
}

export function ownerOf(res: Response): string {
  return res.locals.owner as string;
}

/** Vom Frontend erzeugte Auftrags-IDs (crypto.randomUUID). Verhindert Pfadangaben im Dateinamen. */
export const JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
