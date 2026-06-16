"""Deterministic-invariant tests for the DAOGuard contract.

ANCHOR: recommendation == ('approve' if compliant else 'reject').
"""


def test_derived_anchor_matches(contract):
    assert contract.derive_recommendation(True) == "approve"
    assert contract.derive_recommendation(False) == "reject"


def test_normalized_output_always_passes(contract):
    samples = [
        {"compliant": True, "confidence": "high", "violations": "none", "recommendation": "reject"},
        {"compliant": False, "confidence": "bogus", "violations": "", "recommendation": "approve"},
        {"compliant": True},
        {},
        "not a dict",
        None,
    ]
    for raw in samples:
        v = contract.normalize_verdict(raw)
        assert contract.validate_verdict(v), raw
        # derived anchor must hold on normalized output
        assert v["recommendation"] == contract.derive_recommendation(v["compliant"])


def test_anchor_mismatch_rejected(contract):
    # compliant True but recommendation 'reject' violates the anchor
    assert not contract.validate_verdict(
        {"compliant": True, "confidence": "high", "violations": "none", "recommendation": "reject"}
    )
    assert not contract.validate_verdict(
        {"compliant": False, "confidence": "low", "violations": "x", "recommendation": "approve"}
    )


def test_bad_enum_rejected(contract):
    assert not contract.validate_verdict(
        {"compliant": True, "confidence": "sky-high", "violations": "none", "recommendation": "approve"}
    )


def test_empty_violations_rejected(contract):
    assert not contract.validate_verdict(
        {"compliant": True, "confidence": "high", "violations": "   ", "recommendation": "approve"}
    )


def test_non_bool_compliant_rejected(contract):
    assert not contract.validate_verdict(
        {"compliant": 1, "confidence": "high", "violations": "x", "recommendation": "approve"}
    )
