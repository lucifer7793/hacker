const jwt = require('jsonwebtoken');

// Extract the token from the request header
const extractToken = req => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  };
  
  // Verify the token and attach the decoded payload to the request object
  const verifyToken = async token => {
    try {
      const decoded = await jwt.verify(token, process.env.jwtSecret || "abcd1234");
      req.user = decoded;
    } catch (error) {
      req.user = null;
    }
  };
  
// Middleware to check for a valid JWT token
const authenticate = async (req, res, next) => {
    const token = extractToken(req);
    if (!token) return res.status(401).send({ message: 'Unauthorized' });
    await verifyToken(token);
    if (!req.user) return res.status(401).send({ message: 'Invalid token' });
    next();
};

module.exports = {
    authenticate
}