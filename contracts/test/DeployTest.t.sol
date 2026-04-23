// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/PulseComputeNetwork.sol";
import "../contracts/PulseAgentIdentity.sol";

contract DeployTest is Test {
    PulseComputeNetwork public pulseNetwork;
    PulseAgentIdentity public agentIdentity;
    
    address public owner;
    address public worker;
    address public employer;
    
    USDC public usdc;
    
    function setUp() public {
        owner = address(this);
        worker = makeAddr("worker");
        employer = makeAddr("employer");
        
        // Deploy mock USDC (6 decimals for Arc)
        usdc = new USDC("USD Coin", "USDC", 6);
        
        // Deploy contracts
        pulseNetwork = new PulseComputeNetwork(address(usdc));
        agentIdentity = new PulseAgentIdentity();
        
        // Mint USDC to employer for testing
        usdc.mint(employer, 1000e6);
    }
    
    function test_deployment() public view {
        assertTrue(address(pulseNetwork) != address(0));
        assertTrue(address(agentIdentity) != address(0));
    }
    
    function test_registerAgent() public {
        uint256 tokenId = agentIdentity.registerAgent(worker, "compute", bytes32(uint256(1)));
        
        assertEq(tokenId, 0);
        assertEq(agentIdentity.ownerOf(tokenId), worker);
        
        (string memory agentType, uint256 rep, uint256 trust,,,,) = agentIdentity.agentInfo(tokenId);
        
        assertEq(agentType, "compute");
        assertEq(rep, 5000); // Initial reputation
        assertEq(trust, 5000); // Initial trust
    }
    
    function test_computeSession() public {
        // Register worker as agent
        uint256 workerTokenId = agentIdentity.registerAgent(worker, "compute", bytes32(uint256(1));
        
        // Create session
        bytes32 sessionId = pulseNetwork.createSession(worker, employer);
        
        // Verify session
        (address sessionWorker, address sessionEmployer, uint256 startTime,, uint256 pingCount, bool isActive) = 
            pulseNetwork.sessions(sessionId);
        
        assertEq(sessionWorker, worker);
        assertEq(sessionEmployer, employer);
        assertTrue(isActive);
        assertEq(pingCount, 0);
    }
    
    function test_pingAndPayment() public {
        // Setup
        bytes32 sessionId = pulseNetwork.createSession(worker, employer);
        
        // Approve contract to spend USDC
        vm.prank(employer);
        usdc.approve(address(pulseNetwork), type(uint256).max);
        
        // Record ping
        pulseNetwork.recordPing(sessionId, 80);
        
        // Check session updated
        (,,,, uint256 pingCount,) = pulseNetwork.sessions(sessionId);
        assertEq(pingCount, 1);
        
        // Check worker received USDC
        assertEq(usdc.balanceOf(worker), 9000); // 0.009 USDC
    }
    
    function test_workerPauseResume() public {
        bytes32 sessionId = pulseNetwork.createSession(worker, employer);
        
        // Pause worker
        pulseNetwork.pauseWorker(worker, employer);
        
        // Verify paused
        (, uint256 dailyCap, bool isPaused) = pulseNetwork.workerConfigs(worker);
        assertTrue(isPaused);
        
        // Resume worker
        pulseNetwork.resumeWorker(worker, employer);
        
        // Verify active
        (, , isPaused) = pulseNetwork.workerConfigs(worker);
        assertFalse(isPaused);
    }
    
    function test_budgetCap() public {
        // Set very low cap
        pulseNetwork.setWorkerDailyCap(worker, 10000); // $10
        
        bytes32 sessionId = pulseNetwork.createSession(worker, employer);
        
        vm.prank(employer);
        usdc.approve(address(pulseNetwork), type(uint256).max);
        
        // First ping should work
        pulseNetwork.recordPing(sessionId, 80);
        
        // Second ping should fail (cap exceeded)
        vm.expectRevert("Daily cap exceeded");
        pulseNetwork.recordPing(sessionId, 80);
    }
}

// Simple mock USDC for testing
contract USDC is ERC20 {
    uint8 private _decimals;
    
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}