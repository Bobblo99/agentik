# The memory model — why Agentik works the way it does

Agentik's memory is not a folder of notes someone thought looked tidy. It is a
deliberate, human-readable implementation of two well-studied results about how
language-model agents fail, and of an established taxonomy for how memory should
be organized. This document states the rationale so the design can be argued
with, not just trusted.

## The two failure modes it targets

**1. Long context degrades — so working memory must stay small.**
Language models do not use long inputs uniformly: accuracy is highest when the
relevant information sits at the very start or end of the context and drops
sharply when it is buried in the middle — a U-shaped curve that holds even for
models marketed as long-context (Liu et al., *Lost in the Middle*,
[arXiv:2307.03172](https://arxiv.org/abs/2307.03172)). Stuffing every rule,
decision, and convention into one always-loaded file therefore *reduces*
reliability. Agentik's response is hard budgets and load-on-demand:
`AGENTS.md` ≤ ~150 lines, `memory/CONTEXT.md` ≤ 80, and the rules/skills are
pulled in only for the task at hand. Small, ordered working memory beats a large
undifferentiated one.

**2. Agents are stateless across sessions — so memory must be externalized.**
A chat agent forgets everything between runs. MemGPT frames the fix as an
operating-system memory hierarchy: a fixed **main context** (like RAM — what is
in the prompt now) backed by a large **external context** (like disk), with
information paged in and out by explicit actions (Packer et al., *MemGPT*,
[arXiv:2310.08560](https://arxiv.org/abs/2310.08560)). Agentik *is* that
hierarchy, made of files: `memory/CONTEXT.md` is main context; the rest of
`memory/`, `rules/`, and `specs/` are external context the agent "pages in" with
the protocol's *read the relevant file* step. The novelty is only that the
backing store is plain Markdown in git — auditable, diffable, tool-agnostic —
instead of a hidden vector database.

## The taxonomy — each store is a kind of memory

Cognitive science separates short-term **working memory** from several
long-term memories: **episodic** (specific experiences), **semantic** (general
knowledge), and **procedural** (how to do things) — Tulving's distinction, which
CoALA carries directly into language-agent design (Sumers, Yao, Narasimhan &
Griffiths, *Cognitive Architectures for Language Agents*,
[arXiv:2309.02427](https://arxiv.org/abs/2309.02427)). Agentik's stores map onto
it almost one-to-one:

| Agentik store | Memory type (CoALA / Tulving) | Holds | Written when |
|---|---|---|---|
| `memory/CONTEXT.md` | **Working** (MemGPT main context) | the now-state: what's true today, in progress, next steps | end of task/session; budgeted, never a log |
| `memory/decisions/` (ADRs) | **Episodic** | specific decisions and why they were made | when an architecture/tooling decision is taken |
| `memory/conventions.md` | **Procedural** | how *this* project does things | when a pattern is agreed |
| `memory/glossary.md`, `memory/domain.md` | **Semantic** | domain terms, model, invariants | when a term/business rule is clarified |
| `specs/` (+ `archive/`) | **Episodic** (task log) | what was planned, executed, deviated | per task |
| `rules/` (+ `rules/custom/`) | **Procedural** (constraints/know-how) | binding standards | rarely; via `customize` |

Splitting memory by *type* — rather than one `notes.md` — is what lets the agent
load only the kind it needs (semantic facts for a domain question, procedural
rules for a code change) and keep working memory lean, which is exactly what
failure mode #1 demands.

## Retrieval and consolidation — the cadence

Generative Agents showed that a useful memory needs three operations, not just
storage: timely **retrieval**, and periodic **reflection** that synthesizes raw
records into higher-level insight (Park et al., *Generative Agents*,
[arXiv:2304.03442](https://arxiv.org/abs/2304.03442); their retrieval scores
memories by recency × relevance × importance). Agentik's protocol is the
human-readable analogue:

- **Encode at defined moments, not "later"** — the memory protocol in
  `AGENTS.md` fires writes on concrete events (decision → ADR, term → glossary,
  task end → CONTEXT), so experience is captured while it is fresh.
- **Retrieve at task start** — open `CONTEXT.md` and `domain.md`, scan the
  conventions/decisions/custom-rules relevant to the task. Relevance is the
  agent's judgement plus the type-based split above.
- **Consolidate (reflect) under budget** — when `CONTEXT.md` approaches its
  80-line limit, the protocol *requires* eviction: remove completed items,
  promote durable decisions into ADRs, promote recurring patterns into
  conventions. This is MemGPT-style eviction and Generative-Agents-style
  reflection at once: the snapshot stays small and the durable insight is moved
  to the right long-term store instead of being lost.

## What this is — and isn't (honest trade-offs)

- **Chosen:** plain Markdown in git. Benefits: auditable, diffable, reviewable in
  a PR, readable by any AGENTS.md tool, and zero infrastructure. The store is
  *legible to humans*, which matters because humans co-own the memory.
- **Not chosen (yet):** vector embeddings / semantic retrieval. For the memory
  sizes a single repository accumulates, type-based files + a budget retrieve
  well enough, and determinism beats approximate similarity search. Embeddings
  earn their complexity only when memory grows past what a person can skim;
  that is a future option, not a default.
- **Boundary, not a brain:** the verification rule (`rules/00-verification.md`)
  exists because externalized memory is only useful if it is *true* — an agent
  that invents a file or API pollutes every downstream memory. Grounding is the
  precondition for memory, not a separate nicety.

## References

- Nelson F. Liu et al. *Lost in the Middle: How Language Models Use Long
  Contexts.* TACL 2024. [arXiv:2307.03172](https://arxiv.org/abs/2307.03172)
- Charles Packer et al. *MemGPT: Towards LLMs as Operating Systems.* 2023.
  [arXiv:2310.08560](https://arxiv.org/abs/2310.08560)
- Theodore Sumers, Shunyu Yao, Karthik Narasimhan, Thomas L. Griffiths.
  *Cognitive Architectures for Language Agents.* TMLR 2024.
  [arXiv:2309.02427](https://arxiv.org/abs/2309.02427)
- Joon Sung Park et al. *Generative Agents: Interactive Simulacra of Human
  Behavior.* UIST 2023. [arXiv:2304.03442](https://arxiv.org/abs/2304.03442)
- Endel Tulving. *Episodic and Semantic Memory.* 1972 (the episodic/semantic
  distinction CoALA builds on).
