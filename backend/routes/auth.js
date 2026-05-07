const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../db');
const { authenticate } = require('../middleware/auth');

// ── POST /api/auth/register — landlord self-registration ─────
router.post('/register', async (req, res) => {
  const { name, email, password, phone, city, plan } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  try {
    const exists = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const counter = await db.query(
      "UPDATE id_counters SET value=value+1 WHERE name='landlord' RETURNING value"
    );
    const llId = 'LL' + String(counter.rows[0].value).padStart(3, '0');
    const planExpiry = new Date();
    planExpiry.setDate(planExpiry.getDate() + 30);

    const user = await db.query(
      'INSERT INTO users (email,password,role,ref_id) VALUES ($1,$2,$3,$4) RETURNING id',
      [email, hashed, 'landlord', llId]
    );
    await db.query(
      'INSERT INTO landlords (id,user_id,name,email,phone,city,plan,plan_expiry) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [llId, user.rows[0].id, name, email, phone||'', city||'', plan||'basic', planExpiry.toISOString().split('T')[0]]
    );
    res.status(201).json({ landlordId: llId, message: 'Account created. Please sign in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
// expectedRole enforces portal separation: landlord|tenant|admin
router.post('/login', async (req, res) => {
  const { email, password, tenantId, landlordId, expectedRole } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });

  try {
    let result;

    if (tenantId) {
      result = await db.query('SELECT * FROM users WHERE ref_id=$1 AND role=$2', [tenantId.trim(), 'tenant']);
      if (!result.rows.length)
        return res.status(401).json({ error: 'Tenant ID not found. Please check and try again.' });
    } else if (landlordId) {
      result = await db.query('SELECT * FROM users WHERE ref_id=$1 AND role=$2', [landlordId.trim(), 'landlord']);
      if (!result.rows.length)
        return res.status(401).json({ error: 'Landlord ID not found. Please check and try again.' });
    } else if (email) {
      result = await db.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)', [email.trim()]);
      if (!result.rows.length)
        return res.status(401).json({ error: 'Invalid credentials' });

      // Enforce role — wrong portal gets a clear message
      if (expectedRole && result.rows[0].role !== expectedRole) {
        const labels = { landlord:'Landlord portal', tenant:'Tenant portal', admin:'Admin portal' };
        return res.status(403).json({
          error: `This account belongs to the ${labels[result.rows[0].role]||result.rows[0].role}. Please use the correct portal.`
        });
      }
    } else {
      return res.status(400).json({ error: 'Email, Tenant ID, or Landlord ID is required' });
    }

    const user = result.rows[0];

    // Extra guard: ID-based logins on wrong portal
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({ error: 'This account cannot log in here. Please use the correct portal.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Incorrect password. Please try again.' });

    const token = jwt.sign(
      { 
        id: result.rows[0].id,
        role: result.rows[0].role,
        refId: result.rows[0].ref_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );
    res.json({ token, role: user.role, refId: user.ref_id, mustChangePwd: user.must_change_pwd });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── POST /api/auth/change-password ───────────────────────────
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  try {
    const user = await db.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

    if (currentPassword) {
      const valid = await bcrypt.compare(currentPassword, user.rows[0].password);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password=$1, must_change_pwd=FALSE WHERE id=$2', [hashed, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id, email, role, ref_id, must_change_pwd FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!user.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
