const jwt = require('jsonwebtoken');
const Student = require('../models/student');
const Admin = require('../models/admin');

const protect = async (req, res, next) => {
  let token;

  try {
    // ✅ Check for Bearer token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];

      // ✅ Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Identify role and fetch user
      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
      } else if (decoded.role === 'student') {
        req.user = await Student.findById(decoded.id).select('-password');
      } else {
        return res.status(401).json({ message: 'Invalid user role' });
      }

      // ✅ If no user found
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Ensure req.user.role is set (fallback to token role) to avoid accidental 403
      if (!req.user.role && decoded && decoded.role) {
        req.user.role = decoded.role;
      }

      next();
    } else {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Optional authentication - allows guests but extracts user if token present
const optionalAuth = async (req, res, next) => {
  let token;

  try {
    // Check for Bearer token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Identify role and fetch user
        if (decoded.role === 'admin') {
          req.user = await Admin.findById(decoded.id).select('-password');
        } else if (decoded.role === 'student') {
          req.user = await Student.findById(decoded.id).select('-password');
        }
      } catch (tokenError) {
        // Invalid token, but we continue as guest
        console.debug('Invalid token provided:', tokenError.message);
      }
    }
    // Always continue, whether authenticated or not
    next();
  } catch (error) {
    console.error('❌ Optional auth middleware error:', error.message);
    // Continue anyway
    next();
  }
};

module.exports = { protect, optionalAuth };
