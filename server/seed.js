/**
 * LearnUp — seed script. Idempotent: wipes and re-seeds demo data.
 * Run with: npm run seed
 */
const bcrypt = require('bcryptjs');
const { db, DB_PATH } = require('./db');

console.log('Seeding', DB_PATH);

const tables = [
  'attempt_answers','attempts','topic_progress','activity_log',
  'questions','quizzes','resources','topics','courses','users'
];
for (const t of tables) db.exec(`DELETE FROM ${t};`);
db.exec(`DELETE FROM sqlite_sequence;`);

const hash = (p) => bcrypt.hashSync(p, 10);

const insertUser = db.prepare(
  `INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)`
);
const users = [
  ['Dharnis M',       'dharnis@learnup.dev',  hash('student123'),    'student'],
  ['Ajay R',          'ajay@learnup.dev',     hash('student123'),    'student'],
  ['Dharsan K',       'dharsan@learnup.dev',  hash('student123'),    'student'],
  ['Jeny (Faculty)',  'jeny@learnup.dev',     hash('instructor123'), 'instructor'],
  ['Admin',           'admin@learnup.dev',    hash('admin123'),      'admin'],
];
const userIds = users.map(u => insertUser.run(...u).lastInsertRowid);
const instructorId = userIds[3];

const insertCourse = db.prepare(
  `INSERT INTO courses (title,description,instructor_id) VALUES (?,?,?)`
);
const insertTopic = db.prepare(
  `INSERT INTO topics (course_id,title,content,position) VALUES (?,?,?,?)`
);
const insertResource = db.prepare(
  `INSERT INTO resources (topic_id,kind,title,url) VALUES (?,?,?,?)`
);
const insertQuiz = db.prepare(
  `INSERT INTO quizzes (topic_id,title,pass_score) VALUES (?,?,?)`
);
const insertQuestion = db.prepare(
  `INSERT INTO questions (quiz_id,text,options_json,correct_index,explanation) VALUES (?,?,?,?,?)`
);

function addQuiz(topicId, title, questions, passScore = 60) {
  const quizId = insertQuiz.run(topicId, title, passScore).lastInsertRowid;
  for (const q of questions) {
    insertQuestion.run(
      quizId, q.text, JSON.stringify(q.options), q.correct, q.explanation || ''
    );
  }
  return quizId;
}

/* ============================================================
 * COURSE 1 — Data Structures
 * ============================================================ */
const c1 = insertCourse.run(
  'Data Structures',
  'Foundations of arrays, linked lists, stacks, queues, trees and graphs. '
  + 'A core B.Tech CSE subject with hands-on quizzes after every topic.',
  instructorId
).lastInsertRowid;

const t1_1 = insertTopic.run(c1, 'Arrays & Complexity',
  `An **array** is a contiguous block of memory that stores elements of the same type.\n\n`
  + `Accessing an element by index is **O(1)**. Inserting or deleting in the middle is O(n) because subsequent elements shift.\n\n`
  + `Big-O notation describes how the running time grows with input size n. The three most common classes are:\n`
  + `- **O(1)** — constant, e.g. array indexing\n`
  + `- **O(log n)** — logarithmic, e.g. binary search on a sorted array\n`
  + `- **O(n)** — linear, e.g. a single loop over n items\n`, 1
).lastInsertRowid;
insertResource.run(t1_1, 'reading', 'Big-O cheat sheet', 'https://www.bigocheatsheet.com/');
insertResource.run(t1_1, 'video',   'MIT 6.006 — Complexity intro', 'https://www.youtube.com/watch?v=v4cd1O4zkGw');
addQuiz(t1_1, 'Arrays & Complexity — Quick Check', [
  { text: 'What is the time complexity of accessing an element in an array by index?',
    options: ['O(1)','O(log n)','O(n)','O(n log n)'], correct: 0,
    explanation: 'Arrays are stored contiguously so index-based access is a direct memory offset.' },
  { text: 'Inserting an element at the beginning of an array of length n is:',
    options: ['O(1)','O(log n)','O(n)','O(n^2)'], correct: 2,
    explanation: 'All n existing elements must shift one position to the right.' },
  { text: 'Binary search on a sorted array runs in:',
    options: ['O(1)','O(log n)','O(n)','O(n log n)'], correct: 1,
    explanation: 'Each step halves the search space.' },
  { text: 'Which best describes Big-O notation?',
    options: ['Exact running time','Best-case running time','Upper bound on growth rate','Lower bound on growth rate'], correct: 2,
    explanation: 'Big-O is an asymptotic upper bound describing worst-case growth.' },
  { text: 'The complexity O(n^2) is typical of:',
    options: ['A nested loop over n elements','A single loop','Recursive halving','Hash lookups'], correct: 0 },
]);

const t1_2 = insertTopic.run(c1, 'Linked Lists',
  `A **linked list** is a sequence of nodes where each node holds data and a pointer to the next node.\n\n`
  + `Compared to arrays: insertion/deletion at the head is **O(1)** because there is no shift. But random access is **O(n)** because you must traverse from the head.\n\n`
  + `Variants: singly linked, doubly linked, and circular.\n`, 2
).lastInsertRowid;
insertResource.run(t1_2, 'reading', 'GeeksforGeeks — Linked List', 'https://www.geeksforgeeks.org/data-structures/linked-list/');
addQuiz(t1_2, 'Linked Lists — Quick Check', [
  { text: 'What is the time complexity of inserting at the head of a singly linked list?',
    options: ['O(1)','O(log n)','O(n)','O(n log n)'], correct: 0,
    explanation: 'Only the head pointer and the new node\'s next pointer change.' },
  { text: 'Random access to the k-th element in a singly linked list is:',
    options: ['O(1)','O(log n)','O(k)','O(n^2)'], correct: 2,
    explanation: 'You must walk from the head, taking k steps.' },
  { text: 'A doubly linked list stores, per node, an extra pointer to:',
    options: ['The head','The tail','The previous node','A random node'], correct: 2 },
  { text: 'Which operation is FASTER on a linked list than on an array?',
    options: ['Random access','Sorting','Insertion at the head','Binary search'], correct: 2,
    explanation: 'Insertion at the head is O(1); on an array it would require shifting.' },
]);

const t1_3 = insertTopic.run(c1, 'Stacks & Queues',
  `A **stack** is LIFO — the last element pushed is the first popped. Used in expression evaluation, undo, and recursion call frames.\n\n`
  + `A **queue** is FIFO — the first element enqueued is the first dequeued. Used in BFS, scheduling, and message pipelines.\n\n`
  + `Both can be implemented on top of arrays or linked lists.`, 3
).lastInsertRowid;
addQuiz(t1_3, 'Stacks & Queues — Quick Check', [
  { text: 'A stack follows which ordering discipline?',
    options: ['FIFO','LIFO','Random','Priority'], correct: 1 },
  { text: 'BFS on a graph is typically implemented using:',
    options: ['A stack','A queue','A heap','A linked list only'], correct: 1,
    explanation: 'BFS explores neighbours in the order they were discovered, which needs FIFO.' },
  { text: 'DFS on a graph is typically implemented using:',
    options: ['A stack (or recursion)','A queue','A hash map','A heap'], correct: 0 },
  { text: 'Which real-world use is a natural fit for a STACK?',
    options: ['Print job scheduler','Undo history in an editor','Round-robin CPU scheduling','Traffic queue at a toll booth'], correct: 1 },
]);

/* ============================================================
 * COURSE 2 — Database Management Systems
 * ============================================================ */
const c2 = insertCourse.run(
  'Database Management Systems',
  'Relational model, SQL, normalization, and transactions. '
  + 'Bridges theory (schema design) with practice (writing SELECTs that actually work).',
  instructorId
).lastInsertRowid;

const t2_1 = insertTopic.run(c2, 'The Relational Model',
  `A **relation** is a table with rows (tuples) and columns (attributes).\n\n`
  + `Each row represents one entity; each column has an atomic domain.\n\n`
  + `A **primary key** uniquely identifies a row. A **foreign key** references a primary key in another table.`, 1
).lastInsertRowid;
insertResource.run(t2_1, 'reading','Codd\'s 12 rules','https://en.wikipedia.org/wiki/Codd%27s_12_rules');
addQuiz(t2_1, 'The Relational Model — Quick Check', [
  { text: 'A primary key must be:',
    options: ['Nullable and unique','Non-null and unique','Non-null but repeatable','Any indexed column'], correct: 1 },
  { text: 'A foreign key enforces:',
    options: ['Uniqueness in another table','Referential integrity','A sort order','Domain constraints'], correct: 1 },
  { text: 'In the relational model, each column of a relation has:',
    options: ['A composite type','An atomic domain','A pointer','A default of NULL'], correct: 1 },
  { text: 'The number of rows in a relation is called its:',
    options: ['Degree','Cardinality','Arity','Domain'], correct: 1 },
]);

const t2_2 = insertTopic.run(c2, 'SQL — SELECT, JOIN, GROUP BY',
  `The **SELECT** statement retrieves rows. **JOIN** combines rows from multiple tables based on a related column. **GROUP BY** aggregates rows into groups; aggregates like COUNT, SUM, AVG summarize each group.\n\n`
  + `Example:\n\n\`SELECT c.name, COUNT(*) AS orders FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.name;\`\n`, 2
).lastInsertRowid;
addQuiz(t2_2, 'SQL Basics — Quick Check', [
  { text: 'Which SQL clause filters rows AFTER aggregation?',
    options: ['WHERE','HAVING','ORDER BY','GROUP BY'], correct: 1,
    explanation: 'WHERE filters before grouping; HAVING filters after.' },
  { text: 'A LEFT JOIN returns:',
    options: ['Only matching rows','All rows from the left table plus matches from the right','All rows from the right table','The Cartesian product'], correct: 1 },
  { text: 'To count the number of distinct values in column c you write:',
    options: ['COUNT(c)','COUNT(DISTINCT c)','DISTINCT COUNT(c)','UNIQUE(c)'], correct: 1 },
  { text: 'Which is NOT an aggregate function?',
    options: ['SUM','AVG','LENGTH','MAX'], correct: 2,
    explanation: 'LENGTH is a scalar string function, not an aggregate.' },
]);

const t2_3 = insertTopic.run(c2, 'Normalization',
  `**Normalization** is the process of organizing columns and tables to minimize redundancy.\n\n`
  + `- **1NF** — atomic values, no repeating groups\n`
  + `- **2NF** — 1NF + no partial dependency on a composite key\n`
  + `- **3NF** — 2NF + no transitive dependency (non-key -> non-key)\n`
  + `- **BCNF** — every determinant is a candidate key\n`, 3
).lastInsertRowid;
addQuiz(t2_3, 'Normalization — Quick Check', [
  { text: '1NF requires that:',
    options: ['All attributes are atomic','No partial dependencies exist','No transitive dependencies exist','Every determinant is a candidate key'], correct: 0 },
  { text: '3NF removes:',
    options: ['Partial dependencies','Transitive dependencies','Multi-valued dependencies','Join dependencies'], correct: 1 },
  { text: 'BCNF is stricter than 3NF because it requires:',
    options: ['Every attribute to be atomic','Every determinant to be a candidate key','No foreign keys','No composite keys'], correct: 1 },
]);

/* ============================================================
 * COURSE 3 — Operating Systems
 * ============================================================ */
const c3 = insertCourse.run(
  'Operating Systems',
  'Processes, threads, scheduling, memory management, and file systems. '
  + 'Understand what happens between your program and the metal.',
  instructorId
).lastInsertRowid;

const t3_1 = insertTopic.run(c3, 'Processes vs Threads',
  `A **process** is an instance of a running program with its own address space. A **thread** is a lightweight execution path within a process, sharing memory with its siblings.\n\n`
  + `Threads are cheaper to create and switch, but they must coordinate access to shared data — the classic source of race conditions.`, 1
).lastInsertRowid;
addQuiz(t3_1, 'Processes vs Threads — Quick Check', [
  { text: 'Which resource is NOT shared between threads of the same process?',
    options: ['Heap','Code segment','Registers & stack','Open file descriptors'], correct: 2,
    explanation: 'Each thread has its own registers and stack; heap, code and file descriptors are shared.' },
  { text: 'A context switch between threads is generally:',
    options: ['Cheaper than between processes','More expensive than between processes','The same cost','Impossible without kernel support'], correct: 0 },
  { text: 'A race condition can occur when:',
    options: ['Two threads read the same value','Two threads write to shared state without synchronization','A single thread loops forever','A process forks another process'], correct: 1 },
]);

const t3_2 = insertTopic.run(c3, 'CPU Scheduling',
  `The **scheduler** decides which ready process gets the CPU next.\n\n`
  + `- **FCFS** — First-Come First-Served. Simple; suffers from convoy effect.\n`
  + `- **SJF** — Shortest Job First. Minimizes average waiting time; can starve long jobs.\n`
  + `- **Round Robin** — each process gets a time quantum in turn. Fair; quantum size matters.\n`
  + `- **Priority Scheduling** — higher priority runs first; needs aging to avoid starvation.`, 2
).lastInsertRowid;
addQuiz(t3_2, 'CPU Scheduling — Quick Check', [
  { text: 'Which scheduling algorithm gives the minimum average waiting time?',
    options: ['FCFS','SJF','Round Robin','Priority (no aging)'], correct: 1,
    explanation: 'SJF is provably optimal for minimizing average waiting time.' },
  { text: 'The "convoy effect" is a problem in:',
    options: ['FCFS','SJF','Round Robin','Multilevel queues'], correct: 0,
    explanation: 'A single long process blocks all shorter ones behind it.' },
  { text: 'Round Robin scheduling is characterised by:',
    options: ['Fixed priorities','A time quantum','Preemption based on job length','No preemption'], correct: 1 },
  { text: 'Aging is used in priority scheduling to prevent:',
    options: ['Deadlock','Starvation','Race conditions','Fragmentation'], correct: 1 },
]);

/* ============================================================
 * Progress + activity — pre-seed a bit for Dharnis
 * ============================================================ */
const dharnisId = userIds[0];
const markComplete = db.prepare(
  `INSERT OR IGNORE INTO topic_progress (user_id, topic_id, completed_at) VALUES (?, ?, datetime('now', ?))`
);
markComplete.run(dharnisId, t1_1, '-6 days');
markComplete.run(dharnisId, t1_2, '-4 days');
markComplete.run(dharnisId, t2_1, '-2 days');

const logActivity = db.prepare(
  `INSERT INTO activity_log (user_id, kind, detail, created_at) VALUES (?, ?, ?, datetime('now', ?))`
);
logActivity.run(dharnisId, 'topic_completed', 'Arrays & Complexity',            '-6 days');
logActivity.run(dharnisId, 'quiz_submitted',  'Arrays & Complexity — 80%',      '-6 days');
logActivity.run(dharnisId, 'topic_completed', 'Linked Lists',                   '-4 days');
logActivity.run(dharnisId, 'quiz_submitted',  'Linked Lists — 100%',            '-4 days');
logActivity.run(dharnisId, 'topic_completed', 'The Relational Model',           '-2 days');
logActivity.run(dharnisId, 'quiz_submitted',  'The Relational Model — 75%',     '-2 days');

/* Pre-seed some attempts so progress charts have data on day 1 */
const insertAttempt = db.prepare(
  `INSERT INTO attempts (user_id, quiz_id, started_at, submitted_at, score, total)
   VALUES (?, ?, datetime('now', ?), datetime('now', ?), ?, ?)`
);
const quizFor = (topicId) => db.prepare(`SELECT id FROM quizzes WHERE topic_id = ?`).get(topicId).id;
insertAttempt.run(dharnisId, quizFor(t1_1), '-6 days', '-6 days', 4, 5);
insertAttempt.run(dharnisId, quizFor(t1_2), '-4 days', '-4 days', 4, 4);
insertAttempt.run(dharnisId, quizFor(t2_1), '-2 days', '-2 days', 3, 4);

const stats = {
  users:     db.prepare('SELECT COUNT(*) c FROM users').get().c,
  courses:   db.prepare('SELECT COUNT(*) c FROM courses').get().c,
  topics:    db.prepare('SELECT COUNT(*) c FROM topics').get().c,
  quizzes:   db.prepare('SELECT COUNT(*) c FROM quizzes').get().c,
  questions: db.prepare('SELECT COUNT(*) c FROM questions').get().c,
};
console.log('Seed complete:', stats);
console.log('\nDemo logins:');
console.log('  Student    dharnis@learnup.dev / student123');
console.log('  Instructor jeny@learnup.dev    / instructor123');
console.log('  Admin      admin@learnup.dev   / admin123');
