# DAOGuard

**A constitutional compliance checker for DAO proposals, judged on-chain by GenLayer validators.**

DAOGuard reads a DAO's charter and decides whether a proposal violates it — not with brittle keyword rules, but with an LLM that interprets the charter the way a human steward would. The charter is living text, the verdicts are produced by validator consensus, and an EVM gate can refuse to execute anything DAOGuard blocks.

- **Contract (Bradbury, chain 4221):** `0x04C2242963bCE3686BF050E27AE7Fded463302a1`
- **Explorer:** https://explorer-bradbury.genlayer.com/contract/0x04C2242963bCE3686BF050E27AE7Fded463302a1
- **Live app:** https://daoguard.pages.dev

## What it does

A DAO deploys DAOGuard with its `charter` — the constitution proposals are measured against. The governor can later rewrite it with `amend_charter` (governor-only). Anyone submits a proposal with `check_proposal(title, body, author)`, which runs an evaluation round and stores the verdict under an integer key (returned as a string), incrementing `proposal_count` and either `approved_count` or `blocked_count`.

Each round runs inside `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`. The leader builds a prompt that pins the charter as authoritative, embeds the proposal, and calls `gl.nondet.exec_prompt(..., response_format="json")` asking for a strict verdict: `{compliant, violations, recommendation, confidence}`. The `validator_fn` does not require byte-identical answers — it re-parses the leader's calldata and accepts it only if `compliant` is a bool, `confidence` is one of high/medium/low, and `violations` is a string. Honest validators that phrase reasoning differently still converge on the same structural verdict, which is how Optimistic Democracy reaches agreement.

Verdicts are persisted as JSON strings in a `TreeMap[str, str]` (`proposals`). The frontend reads them with `get_proposal(key)`, fetches the constitution via `get_charter()`, and shows aggregate `stats()`. A governance executor calls the purpose-built view `read_compliance(key)` — returning `{checked, compliant, confidence, recommendation}` — before letting a proposal run, and the companion `GovernorGate.sol` resolver clears or blocks execution based on it.

## Why GenLayer

"Does this proposal violate the charter?" has no deterministic answer. The charter is unstructured prose, proposals are free text, and the judgment is inherently subjective — a regex or a fixed rule engine cannot decide whether "fund a marketing experiment" conflicts with a clause about treasury prudence. A deterministic VM would force the DAO to pre-encode every rule as code, which defeats the point of a human-readable constitution. GenLayer lets honest validators each interpret the charter, disagree on wording, and still agree on the semantically-equivalent outcome through `validator_fn`. Use GenLayer when the decision requires reading and interpreting natural language under a policy; use a plain backend when the rule is a simple, objective predicate you could write in one `if` statement.

## Architecture

| Layer | Responsibility |
|---|---|
| Intelligent contract (`contracts/DAOGuard.py`) | Stores the charter, runs LLM compliance rounds via `run_nondet_unsafe`, persists verdicts in a `TreeMap`, exposes `read_compliance` for executors |
| Frontend (`ui/`) | Reads live charter/verdicts/stats with no wallet; submits `check_proposal` / `amend_charter` writes via MetaMask |
| EVM / off-chain (`contracts/GovernorGate.sol`) | Execution gate: a resolver reads `read_compliance(key)` and calls `clearProposal` / `blockProposal`; `canExecute` gates the actual on-chain action |

## Tech

- **Contract:** GenVM Python runner, pinned (`py-genlayer:1jb45aa8…jpz09h6`). Counters as `u256`, proposals stored as a `TreeMap[str, str]` of JSON records. Consensus via `gl.vm.run_nondet_unsafe` + a structural `validator_fn`; evidence/judgment via `gl.nondet.exec_prompt`.
- **Frontend:** Vite + React 19 + TypeScript, genlayer-js for reads (CORS-open RPC) and writes (MetaMask wallet on chain 4221, no snap — the client is created with the address as a string so writes route to `eth_sendTransaction`). UI uses Tailwind CSS v4, framer-motion animations, lucide-react icons, sonner toasts, and react-router-dom.

## Project structure

```
DAOGuard/
├── contracts/
│   ├── DAOGuard.py          # intelligent contract (gl.Contract)
│   └── GovernorGate.sol     # EVM execution gate / resolver
├── ui/
│   ├── src/
│   │   ├── App.tsx          # main UI
│   │   ├── genlayer.ts      # client, connectWallet, read/write helpers
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── assets/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── Makefile
└── README.md
```

## Develop

```
cd ui
npm install
npm run dev
npm run build
```

The frontend reads contract state with no wallet. Writes require MetaMask on GenLayer Bradbury (chain 4221) with some GEN — the app auto-switches the network.

## Deploy the frontend (Cloudflare Pages)

- **Root directory:** ui
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment:** `NODE_VERSION=20`

## Why GenLayer (engineering notes)

- **No floats in storage/calldata.** `confidence` is a categorical string and counters are `u256`; there are no fractional scores to serialize, which keeps state deterministic.
- **Validate structure, not exact text.** LLM output is non-deterministic, so `validator_fn` parses the leader's JSON and checks types/enums (`compliant` bool, `confidence` enum, `violations` string) rather than demanding identical wording.
- **ACCEPTED ≠ executed.** A transaction reaching consensus stores the verdict; it does not run the proposal. `GovernorGate` must separately clear it before any execution happens.
- **Optimistic finality paces writes.** The frontend waits for `FINALIZED` receipts; verdicts settle on the appeal-window cadence, so rapid resubmission won't beat finality.
- **Evidence is untrusted.** The charter and proposal body are user-supplied; the prompt pins the charter as authoritative and treats the proposal as data to be judged, not as instructions (greybox against prompt injection).

## License

MIT
