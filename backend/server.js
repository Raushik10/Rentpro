const express = require('express');
const cors    = require('cors');
const path    = require('path');
const app     = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads inline (view-only)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Disposition', 'inline');
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/landlords',     require('./routes/landlords'));
app.use('/api/properties',    require('./routes/properties'));
app.use('/api/tenants',       require('./routes/tenants'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/marketplace',   require('./routes/marketplace'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`RentPro API on port ${PORT}`));
