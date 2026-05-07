const router = require('express').Router();
const db     = require('../db');
const { authenticate } = require('../middleware/auth');

// ── GET /api/payments ────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await db.query(
        `SELECT py.*, t.name AS tenant_name, p.name AS property_name
         FROM payments py
         LEFT JOIN tenants    t ON py.tenant_id   = t.id
         LEFT JOIN properties p ON py.property_id = p.id
         ORDER BY py.paid_at DESC LIMIT 200`
      );
    } else if (req.user.role === 'landlord') {
      result = await db.query(
        `SELECT py.*, t.name AS tenant_name, p.name AS property_name
         FROM payments py
         LEFT JOIN tenants    t ON py.tenant_id   = t.id
         LEFT JOIN properties p ON py.property_id = p.id
         WHERE py.landlord_id = $1
         ORDER BY py.paid_at DESC`,
        [req.user.refId]
      );
    } else {
      result = await db.query(
        'SELECT * FROM payments WHERE tenant_id=$1 ORDER BY paid_at DESC',
        [req.user.refId]
      );
    }
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
