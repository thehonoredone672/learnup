/* ===================================================================
   LearnUp — shared demo data
   Two organizations are included so the student portal can demonstrate
   that retrieval never crosses institutional boundaries.
   =================================================================== */

const ORGS = {
  vsb: {
    id: "vsb",
    name: "VSB Coimbatore",
    short: "VSB",
    type: "Engineering College, Autonomous",
    docs: [
      { name: "B.Tech CSE Data Structures Syllabus.pdf", ext: "pdf", size: "1.2 MB", chunks: 86, uploaded: "28 Jul 2026" },
      { name: "Operating Systems End-Sem PYQ 2023.pdf", ext: "pdf", size: "890 KB", chunks: 54, uploaded: "24 Jul 2026" },
      { name: "DBMS Question Bank - Unit 1-5.docx", ext: "docx", size: "640 KB", chunks: 40, uploaded: "21 Jul 2026" },
      { name: "Machine Learning Course Outcomes.pdf", ext: "pdf", size: "210 KB", chunks: 12, uploaded: "18 Jul 2026" },
      { name: "Unit 3 - Process Scheduling.pptx", ext: "pptx", size: "3.4 MB", chunks: 28, uploaded: "12 Jul 2026" },
    ],
    suggested: [
      "What topics are in the Data Structures syllabus?",
      "Which questions repeated in the 2023 OS paper?",
      "Summarize the Machine Learning course outcomes",
      "What's covered in the DBMS question bank?",
      "What's trending in current affairs this week?",
    ],
    kb: [
      { kw: ["syllabus","data structures","ds syllabus","units"], a: "The Data Structures syllabus covers 5 units: Arrays & Linked Lists, Stacks & Queues, Trees (BST, AVL), Graphs (BFS/DFS, shortest path), and Sorting & Searching algorithms with complexity analysis.", src: [{ d: "B.Tech CSE Data Structures Syllabus.pdf", p: "Unit I–V" }] },
      { kw: ["operating system","os pyq","2023 os paper","process scheduling question","previous year os"], a: "In the 2023 OS end-semester paper, the most frequently asked topics were CPU scheduling algorithms (FCFS, SJF, Round Robin), deadlock detection/avoidance, and paging-based memory management.", src: [{ d: "Operating Systems End-Sem PYQ 2023.pdf", p: "Q4, Q7" }] },
      { kw: ["dbms","question bank","normalization","sql","er diagram"], a: "The DBMS question bank has 40 questions across Normalization (1NF–BCNF), ER-diagram modelling, SQL joins, and transaction management (ACID properties).", src: [{ d: "DBMS Question Bank - Unit 1-5.docx", p: "Section B" }] },
      { kw: ["course outcome","ml course","machine learning","co-po"], a: "Machine Learning course outcomes: CO1 — understand supervised & unsupervised learning; CO2 — implement regression/classification models; CO3 — evaluate models using precision, recall and F1-score.", src: [{ d: "Machine Learning Course Outcomes.pdf", p: "p.1" }] },
      { kw: ["scheduling algorithm","unit 3","gantt","slides"], a: "Unit 3 slides cover preemptive vs non-preemptive scheduling, Gantt charts for FCFS/SJF/Round Robin, and priority scheduling with aging to prevent starvation.", src: [{ d: "Unit 3 - Process Scheduling.pptx", p: "Slide 12–18" }] },
    ],
    otherOrgKeywords: ["polity","upsc","ias","current affairs","ethics case","mains answer","economics pyq","fundamental rights"],
  },
  nexus: {
    id: "nexus",
    name: "VSB Karur",
    short: "NEXUS",
    type: "Engineering College, Autonomous",
    docs: [
      { name: "Indian Polity - Complete Notes.pdf", ext: "pdf", size: "2.1 MB", chunks: 143, uploaded: "30 Jul 2026" },
      { name: "Economics PYQ Compilation 2019-24.pdf", ext: "pdf", size: "1.5 MB", chunks: 97, uploaded: "27 Jul 2026" },
      { name: "Current Affairs - January 2026.pdf", ext: "pdf", size: "780 KB", chunks: 61, uploaded: "22 Jul 2026" },
      { name: "Ethics Case Studies - GS Paper 4.pptx", ext: "pptx", size: "4.0 MB", chunks: 33, uploaded: "15 Jul 2026" },
      { name: "Mains Answer Writing Syllabus.pdf", ext: "pdf", size: "300 KB", chunks: 15, uploaded: "9 Jul 2026" },
    ],
    suggested: [
      "What's in the Indian Polity notes?",
      "Any recurring themes in Economics PYQs?",
      "Summarize current affairs for January 2026",
      "How should I structure Mains answers?",
      "What's covered in the DBMS question bank?",
    ],
    kb: [
      { kw: ["polity","fundamental rights","constitution","indian polity"], a: "The Indian Polity notes cover Fundamental Rights (Articles 12–35), Directive Principles of State Policy, the constitutional amendment procedure (Article 368), and Centre–State relations.", src: [{ d: "Indian Polity - Complete Notes.pdf", p: "Ch.4–6" }] },
      { kw: ["economics pyq","economic survey","previous year economics"], a: "The Economics PYQ compilation shows a recurring focus on fiscal policy, inflation indices (CPI/WPI), and Union Budget-related questions across the last five years.", src: [{ d: "Economics PYQ Compilation 2019-24.pdf", p: "2019–2024 set" }] },
      { kw: ["current affairs","january 2026","ca notes","trending"], a: "Current Affairs (Jan 2026) covers Union Budget 2026-27 highlights, new welfare scheme rollouts, and international summits attended by India that month.", src: [{ d: "Current Affairs - January 2026.pdf", p: "Weekly digest 2" }] },
      { kw: ["ethics case","ethics paper","case studies"], a: "The Ethics Case Studies deck includes dilemmas on public administration integrity, whistleblowing, and conflict of interest, each with a model-answer framework.", src: [{ d: "Ethics Case Studies - GS Paper 4.pptx", p: "Slide 5–9" }] },
      { kw: ["mains answer","answer writing","structure","syllabus mains"], a: "The Mains Answer Writing guide recommends a 3-part structure (Intro–Body–Conclusion), a word-limit strategy per marks allotted, and using diagrams for GS papers where relevant.", src: [{ d: "Mains Answer Writing Syllabus.pdf", p: "p.1" }] },
    ],
    otherOrgKeywords: ["data structures","operating system","dbms","normalization","scheduling algorithm","course outcome","ml course","linked list"],
  }
};

/**
 * Simulates a RAG lookup scoped strictly to one organization's namespace.
 */
function matchKB(orgId, query){
  const org = ORGS[orgId];
  const q = query.toLowerCase();

  const hitOther = (org.otherOrgKeywords || []).some(kw => q.includes(kw));
  if (hitOther){
    return {
      denied: true,
      text: `That falls outside ${org.name}'s uploaded materials. Retrieval on LearnUp is scoped strictly to your institution's own documents, so I can't pull in content from another organization's knowledge base — even if it's a topic I'd otherwise know about.`,
      sources: null
    };
  }

  let best = null, bestScore = 0;
  org.kb.forEach(entry => {
    const score = entry.kw.reduce((s, kw) => s + (q.includes(kw) ? 1 : 0), 0);
    if (score > bestScore){ bestScore = score; best = entry; }
  });
  if (best && bestScore > 0){
    return { denied: false, text: best.a, sources: best.src };
  }

  const topics = org.docs.map(d => d.name.replace(/\.(pdf|docx|pptx)$/i, "")).join(", ");
  return {
    denied: false,
    text: `I couldn't find anything about that in ${org.name}'s uploaded materials. Try asking about: ${topics}.`,
    sources: null
  };
}
