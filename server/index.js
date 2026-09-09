/**
 * LearnUp — API + static server.
 * Modules covered:
 *   1. User Management     — /api/auth/*, /api/me
 *   2. Learning Content    — /api/courses, /api/courses/:id, /api/topics/:id
 *   3. Assessment          — /api/quizzes/:id, /api/attempts, /api/attempts/:id/submit
 *   4. Progress Tracking   — /api/progress/me, /api/topics/:id/complete
 */
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const { db }  = require('./db');
const { authMiddleware, requireRole, register, login } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

/* ------------------------- helpers ------------------------- */
function logActivity(userId, kind, detail) {
  db.prepare(
    `INSERT INTO activity_log (user_id, kind, detail) VALUES (?, ?, ?)`
  ).run(userId, kind, detail || '');
}
function json(res, data, status = 200) { return res.status(status).json(data); }
function safe(handler) {
  return (req, res) => {
    try { return handler(req, res); }
    catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error(e);
      return res.status(status).json({ error: e.message || 'Server error' });
    }
  };
}

/* ============================================================
 * MODULE 1 — User Management
 * ============================================================ */
app.post('/api/auth/register', safe((req, res) => {
  const out = register(req.body || {});
  logActivity(out.user.id, 'account_created', out.user.email);
  json(res, out, 201);
}));

app.post('/api/auth/login', safe((req, res) => {
  const out = login(req.body || {});
  logActivity(out.user.id, 'login', '');
  json(res, out);
}));

app.get('/api/me', authMiddleware(), safe((req, res) => {
  json(res, { user: req.user });
}));

/* ============================================================
 * MODULE 2 — Learning Content
 * ============================================================ */
app.get('/api/courses', authMiddleware(false), safe((req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const rows = db.prepare(`
    SELECT c.id, c.title, c.description,
           u.name AS instructor,
           (SELECT COUNT(*) FROM topics t WHERE t.course_id = c.id) AS topic_count
    FROM   courses c
    LEFT JOIN users u ON u.id = c.instructor_id
    ORDER BY c.title
  `).all();
  const filtered = q
    ? rows.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
    : rows;
  json(res, { courses: filtered });
}));

app.get('/api/courses/:id', authMiddleware(false), safe((req, res) => {
  const id = Number(req.params.id);
  const course = db.prepare(`
    SELECT c.id, c.title, c.description, u.name AS instructor
    FROM   courses c LEFT JOIN users u ON u.id = c.instructor_id
    WHERE  c.id = ?
  `).get(id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const topics = db.prepare(`
    SELECT t.id, t.title, t.position,
           (SELECT COUNT(*) FROM quizzes q WHERE q.topic_id = t.id) AS has_quiz
    FROM   topics t WHERE t.course_id = ? ORDER BY t.position
  `).all(id);

  let completed = new Set();
  if (req.user) {
    const done = db.prepare(
      `SELECT topic_id FROM topic_progress WHERE user_id = ? AND topic_id IN
       (SELECT id FROM topics WHERE course_id = ?)`
    ).all(req.user.id, id);
    completed = new Set(done.map(r => r.topic_id));
  }
  json(res, {
    course,
    topics: topics.map(t => ({ ...t, completed: completed.has(t.id) })),
  });
}));

app.get('/api/topics/:id', authMiddleware(false), safe((req, res) => {
  const id = Number(req.params.id);
  const topic = db.prepare(`
    SELECT t.*, c.title AS course_title
    FROM   topics t JOIN courses c ON c.id = t.course_id
    WHERE  t.id = ?
  `).get(id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const resources = db.prepare(
    `SELECT id, kind, title, url FROM resources WHERE topic_id = ?`
  ).all(id);
  const quiz = db.prepare(
    `SELECT id, title, pass_score FROM quizzes WHERE topic_id = ?`
  ).get(id) || null;

  let completed = false;
  if (req.user) {
    completed = !!db.prepare(
      `SELECT 1 FROM topic_progress WHERE user_id = ? AND topic_id = ?`
    ).get(req.user.id, id);
  }
  json(res, { topic, resources, quiz, completed });
}));

/* ============================================================
 * MODULE 3 — Assessment
 * ============================================================ */
app.get('/api/quizzes/:id', authMiddleware(), safe((req, res) => {
  const id = Number(req.params.id);
  const quiz = db.prepare(`
    SELECT q.id, q.title, q.pass_score, q.topic_id, t.title AS topic_title
    FROM   quizzes q JOIN topics t ON t.id = q.topic_id
    WHERE  q.id = ?
  `).get(id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  const rows = db.prepare(
    `SELECT id, text, options_json FROM questions WHERE quiz_id = ? ORDER BY id`
  ).all(id);
  const questions = rows.map(r => ({
    id: r.id, text: r.text, options: JSON.parse(r.options_json),
  }));
  json(res, { quiz, questions });
}));

app.post('/api/quizzes/:id/attempts', authMiddleware(), safe((req, res) => {
  const quizId = Number(req.params.id);
  const quiz = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(quizId);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  const info = db.prepare(
    `INSERT INTO attempts (user_id, quiz_id) VALUES (?, ?)`
  ).run(req.user.id, quizId);
  json(res, { attempt_id: info.lastInsertRowid }, 201);
}));

app.post('/api/attempts/:id/submit', authMiddleware(), safe((req, res) => {
  const attemptId = Number(req.params.id);
  const attempt = db.prepare(
    `SELECT * FROM attempts WHERE id = ? AND user_id = ?`
  ).get(attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.submitted_at) return res.status(409).json({ error: 'Attempt already submitted' });

  const answers = (req.body && req.body.answers) || {};
  const questions = db.prepare(
    `SELECT id, correct_index, explanation, options_json, text
     FROM questions WHERE quiz_id = ? ORDER BY id`
  ).all(attempt.quiz_id);

  let score = 0;
  const feedback = [];
  const insertAns = db.prepare(
    `INSERT OR REPLACE INTO attempt_answers
       (attempt_id, question_id, selected_index, is_correct)
     VALUES (?, ?, ?, ?)`
  );
  const tx = db.prepare('BEGIN'); tx.run();
  try {
    for (const q of questions) {
      const sel = Number.isInteger(answers[q.id]) ? answers[q.id] : -1;
      const correct = sel === q.correct_index ? 1 : 0;
      insertAns.run(attemptId, q.id, sel, correct);
      if (correct) score++;
      feedback.push({
        question_id:    q.id,
        text:           q.text,
        options:        JSON.parse(q.options_json),
        selected_index: sel,
        correct_index:  q.correct_index,
        is_correct:     !!correct,
        explanation:    q.explanation,
      });
    }
    const total = questions.length;
    const pct = Math.round((score / (total || 1)) * 100);
    db.prepare(
      `UPDATE attempts SET submitted_at = datetime('now'), score = ?, total = ? WHERE id = ?`
    ).run(score, total, attemptId);
    db.prepare('COMMIT').run();

    /* On pass, also mark the associated topic complete (Module 4 hook) */
    const quizRow = db.prepare('SELECT topic_id, pass_score FROM quizzes WHERE id = ?').get(attempt.quiz_id);
    const passed = pct >= (quizRow.pass_score || 60);
    if (passed) {
      db.prepare(
        `INSERT OR IGNORE INTO topic_progress (user_id, topic_id) VALUES (?, ?)`
      ).run(req.user.id, quizRow.topic_id);
    }
    logActivity(req.user.id, 'quiz_submitted', `quiz #${attempt.quiz_id} — ${pct}%`);

    json(res, {
      attempt_id: attemptId,
      score, total, percent: pct,
      passed, pass_score: quizRow.pass_score,
      feedback,
    });
  } catch (e) {
    db.prepare('ROLLBACK').run();
    throw e;
  }
}));

app.get('/api/attempts/:id', authMiddleware(), safe((req, res) => {
  const id = Number(req.params.id);
  const a = db.prepare(
    `SELECT * FROM attempts WHERE id = ? AND user_id = ?`
  ).get(id, req.user.id);
  if (!a) return res.status(404).json({ error: 'Attempt not found' });
  const rows = db.prepare(`
    SELECT q.id AS question_id, q.text, q.options_json, q.correct_index, q.explanation,
           aa.selected_index, aa.is_correct
    FROM   questions q
    LEFT JOIN attempt_answers aa
      ON aa.question_id = q.id AND aa.attempt_id = ?
    WHERE  q.quiz_id = ? ORDER BY q.id
  `).all(id, a.quiz_id);
  const feedback = rows.map(r => ({
    question_id: r.question_id, text: r.text,
    options: JSON.parse(r.options_json),
    correct_index: r.correct_index, selected_index: r.selected_index,
    is_correct: !!r.is_correct, explanation: r.explanation || '',
  }));
  const percent = a.total ? Math.round((a.score / a.total) * 100) : 0;
  json(res, { attempt: a, percent, feedback });
}));

/* ============================================================
 * MODULE 4 — Progress Tracking
 * ============================================================ */
app.post('/api/topics/:id/complete', authMiddleware(), safe((req, res) => {
  const id = Number(req.params.id);
  const topic = db.prepare('SELECT id, title FROM topics WHERE id = ?').get(id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  db.prepare(
    `INSERT OR IGNORE INTO topic_progress (user_id, topic_id) VALUES (?, ?)`
  ).run(req.user.id, id);
  logActivity(req.user.id, 'topic_completed', topic.title);
  json(res, { ok: true });
}));

app.get('/api/progress/me', authMiddleware(), safe((req, res) => {
  const uid = req.user.id;
  const totals = db.prepare(`
    SELECT (SELECT COUNT(*) FROM topics)                                    AS total_topics,
           (SELECT COUNT(*) FROM topic_progress WHERE user_id = ?)          AS completed_topics,
           (SELECT COUNT(*) FROM attempts WHERE user_id = ? AND submitted_at IS NOT NULL) AS attempts_count
  `).get(uid, uid);

  const perCourse = db.prepare(`
    SELECT c.id, c.title,
           (SELECT COUNT(*) FROM topics t WHERE t.course_id = c.id) AS topics_total,
           (SELECT COUNT(*) FROM topics t
              JOIN topic_progress tp ON tp.topic_id = t.id AND tp.user_id = ?
              WHERE t.course_id = c.id) AS topics_completed
    FROM courses c ORDER BY c.title
  `).all(uid);

  const avgRow = db.prepare(`
    SELECT AVG(1.0 * score / total) AS avg_ratio
    FROM   attempts
    WHERE  user_id = ? AND submitted_at IS NOT NULL AND total > 0
  `).get(uid);
  const avg_percent = avgRow.avg_ratio ? Math.round(avgRow.avg_ratio * 100) : 0;

  /* Last 7 days of quiz activity */
  const trend = db.prepare(`
    SELECT DATE(submitted_at) AS day, COUNT(*) AS n, AVG(1.0 * score / total) AS avg_ratio
    FROM   attempts
    WHERE  user_id = ? AND submitted_at IS NOT NULL
      AND  submitted_at >= datetime('now','-6 days')
    GROUP BY DATE(submitted_at)
    ORDER BY day
  `).all(uid);

  const recentAttempts = db.prepare(`
    SELECT a.id, a.score, a.total, a.submitted_at,
           q.title AS quiz_title, t.title AS topic_title
    FROM   attempts a
    JOIN   quizzes q ON q.id = a.quiz_id
    JOIN   topics  t ON t.id = q.topic_id
    WHERE  a.user_id = ? AND a.submitted_at IS NOT NULL
    ORDER BY a.submitted_at DESC LIMIT 8
  `).all(uid);

  const activity = db.prepare(`
    SELECT kind, detail, created_at
    FROM   activity_log WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 12
  `).all(uid);

  json(res, {
    totals, avg_percent, per_course: perCourse, trend,
    recent_attempts: recentAttempts, activity,
  });
}));

/* ------------------- static frontend ------------------- */
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/', (_req, res) => res.redirect('/login.html'));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`LearnUp API + UI running at http://localhost:${PORT}`);
});
