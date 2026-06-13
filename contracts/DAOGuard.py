# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *


class DAOGuard(gl.Contract):
    governor: str
    charter: str
    proposals: TreeMap[str, str]
    proposal_count: u256
    approved_count: u256
    blocked_count: u256

    def __init__(self, charter: str):
        self.governor = str(gl.message.sender_address)
        self.charter = str(charter).strip()
        self.proposal_count = u256(0)
        self.approved_count = u256(0)
        self.blocked_count = u256(0)

    @gl.public.write
    def amend_charter(self, new_charter: str) -> None:
        if str(gl.message.sender_address) != self.governor:
            raise Exception("only governor")
        self.charter = str(new_charter).strip()

    @gl.public.write
    def check_proposal(self, title: str, body: str, author: str) -> str:
        """Submit a DAO proposal for constitutional compliance check."""
        title = str(title).strip()
        body = str(body).strip()
        if not title or not body:
            raise Exception("title and body required")

        verdict = self._evaluate(title, body)

        key = str(int(self.proposal_count))
        record = {
            "author": str(author).strip() if author else str(gl.message.sender_address),
            "title": title[:200],
            "body_preview": body[:300],
            "compliant": verdict["compliant"],
            "violations": verdict["violations"],
            "recommendation": verdict["recommendation"],
            "confidence": verdict["confidence"],
        }
        self.proposals[key] = json.dumps(record)
        self.proposal_count += u256(1)
        if verdict["compliant"]:
            self.approved_count += u256(1)
        else:
            self.blocked_count += u256(1)
        return key

    def _evaluate(self, title: str, body: str) -> dict:
        charter = self.charter

        def leader_fn() -> str:
            prompt = f"""You are a constitutional compliance checker for a DAO.

DAO CHARTER / CONSTITUTION:
{charter[:3000]}

PROPOSAL TO EVALUATE:
Title: {title}
Body: {body[:2000]}

RULES:
1. Check if this proposal violates ANY clause of the charter.
2. Be specific: cite which clause is violated (if any).
3. A proposal that doesn't conflict with the charter = compliant.
4. If the charter is silent on the topic, the proposal is compliant by default.
5. Rate your confidence: high/medium/low.

Reply ONLY valid JSON:
{{"compliant": true/false, "violations": "<list violated clauses or 'none'>", "recommendation": "<approve/reject/needs amendment>", "confidence": "high"/"medium"/"low"}}
No markdown."""

            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            if isinstance(raw, dict):
                return json.dumps(raw)
            return str(raw).strip()

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                data = json.loads(leader_result.calldata)
                if not isinstance(data.get("compliant"), bool):
                    return False
                if data.get("confidence") not in ("high", "medium", "low"):
                    return False
                if not isinstance(data.get("violations"), str):
                    return False
                return True
            except Exception:
                return False

        result_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        return json.loads(result_str)

    @gl.public.view
    def get_proposal(self, key: str) -> dict:
        key = str(key)
        if key not in self.proposals:
            return {"exists": False}
        return json.loads(self.proposals[key])

    @gl.public.view
    def get_charter(self) -> str:
        return self.charter

    @gl.public.view
    def read_compliance(self, key: str) -> dict:
        """Governance contract reads this before executing a proposal."""
        key = str(key)
        if key not in self.proposals:
            return {"checked": False}
        p = json.loads(self.proposals[key])
        return {
            "checked": True,
            "compliant": p["compliant"],
            "confidence": p["confidence"],
            "recommendation": p["recommendation"],
        }

    @gl.public.view
    def stats(self) -> dict:
        return {
            "proposals_checked": int(self.proposal_count),
            "approved": int(self.approved_count),
            "blocked": int(self.blocked_count),
        }
