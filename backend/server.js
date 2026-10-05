require('dotenv').config();
const express = require('express'), mysql = require('mysql2/promise'), cors = require('cors');
const helmet = require('helmet'), rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { body, query, param, validationResult } = require('express-validator');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));
app.use('/api', rateLimit({ windowMs: 60000, max: 100 }));
const loginLimiter = rateLimit({ windowMs: 15 * 60000, max: 10, message: { error: 'Too many login attempts' } });

const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 10,
});

const check = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: e.array().map(x => ({ field: x.path, msg: x.msg })) });
  next();
};
const auth = (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try { const p = jwt.verify(t, process.env.JWT_SECRET); if (p.role !== 'admin') throw 0; req.admin = p; next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};
const bearer = req => (req.headers.authorization || '').replace('Bearer ', '');
const userAuth = (req, res, next) => {
  try { const p = jwt.verify(bearer(req), process.env.JWT_SECRET); if (p.role !== 'user') throw 0; req.user = p; next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};
const optUser = (req, res, next) => {
  try { const p = jwt.verify(bearer(req), process.env.JWT_SECRET); if (p.role === 'user') req.user = p; } catch {}
  next();
};
const tokenFor = u => jwt.sign({ id: u.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '2h' });
const wrap = fn => (req, res, next) => fn(req, res).catch(next);

const INTERESTS = ['drone_training', 'drone_services', 'content_media', 'other'];
const STATUSES = ['new', 'contacted', 'in_progress', 'closed'];
const USER_TYPES = ['student', 'customer', 'other'];
const clean = v => String(v).replace(/[<>]/g, '');

// ---- Auth ----
app.post('/api/auth/login', loginLimiter,
  body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 }), check,
  wrap(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [req.body.email]);
    if (!rows[0] || !(await bcrypt.compare(req.body.password, rows[0].password_hash)))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: rows[0].id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  }));

// ---- User accounts ----
app.post('/api/users/register', loginLimiter,
  body('name').trim().isLength({ min: 2, max: 100 }).customSanitizer(clean),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters'), check,
  wrap(async (req, res) => {
    try {
      const hash = await bcrypt.hash(req.body.password, 10);
      const [r] = await pool.query('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)', [req.body.name, req.body.email, hash]);
      res.status(201).json({ token: tokenFor({ id: r.insertId }), name: req.body.name });
    } catch (e) { if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' }); throw e; }
  }));
app.post('/api/users/login', loginLimiter,
  body('email').isEmail().normalizeEmail(), body('password').notEmpty(), check,
  wrap(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [req.body.email]);
    if (!rows[0] || !(await bcrypt.compare(req.body.password, rows[0].password_hash)))
      return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: tokenFor(rows[0]), name: rows[0].name });
  }));
app.get('/api/my/enquiries', userAuth, wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM enquiries WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(rows);
}));

// ---- Enquiries (CRUD) ----
// CREATE (public)
app.post('/api/enquiries', optUser,
  body('name').trim().isLength({ min: 2, max: 100 }).customSanitizer(clean),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).matches(/^[0-9+\-\s]{7,15}$/).withMessage('Invalid phone'),
  body('interest').optional().isIn(INTERESTS),
  body('message').trim().isLength({ min: 5, max: 1000 }).customSanitizer(clean),
  body('user_type').optional().isIn(USER_TYPES),
  body('source').optional().isIn(['chatbot', 'form']), check,
  wrap(async (req, res) => {
    const { name, email, phone = null, user_type = 'other', interest = 'other', message, source = 'form' } = req.body;
    const [r] = await pool.query(
      'INSERT INTO enquiries (name,email,phone,user_type,interest,message,source,user_id) VALUES (?,?,?,?,?,?,?,?)',
      [name, email, phone, user_type, interest, message, source, req.user?.id || null]);
    res.status(201).json({ id: r.insertId, message: 'Enquiry submitted' });
  }));

// READ list with search / filter / pagination (admin)
app.get('/api/enquiries', auth,
  query('status').optional().isIn(STATUSES), query('user_type').optional().isIn(USER_TYPES), query('interest').optional().isIn(INTERESTS),
  query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 }), check,
  wrap(async (req, res) => {
    const { q, status, interest, user_type } = req.query;
    const page = +req.query.page || 1, limit = +req.query.limit || 10;
    const where = [], args = [];
    if (q) { where.push('(name LIKE ? OR email LIKE ? OR message LIKE ?)'); args.push(...Array(3).fill(`%${q}%`)); }
    if (status) { where.push('status = ?'); args.push(status); }
    if (interest) { where.push('interest = ?'); args.push(interest); }
    if (user_type) { where.push('user_type = ?'); args.push(user_type); }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM enquiries ${w}`, args);
    const [data] = await pool.query(`SELECT * FROM enquiries ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...args, limit, (page - 1) * limit]);
    res.json({ data, total, page, limit });
  }));

// READ one
app.get('/api/enquiries/:id', auth, param('id').isInt(), check, wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [req.params.id]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
}));

// UPDATE
app.put('/api/enquiries/:id', auth, param('id').isInt(),
  body('status').optional().isIn(STATUSES), body('interest').optional().isIn(INTERESTS),
  body('message').optional().trim().isLength({ min: 5, max: 1000 }).customSanitizer(clean), check,
  wrap(async (req, res) => {
    const f = ['status', 'interest', 'message'].filter(k => req.body[k] !== undefined);
    if (!f.length) return res.status(400).json({ error: 'Nothing to update' });
    const [r] = await pool.query(`UPDATE enquiries SET ${f.map(k => k + '=?').join(',')} WHERE id=?`,
      [...f.map(k => req.body[k]), req.params.id]);
    r.affectedRows ? res.json({ message: 'Updated' }) : res.status(404).json({ error: 'Not found' });
  }));

// DELETE
app.delete('/api/enquiries/:id', auth, param('id').isInt(), check, wrap(async (req, res) => {
  const [r] = await pool.query('DELETE FROM enquiries WHERE id = ?', [req.params.id]);
  r.affectedRows ? res.json({ message: 'Deleted' }) : res.status(404).json({ error: 'Not found' });
}));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });

(async () => {
  const [a] = await pool.query('SELECT id FROM admins LIMIT 1');
  if (!a.length) {
    await pool.query('INSERT INTO admins (email,password_hash) VALUES (?,?)',
      [process.env.ADMIN_EMAIL, await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)]);
    console.log('Admin seeded:', process.env.ADMIN_EMAIL);
  }
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
})();
