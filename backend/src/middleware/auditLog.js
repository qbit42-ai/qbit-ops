/**
 * Audit logging middleware for token minting
 */
const auditTokenMint = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Log token minting events
    if (req.path.includes('/tokens/') && req.method === 'POST' && req.admin && data.user) {
      console.log('[AUDIT] Token Minted:', {
        adminId: req.admin._id,
        adminEmail: req.admin.email,
        targetUserId: req.body.userId || data.user._id || data.user.id,
        targetUserEmail: data.user.email,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress,
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = { auditTokenMint };
