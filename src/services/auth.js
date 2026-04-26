import crypto from 'crypto';
import { FIFTEEN_MINUTES, THIRTY_DAYS } from '../constants/time.js';
import { Session } from '../models/session.js';

const isProd = process.env.NODE_ENV === 'production';

export const createSession = async (userId) => {
  const accessToken = crypto.randomBytes(30).toString('base64');
  const refreshToken = crypto.randomBytes(30).toString('base64');

  return Session.create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });
};
export const setSessionCookies = (res, session) => {
  // secure+sameSite='none' is required for the cross-origin frontend in
  // production (HTTPS) but breaks plain-HTTP dev/staging and integration
  // tests — cookies with secure=true are dropped on http://. Mirror the
  // isProd-aware behaviour already used by clearSessionCookies.
  const cookieOpts = (maxAge) => ({
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge,
  });

  res.cookie('accessToken', session.accessToken, cookieOpts(FIFTEEN_MINUTES));
  res.cookie('refreshToken', session.refreshToken, cookieOpts(THIRTY_DAYS));
  res.cookie('sessionId', session._id, cookieOpts(THIRTY_DAYS));
};
export const clearSessionCookies = (res) => {
  const cookieOptions = { httpOnly: true, path: '/' };
  if (isProd) {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'none';
  }
  res.clearCookie('sessionId', cookieOptions);
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
