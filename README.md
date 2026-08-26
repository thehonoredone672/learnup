# LearnUp — Prototype

A multi-tenant, retrieval-grounded Q&A portal for educational institutions.
Each institution uploads its own study material (syllabi, PYQs, notes, question banks)
and gets a private assistant that students can chat with. **Every answer stays scoped
to that institution's own documents — no cross-tenant leakage.**

Built as a static prototype (HTML/CSS/vanilla JS, no build step) to demonstrate the
core UX and the org-isolation guarantee that RAG on top of a shared LLM would enforce
in a production system.

## Run it

Open `index.html` in any modern browser. That's it — no server, no dependencies.

```
D:\learnup\
├── index.html          Landing / portal chooser
├── student.html        Student chat with the institution's assistant
├── organization.html   Admin dashboard: overview, resources, student activity
├── styles.css          Shared styles
└── data.js             Demo orgs, documents, and a fake RAG matcher
```

## Screens

**1. Portal chooser (`index.html`)**
The tenant's landing page. Two entry points: Student or Faculty/Admin.

**2. Student portal (`student.html`)**
- Pick an institution (demo has two: VSB Coimbatore, VSB Karur).
- Chat with the assistant. Suggested questions are one click away.
- Every answer shows a **source chip** — the document and page/section it came from.
- Ask a question that belongs to a *different* institution's KB and the assistant
  refuses with a clear "outside your institution's materials" message.

**3. Admin portal (`organization.html`)**
- **Overview** — KB stats, a 7-day query trends chart, and recent activity.
- **Resources** — drag/drop upload with a simulated indexing pipeline
  (*Uploading → Chunking → Embedding → Indexed*), plus search and delete.
- **Student activity** — a live log of recent questions with per-query status:
  `Answered from KB` or `Blocked · cross-institution`. This visualises the
  isolation policy in action.

## What the prototype simulates

| Real system                              | Prototype substitute                                     |
| ---------------------------------------- | -------------------------------------------------------- |
| Document parser + chunker + embeddings   | `stages = ['Uploading','Chunking','Embedding','Indexed']` with progress badge |
| Vector store scoped per org (namespace)  | Each org owns its own `kb` array in `data.js`            |
| Retrieval + LLM answer                   | Keyword match against `kb[].kw`, return `kb[].a` + `kb[].src` |
| Cross-tenant guard                       | `otherOrgKeywords` triggers a deny response              |

The point isn't to build the pipeline — it's to show the **contract**:
a student in VSB Coimbatore never sees content from VSB Karur, even for
topics the underlying LLM would happily answer from general knowledge.

## Tech

- HTML5, CSS custom properties, vanilla ES6 — no framework.
- Inline SVG for icons and the trends chart (no chart library).
- All state is in-memory and resets on refresh.

## Not built (intentionally — this is a prototype)

- Real authentication, real backend, real vector store.
- Actual PDF/DOCX parsing (uploads just take the filename).
- The `Settings` tab is a placeholder.
