/**
 * Get secure cookie options based on environment and request protocol
 * @param {Object} req - Express request object
 * @returns {Object} Cookie options
 */
export const getCookieOptions = (req) => {
  // Check if request is over HTTPS (either from req.secure or x-forwarded-proto header)
  const isSecure = req.secure || req.get('x-forwarded-proto') === 'https';
  
  return {
    httpOnly: true,
    secure: isSecure, // Only set secure flag if request is HTTPS
    sameSite: isSecure ? 'none' : 'lax', // Use 'none' only if secure, otherwise 'lax'
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
};
