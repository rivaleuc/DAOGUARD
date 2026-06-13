# DAOGuard

Constitutional compliance checker for DAOs. Every proposal is checked against the DAO's charter by AI validators before it can be executed. Non-compliant proposals get blocked on-chain.

## Deployed

**GenLayer (Bradbury):** `0x04C2242963bCE3686BF050E27AE7Fded463302a1`

Charter: "Art1: Treasury max 50% to one project. Art2: Grants need public deliverable in 90 days. Art3: No member over 10% voting power. Art4: Upgrades need 75% supermajority. Art5: No investing in competitor tokens."

## Test

"Allocate 20% of treasury to developer grants" → ✅ **Compliant** (under 50%, has deliverables)

## Structure

```
DAOGuard/
├── contracts/
│   ├── DAOGuard.py          ← GenLayer contract (charter + compliance AI)
│   └── GovernorGate.sol     ← Blocks non-compliant proposals on-chain
├── ui/
│   └── index.html           ← Alpine.js + Tailwind (no build step)
├── Makefile                  ← deploy/test/dev commands
└── .gitignore
```

No package.json. No node_modules. Just `make deploy`, `make dev`.

## Usage

```bash
# Deploy with your charter
make deploy CHARTER="your DAO charter here..."

# Check a proposal
genlayer write <addr> check_proposal --args "Title" "Body" "author"

# Read result
genlayer call <addr> get_proposal --args 0
```
