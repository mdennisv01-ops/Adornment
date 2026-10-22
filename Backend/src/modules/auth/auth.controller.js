const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const authService = require('./auth.service');
const env = require('../../config/env');

// Refresh tokens are set as an httpOnly cookie so client-side JS never
// touches them directly (mitigates XSS token theft); the access token is
// returned in the JSON body for the SPA to hold in memory.
const REFRESH_COOKIE = 'refreshToken';
const cookieOptions = (req) => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production' || req.protocol === 'https' || req.secure,
  sameSite: env.cookieSameSite,
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

function sendAuthResponse(req, res, status, body) {
  const { refreshToken, ...rest } = body;
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(req));
  res.status(status).json({ success: true, data: rest });
}

const staffRegister = asyncHandler(async (req, res) => {
  const result = await authService.registerStaff(req.body);
  sendAuthResponse(req, res, 201, result);
});

const staffLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginStaff(req.body);
  sendAuthResponse(req, res, 200, result);
});

const customerRegister = asyncHandler(async (req, res) => {
  const result = await authService.registerCustomer(req.body);
  sendAuthResponse(req, res, 201, result);
});

const customerLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginCustomer(req.body);
  sendAuthResponse(req, res, 200, result);
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token supplied');
  const result = await authService.refreshTokens(token);
  sendAuthResponse(req, res, 200, result);
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  if (token) await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.status(200).json({ success: true, data: { message: 'Logged out' } });
});

module.exports = { staffRegister, staffLogin, customerRegister, customerLogin, refresh, logout };
