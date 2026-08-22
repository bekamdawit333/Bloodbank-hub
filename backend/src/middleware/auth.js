const jwt = require('jsonwebtoken');
const { mainDb } = require('../config/prisma');
const JWT_SECRET = process.env.JWT_SECRET;

// Authenticates the request JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // The token signature alone is not enough: the account must still exist
    // and be approved (e.g. tokens issued before a database reset must die here).
    try {
      const dbUser = await mainDb.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, role: true, status: true }
      });

      if (!dbUser) {
        return res.status(401).json({ error: 'Your account no longer exists. Please sign in again.' });
      }
      if (dbUser.status !== 'approved') {
        return res.status(401).json({ error: `Account is ${dbUser.status}. Sign in again after it is approved.` });
      }

      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status
      };
      next();
    } catch (dbErr) {
      next(dbErr);
    }
  });
}

// Restricts routes to specific roles
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized access for your role' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET,
};

