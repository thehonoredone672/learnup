# LearnUp — Presentation Demo Script

**Duration:** ~4 minutes. Keep it moving.

---

## 0. Setup (before you start speaking)

- Open `index.html` in the browser, full screen.
- Have a second browser tab already open on `student.html` (institution NOT yet picked).
- Silence notifications.

---

## 1. The problem (30 sec) — *say this before opening anything*

> "College students constantly ask their WhatsApp groups the same questions —
> *'what's in this year's syllabus?', 'which questions repeated in last year's PYQ?',
> 'what does this course outcome mean?'*
> The material to answer this exists — it's sitting in PDFs and PPTs the faculty
> already uploaded. What we built is a portal that lets students **chat with their
> own college's materials**, and lets faculty manage what the assistant is allowed
> to answer from."

---

## 2. The tenant landing (15 sec)

**Screen: `index.html`**

> "Every institution gets their own branded portal. VSB College here.
> Two doors: students go left, faculty go right."

Click **Faculty / Admin**.

---

## 3. Admin — Overview (40 sec)

**Screen: `organization.html`, Overview tab**

> "This is what a program coordinator sees. Five documents indexed,
> 220 chunks embedded. Student query volume for the last week —
> Friday spike is when the OS quiz dropped."

Point at the **`Enforced` — Org-level isolation** stat card.

> "This is the important one. Every retrieval query is namespaced to VSB's
> own vector store. I'll show you what happens when that's violated in a minute."

---

## 4. Admin — Resources (40 sec)

Click **Resources** in the sidebar.

> "Faculty drops files here — syllabi, question banks, PYQs, slides."

Actually drag one file in (or click **Choose files**). Point at the row:

> "Watch the status column — *Uploading → Chunking → Embedding → Indexed*.
> Once it's indexed, students can query it. Search bar filters by name,
> trash icon removes a doc from the knowledge base."

Type "os" in the search box to show the filter working.

---

## 5. Admin — Student activity (30 sec)

Click **Student activity**.

> "This is where the isolation guarantee becomes tangible.
> Green rows — answered from our KB. Red rows — a student asked something
> outside our syllabus, and the assistant refused. Four blocked queries this week.
> Faculty can see exactly what students are trying to ask."

---

## 6. Student — the happy path (45 sec)

Switch to the pre-opened `student.html` tab.

> "This is what a student sees. They pick their institution first — LearnUp
> keeps every college's materials in a separate private KB."

Click **VSB Coimbatore**.

> "The assistant greets them, offers a few suggested questions."

Click the chip **"What topics are in the Data Structures syllabus?"**

> "Notice the source chip under the answer — *B.Tech CSE Data Structures Syllabus.pdf,
> Unit I–V*. Every answer is grounded and cited. This isn't a hallucinating chatbot —
> it can only answer from documents the faculty actually uploaded."

---

## 7. Student — the isolation guarantee (45 sec) *← the money shot*

Type this into the input:

```
Summarize current affairs for January 2026
```

> "Now, current affairs is a real topic — the underlying model absolutely knows about it,
> and it exists in *another* institution's knowledge base — VSB Karur, which is a UPSC
> prep centre using the same platform. Watch what happens."

Send. The red bubble appears:

> "It refuses. Even though the LLM could answer this, and even though that document
> lives on the same platform — retrieval is namespaced. VSB Coimbatore's assistant
> physically cannot see VSB Karur's index. That's the guarantee we're selling to
> institutions: your materials are yours."

Click **Switch institution → VSB Karur**, and ask the same question.

> "Same platform, same question, different tenant — now it answers, with its own citation."

---

## 8. Wrap (20 sec)

> "So — students get grounded answers with citations, faculty get visibility into
> what's being asked, and every institution's data stays in its own silo.
> The prototype uses keyword-match to fake the RAG pipeline; production would
> swap in embeddings + a real vector DB, and the exact same UI works."

---

## Q&A prep — likely questions and short answers

- **"Why not just use ChatGPT?"** — Two reasons. ChatGPT can't cite the specific PDF
  a faculty member uploaded last week, and it can't be locked to one institution's
  materials. LearnUp is both grounded and tenant-scoped.

- **"How does the isolation actually work?"** — In production, each org gets its own
  vector store namespace. Every retrieval carries the `org_id` as a filter, so the
  ANN search literally cannot return chunks from another tenant. The LLM only
  ever sees chunks from the caller's org.

- **"What's your tech stack?"** — Prototype is vanilla HTML/CSS/JS to keep the demo
  friction-free. Production plan: React + FastAPI, Postgres for metadata,
  a vector DB (pgvector or Qdrant) per-namespace, and an LLM behind a
  system prompt that enforces "answer only from the provided context."

- **"How do you handle new documents?"** — Async pipeline: on upload, parse → chunk
  (500-token overlapping windows) → embed → write to the org's namespace.
  The status badge in the Resources table mirrors that pipeline.

- **"What if the KB doesn't have the answer?"** — The assistant says so and lists
  what topics *are* in the index — it never guesses. You saw that guardrail in
  the code path if you ask something like "explain quantum computing".
