"""
Pulse Compute Network - Vyper Implementation
Agentic payment smart contract for nanopayments on Arc

Vyper version: 0.3.10+
"""

from eth_typing import ChecksumAddress
from eth_abi import encode
from eth_utils import keccak

# ERC20 Interface (simplified for Vyper)
interface IERC20:
    def transfer(_to: address, _amount: uint256) -> bool: nonpayable
    def transferFrom(_from: address, _to: address, _amount: uint256) -> bool: nonpayable

# Event declarations
Event SessionCreated: indexed(session_id: bytes32, worker: address, employer: address)
Event PingRecorded: indexed(session_id: bytes32, amount: uint256, timestamp: uint256)
Event SessionEnded: indexed(session_id: bytes32, total_earned: uint256, duration: uint256)
Event WorkerPaused: indexed(worker: address, employer: address)
Event WorkerResumed: indexed(worker: address, employer: address)
Event BudgetWarning: indexed(employer: address, spent: uint256, cap: uint256)

# Contract storage
usdc: public(address)

PAYMENT_PER_PING: constant(uint256) = 9_000  # 0.009 USDC (6 decimals)
PING_INTERVAL: constant(uint256) = 30  # seconds

# Session data
sessions: HashMap[bytes32, {
    worker: address,
    employer: address,
    start_time: uint256,
    end_time: uint256,
    total_earned: uint256,
    ping_count: uint256,
    is_active: bool
}]

# Worker configuration
worker_configs: HashMap[address, {
    daily_cap: uint256,
    hourly_rate: uint256,
    is_paused: bool
}]

# Employer daily spending tracking
employer_daily_spent: HashMap[address, uint256]
daily_spent_timestamp: HashMap[address, uint256]

@external
def __init__(_usdc: address):
    """
    Initialize contract with USDC token address.
    """
    self.usdc = _usdc

@external
def create_session(_worker: address, _employer: address) -> bytes32:
    """
    Create a new compute session between worker and employer.
    """
    assert _worker != empty(address), "Invalid worker"
    assert _employer != empty(address), "Invalid employer"

    session_id: bytes32 = keccak(encode(['address', 'address', 'uint256'], [_worker, _employer, block.timestamp]))
    
    self.sessions[session_id] = {
        worker: _worker,
        employer: _employer,
        start_time: block.timestamp,
        end_time: 0,
        total_earned: 0,
        ping_count: 0,
        is_active: True
    }

    # Initialize worker config if not exists
    if self.worker_configs[_worker].daily_cap == 0:
        self.worker_configs[_worker] = {
            daily_cap: 50_000_000,  # $50
            hourly_rate: 18_000_000,  # $18/hr
            is_paused: False
        }

    log.SessionCreated(session_id, _worker, _employer)
    return session_id

@external
def record_ping(_session_id: bytes32, _activity_score: uint256):
    """
    Record a ping from activity agent and transfer payment.
    Requires activity score >= 50 for payment.
    """
    session: {
        worker: address,
        employer: address,
        start_time: uint256,
        end_time: uint256,
        total_earned: uint256,
        ping_count: uint256,
        is_active: bool
    } = self.sessions[_session_id]

    assert session.is_active, "Session not active"
    assert _activity_score >= 50, "Activity too low"

    # Check and reset daily spending if needed
    self._reset_daily_spent(session.employer)

    employer_daily: uint256 = self.employer_daily_spent[session.employer]
    worker_cap: uint256 = self.worker_configs[session.worker].daily_cap

    assert employer_daily + PAYMENT_PER_PING <= worker_cap, "Daily cap exceeded"
    assert not self.worker_configs[session.worker].is_paused, "Worker paused"

    # Execute USDC transfer
    usdc_contract: IERC20 = IERC20(self.usdc)
    assert usdc_contract.transferFrom(session.employer, session.worker, PAYMENT_PER_PING), "Transfer failed"

    # Update session state
    self.sessions[_session_id].ping_count += 1
    self.sessions[_session_id].total_earned += PAYMENT_PER_PING
    self.employer_daily_spent[session.employer] += PAYMENT_PER_PING

    # Budget warning at 80%
    spent_pct: uint256 = (self.employer_daily_spent[session.employer] * 100) / worker_cap
    if spent_pct >= 80 and spent_pct < 100:
        log.BudgetWarning(session.employer, self.employer_daily_spent[session.employer], worker_cap)

    log.PingRecorded(_session_id, PAYMENT_PER_PING, block.timestamp)

@external
def end_session(_session_id: bytes32):
    """
    End an active session.
    """
    session: {
        worker: address,
        employer: address,
        start_time: uint256,
        end_time: uint256,
        total_earned: uint256,
        ping_count: uint256,
        is_active: bool
    } = self.sessions[_session_id]

    assert session.is_active, "Session not active"

    self.sessions[_session_id].is_active = False
    self.sessions[_session_id].end_time = block.timestamp

    duration: uint256 = block.timestamp - session.start_time
    log.SessionEnded(_session_id, session.total_earned, duration)

@external
def pause_worker(_worker: address, _employer: address):
    """
    Pause payments to a worker.
    """
    self.worker_configs[_worker].is_paused = True
    log.WorkerPaused(_worker, _employer)

@external
def resume_worker(_worker: address, _employer: address):
    """
    Resume payments to a worker.
    """
    self.worker_configs[_worker].is_paused = False
    log.WorkerResumed(_worker, _employer)

@external
def set_worker_daily_cap(_worker: address, _cap: uint256):
    """
    Set daily spending cap for a worker.
    """
    self.worker_configs[_worker].daily_cap = _cap

@external
def get_session_info(_session_id: bytes32) -> (address, address, uint256, uint256, uint256, bool):
    """
    Get session details.
    """
    session: {
        worker: address,
        employer: address,
        start_time: uint256,
        end_time: uint256,
        total_earned: uint256,
        ping_count: uint256,
        is_active: bool
    } = self.sessions[_session_id]
    
    return (
        session.worker,
        session.employer,
        session.start_time,
        session.total_earned,
        session.ping_count,
        session.is_active
    )

@external
def get_worker_config(_worker: address) -> (uint256, uint256, bool):
    """
    Get worker configuration.
    """
    config: {
        daily_cap: uint256,
        hourly_rate: uint256,
        is_paused: bool
    } = self.worker_configs[_worker]
    
    return (config.daily_cap, config.hourly_rate, config.is_paused)

@internal
def _reset_daily_spent(_employer: address):
    """
    Reset daily spending if more than 24 hours have passed.
    """
    if self.daily_spent_timestamp[_employer] < block.timestamp - 86400:
        self.employer_daily_spent[_employer] = 0
        self.daily_spent_timestamp[_employer] = block.timestamp