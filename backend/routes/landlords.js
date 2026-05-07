const router = require('express').Router();
const db     = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ── GET /api/landlords/me — own profile + live dashboard stats ──
router.get('/me', authenticate, requireRole('landlord'), async (req, res) => {
  try {
    const [profile, stats] = await Promise.all([
      db.query('SELECT * FROM landlords WHERE id=$1', [req.user.refId]),
      db.query(`
        SELECT
          COUNT(DISTINCT p.id)                                          AS total_properties,
          COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'vacant')      AS vacant_count,
          COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active')      AS total_tenants,
          COUNT(DISTINCT t.id) FILTER (WHERE t.pay_status = 'overdue') AS overdue_count,
          COUNT(DISTINCT t.id) FILTER (
            WHERE t.lease_end BETWEEN NOW() AND NOW() + INTERVAL '30 days'
          )                                                             AS expiring_soon,
          COALESCE(SUM(p.rent), 0)                                      AS monthly_rent_roll
        FROM landlords l
        LEFT JOIN properties p ON p.landlord_id = l.id
        LEFT JOIN tenants    t ON t.landlord_id = l.id AND t.status = 'active'
        WHERE l.id = $1`,
        [req.user.refId]
      ),
    ]);

    if (profile.rows.length === 0)
      return res.status(404).json({ error: 'Landlord not found' });

    res.json({ ...profile.rows[0], ...stats.rows[0] });
  } catch (err) {
    console.error('GET /landlords/me:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/landlords/me — update own profile ───────────────
router.put('/me', authenticate, requireRole('landlord'), async (req, res) => {
  const { name, phone, city, plan } = req.body;
  try {
    await db.query(
      `UPDATE landlords
       SET name=COALESCE($1,name), phone=COALESCE($2,phone),
           city=COALESCE($3,city), plan=COALESCE($4,plan)
       WHERE id=$5`,
      [name, phone, city, plan, req.user.refId]
    );
    const updated = await db.query('SELECT * FROM landlords WHERE id=$1', [req.user.refId]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/landlords/:id — admin only ─────────────────────
router.get('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM landlords WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
