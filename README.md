# LearnUp — Digital Learning Platform

A **full-stack** learning platform where students take courses, work through
topics, submit quizzes, and see their progress over time. Built for the
**Review 1** submission of a B.Tech CSE mini-project.

Team **CodeHats** — Ajay.R · Dharsan.K · Dharnis.K · Guide: Mrs. Jeny (AP/CSE)

---

## Modules implemented (Modules 1–4)

| # | Module              | What ships in this build                                                  |
|---|---------------------|---------------------------------------------------------------------------|
| 1 | **User Management** | Register / login / logout, bcrypt password hashing, JWT sessions, roles (student/instructor/admin), route-level auth middleware |
| 2 | **Learning Content**| Course catalog with search, per-course topic list, topic reader with markdown content + external resources (readings / videos), completion tracking |
| 3 | **Assessment**      | Quiz per topic (MCQ), attempt lifecycle (start → answer → submit), server-side scoring, instant feedback with per-question explanations, pass mark, auto-completion of the topic on pass |
| 4 | **Progress Tracking** | Topics-completed count, quiz-attempts count, average score, 7-day quiz-score trend chart, per-course progress bars, recent attempts, activity feed |

Modules 5 (Recommendation Engine) and 6 (Instructor Dashboard) are on the
roadmap for Review 2 — the schema and API were designed with them in mind.

---

## Tech stack

- **Backend:** Node.js 22+ · Express 4 · `node:sqlite` (built-in, zero native deps) · `bcryptjs` · `jsonwebtoken`
- **Frontend:** Vanilla HTML5 + CSS3 + ES6 (no build step, no framework)
- **Storage:** SQLite file at `data/learnup.db` (WAL mode, foreign keys on)

Chosen deliberately for a review demo: no build tools, no cloud, no `node-gyp`
compile step — it runs on any Windows machine with Node.

---

## Run it

```bash
npm install
npm run seed        # (re)creates data/learnup.db with demo users, courses, quizzes
npm start           # http://localhost:3000
```

Open <http://localhost:3000> — you'll land on the login page.

### Demo accounts

| Role       | Email                    | Password        |
|------------|--------------------------|-----------------|
| Student    | `dharnis@learnup.dev`    | `student123`    |
| Student    | `ajay@learnup.dev`       | `student123`    |
| Student    | `dharsan@learnup.dev`    | `student123`    |
| Instructor | `jeny@learnup.dev`       | `instructor123` |
| Admin      | `admin@learnup.dev`      | `admin123`      |

The **Dharnis** account is pre-seeded with progress (3 topics complete + 3
quiz attempts) so the Progress screen has data on first load.

---

## Project layout

```
learnup/
├── package.json
├── server/
│   ├── index.js        Express app + all API routes
│   ├── db.js           SQLite bootstrap (schema, indexes)
│   ├── auth.js         Module 1 — register / login / JWT middleware
│   └── seed.js         idempotent demo seed (users, courses, quizzes)
├── public/
│   ├── styles.css      shared styles (design tokens + components)
│   ├── app.js          shared client helper (token store, api(), topbar)
│   ├── login.html      Module 1 — sign in
│   ├── register.html   Module 1 — new student
│   ├── dashboard.html  Module 2 — course catalog
│   ├── course.html     Module 2 — topic list for a course
│   ├── topic.html      Module 2 — read topic + resources + start quiz
│   ├── quiz.html       Module 3 — take a quiz
│   ├── result.html     Module 3 — score + per-question feedback
│   └── progress.html   Module 4 — trends, per-course, attempts, activity
├── data/               created on first run (contains learnup.db)
├── legacy/             the earlier RAG prototype (archived, not wired up)
├── README.md
├── DEMO_SCRIPT.md
└── LearnUp_Architecture.pdf
```

---

## HTTP API

All endpoints return JSON. Auth-required endpoints expect
`Authorization: Bearer <jwt>`.

### Module 1 — User Management
| Method | Path                    | Purpose                              |
|--------|-------------------------|--------------------------------------|
| POST   | `/api/auth/register`    | create a new student account         |
| POST   | `/api/auth/login`       | exchange email/password for a JWT    |
| GET    | `/api/me`               | current user (from token)            |

### Module 2 — Learning Content
| Method | Path                    | Purpose                              |
|--------|-------------------------|--------------------------------------|
| GET    | `/api/courses?q=`       | list courses, optional search        |
| GET    | `/api/courses/:id`      | course + topics + per-user done flag |
| GET    | `/api/topics/:id`       | topic content + resources + quiz link|

### Module 3 — Assessment
| Method | Path                                  | Purpose                              |
|--------|---------------------------------------|--------------------------------------|
| GET    | `/api/quizzes/:id`                    | fetch quiz with questions (no answers)|
| POST   | `/api/quizzes/:id/attempts`           | start a new attempt                  |
| POST   | `/api/attempts/:id/submit`            | grade + return feedback              |
| GET    | `/api/attempts/:id`                   | review a past attempt                |

### Module 4 — Progress Tracking
| Method | Path                        | Purpose                              |
|--------|-----------------------------|--------------------------------------|
| POST   | `/api/topics/:id/complete`  | mark a topic complete                |
| GET    | `/api/progress/me`          | totals + trend + per-course + activity |

---

## Database schema (SQLite)

```
users            (id, name, email UNIQUE, password_hash, role, created_at)
courses          (id, title, description, instructor_id -> users, created_at)
topics           (id, course_id, title, content, position)
resources        (id, topic_id, kind, title, url)
quizzes          (id, topic_id, title, pass_score)
questions        (id, quiz_id, text, options_json, correct_index, explanation)
attempts         (id, user_id, quiz_id, started_at, submitted_at, score, total)
attempt_answers  (attempt_id, question_id, selected_index, is_correct)   PK
topic_progress   (user_id, topic_id, completed_at)                       PK
activity_log     (id, user_id, kind, detail, created_at)
```

Passing a quiz auto-inserts into `topic_progress`, which is what feeds the
Module-4 stats — so the four modules chain naturally.

---

## What each screen exercises

- **`/login` → `/dashboard`** — Module 1 auth flow, JWT saved to `localStorage`.
- **`/dashboard`** — Module 2 catalog + Module 4 top-line stats.
- **`/course?id=`** — Module 2 topic list with completion checkmarks.
- **`/topic?id=`** — Module 2 reader + resources, Module 4 "mark complete".
- **`/quiz?id=`** — Module 3 attempt: start → answer → submit.
- **`/result?id=`** — Module 3 feedback + Module 4 auto-completion on pass.
- **`/progress`** — Module 4 dashboard: trend chart, per-course bars, recent attempts, activity.

---

## Security notes

- Passwords stored via bcrypt (10 rounds).
- JWT signed with `JWT_SECRET` env var (falls back to a dev secret for the demo).
- All privileged routes use `authMiddleware()`; role-restricted routes wrap it with `requireRole(...)`.
- Correct answers are never sent to the client during a quiz — only after submit.
- SQL injection is prevented by using parameterized `db.prepare(...)` everywhere; no string concatenation of query fragments.

---

## Roadmap (Review 2)

- **Module 5 — Recommendation Engine**  
  Rule-based next-topic suggestion (recommend prerequisite when quiz < pass, advanced material when > 90%). Later, plug in a lightweight KNN or a knowledge-tracing model.
- **Module 6 — Instructor Dashboard**  
  Per-course engagement, topic-level weakness heatmap, individual student drill-down.
- Streak / gamification for students.
- Real content pipeline for PDF/PPT uploads (the archived RAG prototype in `legacy/` explores this).
