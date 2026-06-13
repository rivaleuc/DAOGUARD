// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title GovernorGate — blocks execution of non-compliant proposals
/// @notice Sits between governance voting and execution. Resolver reads
///         DAOGuard.read_compliance() and approves/blocks execution.
contract GovernorGate {
    address public owner;
    address public resolver;

    mapping(uint256 => bool) public cleared;   // proposal cleared for execution
    mapping(uint256 => bool) public blocked;   // proposal explicitly blocked

    event ProposalCleared(uint256 indexed proposalId);
    event ProposalBlocked(uint256 indexed proposalId, string reason);

    modifier onlyResolver() { require(msg.sender == resolver, "!resolver"); _; }
    modifier onlyOwner() { require(msg.sender == owner, "!owner"); _; }

    constructor(address _resolver) {
        owner = msg.sender;
        resolver = _resolver;
    }

    function clearProposal(uint256 proposalId) external onlyResolver {
        require(!blocked[proposalId], "already blocked");
        cleared[proposalId] = true;
        emit ProposalCleared(proposalId);
    }

    function blockProposal(uint256 proposalId, string calldata reason) external onlyResolver {
        require(!cleared[proposalId], "already cleared");
        blocked[proposalId] = true;
        emit ProposalBlocked(proposalId, reason);
    }

    function canExecute(uint256 proposalId) external view returns (bool) {
        return cleared[proposalId] && !blocked[proposalId];
    }

    function setResolver(address _r) external onlyOwner { resolver = _r; }
}
