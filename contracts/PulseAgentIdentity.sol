// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * PulseAgentIdentity - ERC-8004 Compatible Agent Identity
 * 
 * Implements agent identity for the Pulse compute network.
 * Based on ERC-8004: https://github.com/vyperlang/erc-8004-vyper
 * 
 * Each AI agent/worker gets a unique identity NFT that represents:
 * - Unique agent identifier
 * - Reputation score
 * - Trust level
 * - Capabilities/permissions
 */
contract PulseAgentIdentity is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    uint256 private _nextTokenId;

    // Agent data struct
    struct AgentInfo {
        string agentType;        // "compute", "orchestrator", "verifier"
        uint256 reputation;      // 0-10000 (basis points)
        uint256 trustLevel;      // 0-10000
        uint64 createdAt;
        uint64 lastActiveAt;
        bool isActive;
        bytes32 capabilities;    // Bitfield for capabilities
    }

    // Mapping from token ID to agent info
    mapping(uint256 => AgentInfo) public agentInfo;
    
    // Mapping from agent address to token ID
    mapping(address => uint256) public agentToTokenId;
    
    // Reputation change events (for on-chain tracking)
    event ReputationUpdated(uint256 indexed tokenId, uint256 oldRep, uint256 newRep);
    event TrustLevelUpdated(uint256 indexed tokenId, uint256 oldTrust, uint256 newTrust);
    event AgentActivated(uint256 indexed tokenId, address indexed owner);
    event AgentDeactivated(uint256 indexed tokenId, address indexed owner);

    constructor() ERC721("PulseAgent", "PULSE-AI") Ownable(msg.sender) {}

    /**
     * Register a new agent identity
     * @param to Address that will own the agent NFT
     * @param agentType Type of agent (compute, orchestrator, verifier)
     * @param capabilities Bitfield of capabilities
     */
    function registerAgent(
        address to,
        string memory agentType,
        bytes32 capabilities
    ) public returns (uint256) {
        require(agentToTokenId[to] == 0, "Agent already registered");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        agentInfo[tokenId] = AgentInfo({
            agentType: agentType,
            reputation: 5000, // Start at 50%
            trustLevel: 5000, // Start at 50%
            createdAt: uint64(block.timestamp),
            lastActiveAt: uint64(block.timestamp),
            isActive: true,
            capabilities: capabilities
        });

        agentToTokenId[to] = tokenId;
        
        // Set default URI
        _setTokenURI(tokenId, string(abi.encodePacked("https://pulse.ai/agent/", Strings.toString(tokenId))));

        return tokenId;
    }

    /**
     * Update agent activity timestamp
     */
    function updateActivity(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not agent owner");
        agentInfo[tokenId].lastActiveAt = uint64(block.timestamp);
    }

    /**
     * Update reputation score (0-10000 basis points)
     */
    function updateReputation(uint256 tokenId, uint256 newReputation) external onlyOwner {
        require(newReputation <= 10000, "Reputation max 10000");
        uint256 oldRep = agentInfo[tokenId].reputation;
        agentInfo[tokenId].reputation = newReputation;
        emit ReputationUpdated(tokenId, oldRep, newReputation);
    }

    /**
     * Update trust level (0-10000 basis points)
     */
    function updateTrustLevel(uint256 tokenId, uint256 newTrust) external onlyOwner {
        require(newTrust <= 10000, "Trust max 10000");
        uint256 oldTrust = agentInfo[tokenId].trustLevel;
        agentInfo[tokenId].trustLevel = newTrust;
        emit TrustLevelUpdated(tokenId, oldTrust, newTrust);
    }

    /**
     * Activate/Deactivate agent
     */
    function setAgentActive(uint256 tokenId, bool active) external {
        require(ownerOf(tokenId) == msg.sender, "Not agent owner");
        agentInfo[tokenId].isActive = active;
        if (active) {
            emit AgentActivated(tokenId, msg.sender);
        } else {
            emit AgentDeactivated(tokenId, msg.sender);
        }
    }

    /**
     * Check if agent is trusted for transactions
     */
    function isTrusted(uint256 tokenId, uint256 minTrust) external view returns (bool) {
        return agentInfo[tokenId].isActive && agentInfo[tokenId].trustLevel >= minTrust;
    }

    /**
     * Get agent info
     */
    function getAgentInfo(uint256 tokenId) external view returns (AgentInfo memory) {
        return agentInfo[tokenId];
    }

    /**
     * Get token ID by agent address
     */
    function getTokenIdByAddress(address agentAddress) external view returns (uint256) {
        return agentToTokenId[agentAddress];
    }

    // Required overrides for multiple inheritance
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}