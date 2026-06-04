const { doubleCsrf } = require('csrf-csrf');

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || process.env.JWT_SECRET,
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  getSessionIdentifier: (req) => 'stateless',
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

module.exports = { generateCsrfToken, doubleCsrfProtection };
