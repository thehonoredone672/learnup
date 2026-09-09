/**
 * LearnUp — database bootstrap.
 * Uses Node's built-in node:sqlite (Node >= 22). Zero native deps.
 * Schema covers Modules 1-4: users, courses, topics, resources, quizzes,
 * questions, attempts, attempt_answers, topic_progress, activity_log.
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'learnup.db');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('student','instructor','admin')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL DEFAULT '',
  instructor_id INTEGER REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topics (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  content    TEXT    NOT NULL DEFAULT '',
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS resources (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  kind     TEXT    NOT NULL CHECK (kind IN ('reading','video','link','pdf')),
  title    TEXT    NOT NULL,
  url      TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS quizzes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  pass_score INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE IF NOT EXISTS questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id       INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text          TEXT    NOT NULL,
  options_json  TEXT    NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation   TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS attempts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id      INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  started_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  score        INTEGER,
  total        INTEGER
);

CREATE TABLE IF NOT EXISTS attempt_answers (
  attempt_id     INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id    INTEGER NOT NULL REFERENCES questions(id),
  selected_index INTEGER NOT NULL,
  is_correct     INTEGER NOT NULL,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS topic_progress (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id     INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  completed_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT    NOT NULL,
  detail     TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS ix_topics_course     ON topics(course_id, position);
CREATE INDEX IF NOT EXISTS ix_resources_topic   ON resources(topic_id);
CREATE INDEX IF NOT EXISTS ix_questions_quiz    ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS ix_attempts_user     ON attempts(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS ix_activity_user     ON activity_log(user_id, created_at DESC);
`);

module.exports = { db, DB_PATH };
