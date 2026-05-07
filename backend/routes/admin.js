const router = require('express').Router();
const db     = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ── GET /api/admin/stats — platform summary ──────────────────
router.get('/stats', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [ll, tn, pr, ov, subExp] = await Promise.all([
      db.query("SELECT COUNT(*) FROM landlords WHERE status='active'"),
      db.query("SELECT COUNT(*) FROM tenants WHERE status='active'"),
      db.query('SELECT COUNT(*) FROM properties'),
      db.query("SELECT COUNT(*) FROM tenants WHERE pay_status='overdue'"),
      db.query("SELECT COUNT(*) FROM landlords WHERE plan_expiry <= NOW() + INTERVAL '7 days' AND status='active'"),
    ]);
    res.json({
      landlords:       parseInt(ll.rows[0].count),
      tenants:         parseInt(tn.rows[0].count),
      properties:      parseInt(pr.rows[0].count),
      overdue:         parseInt(ov.rows[0].count),
      expiringSubs:    parseInt(subExp.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/admin/landlords ─────────────────────────────────
router.get('/landlords', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*,
              COUNT(DISTINCT p.id) AS prop_count,
              COUNT(DISTINCT t.id) AS tenant_count
       FROM landlords l
       LEFT JOIN properties p ON l.id = p.landlord_id
       LEFT JOIN tenants    t ON l.id = t.landlord_id
       GROUP BY l.id
       ORDER BY l.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/admin/landlords/:id — full edit ─────────────────
router.put('/landlords/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { name, email, phone, city, plan, status, planExpiry } = req.body;
  try {
    await db.query(
      `UPDATE landlords SET
         name        = COALESCE($1, name),
         email       = COALESCE($2, email),
         phone       = COALESCE($3, phone),
         city        = COALESCE($4, city),
         plan        = COALESCE($5, plan),
         status      = COALESCE($6, status),
         plan_expiry = COALESCE($7, plan_expiry)
       WHERE id = $8`,
      [name, email, phone, city, plan, status, planExpiry || null, req.params.id]
    );
    const ll = await db.query('SELECT * FROM landlords WHERE id=$1', [req.params.id]);
    res.json(ll.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/admin/landlords/:id/status — suspend/activate ───
router.put('/landlords/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE landlords SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/admin/landlords/:id/extend — extend subscription ─
router.put('/landlords/:id/extend', authenticate, requireRole('admin'), async (req, res) => {
  const { months, exactDate } = req.body;
  try {
    let newExpiry;
    if (exactDate) {
      newExpiry = exactDate;
    } else {
      const current = await db.query('SELECT plan_expiry FROM landlords WHERE id=$1', [req.params.id]);
      const base = new Date(current.rows[0].plan_expiry);
      base.setMonth(base.getMonth() + parseInt(months || 1));
      newExpiry = base.toISOString().split('T')[0];
    }
    await db.query('UPDATE landlords SET plan_expiry=$1 WHERE id=$2', [newExpiry, req.params.id]);
    res.json({ success: true, planExpiry: newExpiry });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/admin/subscriptions — subscription tracker ──────
router.get('/subscriptions', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*,
              COUNT(DISTINCT p.id) AS prop_count,
              COUNT(DISTINCT t.id) AS tenant_count,
              (l.plan_expiry - CURRENT_DATE) AS days_remaining
       FROM landlords l
       LEFT JOIN properties p ON l.id = p.landlord_id
       LEFT JOIN tenants    t ON l.id = t.landlord_id
       GROUP BY l.id
       ORDER BY l.plan_expiry ASC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
