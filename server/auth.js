/**
 * Module 1 — User Management. JWT + bcrypt.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'learnup-dev-secret-change-in-prod';
const JWT_TTL    = '7d';

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_TTL }
  );
}

function authMiddleware(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (!required) return next();
      return res.status(401).json({ error: 'Missing bearer token' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare(
        'SELECT id,name,email,role FROM users WHERE id = ?'
      ).get(decoded.sub);
      if (!user) return res.status(401).json({ error: 'User no longer exists' });
      req.user = user;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)           return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — role not permitted' });
    }
    next();
  };
}

function register({ name, email, password, role }) {
  if (!name || !email || !password) {
    const e = new Error('name, email, password are required'); e.status = 400; throw e;
  }
  if (password.length < 6) {
    const e = new Error('Password must be at least 6 characters'); e.status = 400; throw e;
  }
  const finalRole = role === 'instructor' || role === 'admin' ? 'student' : (role || 'student');
  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
  if (exists) { const e = new Error('Email already registered'); e.status = 409; throw e; }
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)'
  ).run(name, email, hash, finalRole);
  const user = db.prepare(
    'SELECT id,name,email,role FROM users WHERE id = ?'
  ).get(info.lastInsertRowid);
  return { user, token: issueToken(user) };
}

function login({ email, password }) {
  const row = db.prepare(
    'SELECT id,name,email,role,password_hash FROM users WHERE email = ?'
  ).get(email);
  if (!row) { const e = new Error('Invalid email or password'); e.status = 401; throw e; }
  if (!bcrypt.compareSync(password || '', row.password_hash)) {
    const e = new Error('Invalid email or password'); e.status = 401; throw e;
  }
  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  return { user, token: issueToken(user) };
}

module.exports = { authMiddleware, requireRole, register, login, issueToken };
