// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * Pulse Compute Network
 * 
 * Arc Testnet USDC: 0x3600000000000000000000000000000000000000 (6 decimals)
 * Chain ID: 5042002 (Arc Testnet)
 * 
 * Based on vyper-agentic-payments patterns for agentic commerce
 */
contract PulseComputeNetwork is Ownable, ReentrancyGuard {
    // Arc Testnet USDC - https://docs.arc.network/arc/references/contract-addresses#usdc
    IERC20 public immutable usdc;

    uint256 public constant PAYMENT_PER_PING = 0.009e6; // 0.009 USDC (6 decimals)
    uint256 public constant PING_INTERVAL = 30 seconds;
    uint256 public constant MAX_DAILY_CAP = 100e6;

    // Gateway contract for nanopayments - https://developers.circle.com/gateway
    address public gatewayWallet = 0x0077777d7EBA4688BDeF3E311b846F25870A19B9;

    uint256 public constant PAYMENT_PER_PING = 0.009e6;
    uint256 public constant PING_INTERVAL = 30 seconds;
    uint256 public constant MAX_DAILY_CAP = 100e6;

    struct Session {
        address worker;
        address employer;
        uint256 startTime;
        uint256 endTime;
        uint256 totalEarned;
        uint256 pingCount;
        bool isActive;
    }

    struct WorkerConfig {
        uint256 dailyCap;
        uint256 hourlyRate;
        bool isPaused;
    }

    mapping(bytes32 => Session) public sessions;
    mapping(address => WorkerConfig) public workerConfigs;
    mapping(address => uint256) public employerDailySpent;
    mapping(address => uint256) public dailySpentTimestamp;

    event SessionCreated(bytes32 indexed sessionId, address indexed worker, address indexed employer);
    event PingRecorded(bytes32 indexed sessionId, uint256 amount, uint256 timestamp);
    event SessionEnded(bytes32 indexed sessionId, uint256 totalEarned, uint256 duration);
    event WorkerPaused(address indexed worker, address indexed employer);
    event WorkerResumed(address indexed worker, address indexed employer);
    event BudgetWarning(address indexed employer, uint256 spent, uint256 cap);
    event BudgetExceeded(address indexed employer, uint256 spent, uint256 cap);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    function createSession(address _worker, address _employer) external onlyOwner returns (bytes32) {
        require(_worker != address(0), "Invalid worker");
        require(_employer != address(0), "Invalid employer");

        bytes32 sessionId = keccak256(abi.encodePacked(_worker, _employer, block.timestamp));
        
        sessions[sessionId] = Session({
            worker: _worker,
            employer: _employer,
            startTime: block.timestamp,
            endTime: 0,
            totalEarned: 0,
            pingCount: 0,
            isActive: true
        });

        if (workerConfigs[_worker].dailyCap == 0) {
            workerConfigs[_worker].dailyCap = 50e6;
            workerConfigs[_worker].hourlyRate = 18e6;
            workerConfigs[_worker].isPaused = false;
        }

        emit SessionCreated(sessionId, _worker, _employer);
        return sessionId;
    }

    function recordPing(bytes32 _sessionId, uint256 _activityScore) external onlyOwner nonReentrant {
        Session storage session = sessions[_sessionId];
        require(session.isActive, "Session not active");
        require(_activityScore >= 50, "Activity too low");

        _resetDailySpentIfNeeded(session.employer);

        uint256 employerDaily = employerDailySpent[session.employer];
        uint256 workerCap = workerConfigs[session.worker].dailyCap;

        require(employerDaily + PAYMENT_PER_PING <= workerCap, "Daily cap exceeded");
        require(!workerConfigs[session.worker].isPaused, "Worker paused");

        require(
            usdc.transferFrom(session.employer, session.worker, PAYMENT_PER_PING),
            "USDC transfer failed"
        );

        session.pingCount++;
        session.totalEarned += PAYMENT_PER_PING;
        employerDailySpent[session.employer] += PAYMENT_PER_PING;

        uint256 pct = (employerDailySpent[session.employer] * 100) / workerCap;
        if (pct >= 80 && pct < 100) {
            emit BudgetWarning(session.employer, employerDailySpent[session.employer], workerCap);
        }

        emit PingRecorded(_sessionId, PAYMENT_PER_PING, block.timestamp);
    }

    function endSession(bytes32 _sessionId) external onlyOwner {
        Session storage session = sessions[_sessionId];
        require(session.isActive, "Session not active");

        session.isActive = false;
        session.endTime = block.timestamp;

        emit SessionEnded(_sessionId, session.totalEarned, session.endTime - session.startTime);
    }

    function pauseWorker(address _worker, address _employer) external onlyOwner {
        workerConfigs[_worker].isPaused = true;
        emit WorkerPaused(_worker, _employer);
    }

    function resumeWorker(address _worker, address _employer) external onlyOwner {
        workerConfigs[_worker].isPaused = false;
        emit WorkerResumed(_worker, _employer);
    }

    function setWorkerDailyCap(address _worker, uint256 _cap) external onlyOwner {
        require(_cap <= MAX_DAILY_CAP, "Cap too high");
        workerConfigs[_worker].dailyCap = _cap;
    }

    function setWorkerHourlyRate(address _worker, uint256 _rate) external onlyOwner {
        workerConfigs[_worker].hourlyRate = _rate;
    }

    function getSessionInfo(bytes32 _sessionId) external view returns (
        address worker,
        address employer,
        uint256 startTime,
        uint256 totalEarned,
        uint256 pingCount,
        bool isActive
    ) {
        Session memory s = sessions[_sessionId];
        return (s.worker, s.employer, s.startTime, s.totalEarned, s.pingCount, s.isActive);
    }

    function getWorkerConfig(address _worker) external view returns (
        uint256 dailyCap,
        uint256 hourlyRate,
        bool isPaused
    ) {
        WorkerConfig memory c = workerConfigs[_worker];
        return (c.dailyCap, c.hourlyRate, c.isPaused);
    }

    function getEmployerDailySpent(address _employer) external view returns (uint256) {
        _resetDailySpentIfNeeded(_employer);
        return employerDailySpent[_employer];
    }

    function _resetDailySpentIfNeeded(address _employer) internal {
        if (dailySpentTimestamp[_employer] < block.timestamp - 1 days) {
            employerDailySpent[_employer] = 0;
            dailySpentTimestamp[_employer] = block.timestamp;
        }
    }
}