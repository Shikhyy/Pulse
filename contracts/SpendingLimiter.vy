"""
SpendingLimiter - Track C1
Agent spending limits with daily, per-transaction, and total caps
Based on vyper-agentic-payments patterns
"""
from eth_typing import ChecksumAddress

# ERC20 Interface
interface IERC20:
    def transfer(_to: address, _amount: uint256) -> bool: nonpayable
    def balanceOf(_owner: address) -> uint256: view

# Event declarations
Event LimiterConfigUpdated: indexed(agent: address, limit_type: String[20], new_limit: uint256)
Event TransferRestricted: indexed(agent: address, amount: uint256, reason: String[100])
Event EmergencyPause: indexed(agent: address, pauser: address)
Event EmergencyResume: indexed(agent: address, resumer: address)

# Contract storage
usdc: public(address)

# Spending limits per agent
max_daily: public(HashMap[address, uint256])          # Max spend per day
max_per_tx: public(HashMap[address, uint256])        # Max per transaction
max_total: public(HashMap[address, uint256])        # Max total lifetime

# Tracking
daily_spent: public(HashMap[address, uint256])
daily_reset: public(HashMap[address, uint256])
total_spent: public(HashMap[address, uint256])

# Pause state
is_paused: public(HashMap[address, bool])
emergency_pause_enabled: public(bool)

# Administrative
admin: public(address)

@external
def __init__(_usdc: address, _admin: address):
    self.usdc = _usdc
    self.admin = _admin
    self.emergency_pause_enabled = True

    # Default limits (in USDC 6 decimals)
    self.max_per_tx[0x0000000000000000000000000000000000000000] = 10_000_000  # $10
    self.max_daily[0x0000000000000000000000000000000000000000] = 100_000_000  # $100
    self.max_total[0x0000000000000000000000000000000000000000] = 10_000_000_000  # $10,000

@external
def set_limits(_agent: address, _daily: uint256, _per_tx: uint256, _total: uint256):
    """
    Set spending limits for an agent.
    """
    assert msg.sender == self.admin
    
    self.max_daily[_agent] = _daily
    self.max_per_tx[_agent] = _per_tx
    self.max_total[_agent] = _total
    
    log LimiterConfigUpdated(_agent, "daily", _daily)
    log LimiterConfigUpdated(_agent, "per_tx", _per_tx)
    log LimiterConfigUpdated(_agent, "total", _total)

@view
def _get_effective_limit(_agent: address, _amount: uint256) -> uint256:
    """
    Get the effective (lowest) limit for a transaction.
    """
    daily_limit: uint256 = self.max_daily[_agent]
    if daily_limit == 0:
        daily_limit = self.max_daily[0x0000000000000000000000000000000000000000]
    
    tx_limit: uint256 = self.max_per_tx[_agent]
    if tx_limit == 0:
        tx_limit = self.max_per_tx[0x0000000000000000000000000000000000000000]
    
    total_limit: uint256 = self.max_total[_agent]
    if total_limit == 0:
        total_limit = self.max_total[0x0000000000000000000000000000000000000000]
    
    # Return minimum of all limits
    result: uint256 = daily_limit
    if tx_limit < result:
        result = tx_limit
    if total_limit < result:
        result = total_limit
    
    return result

@external
def check_transfer(_agent: address, _amount: uint256) -> bool:
    """
    Check if a transfer is allowed. Reverts if restricted.
    """
    # Check emergency pause
    if self.is_paused[_agent]:
        log TransferRestricted(_agent, _amount, "Emergency pause active")
        raise "Transfer restricted: emergency pause"
    
    # Reset daily if needed
    if block.timestamp >= self.daily_reset[_agent]:
        self.daily_spent[_agent] = 0
        self.daily_reset[_agent] = block.timestamp + 86400  # 24 hours
    
    # Check per-tx limit
    tx_limit: uint256 = self.max_per_tx[_agent]
    if tx_limit == 0:
        tx_limit = self.max_per_tx[0x0000000000000000000000000000000000000000]
    
    if _amount > tx_limit:
        log TransferRestricted(_agent, _amount, "Per-tx limit exceeded")
        raise "Transfer restricted: per-tx limit"
    
    # Check daily limit
    if self.daily_spent[_agent] + _amount > self.max_daily[_agent]:
        log TransferRestricted(_agent, _amount, "Daily limit exceeded")
        raise "Transfer restricted: daily limit"
    
    # Check total limit
    if self.total_spent[_agent] + _amount > self.max_total[_agent]:
        log TransferRestricted(_agent, _amount, "Total limit exceeded")
        raise "Transfer restricted: total limit"
    
    return True

@external
def record_transfer(_agent: address, _amount: uint256):
    """
    Record a successful transfer.
    """
    self.daily_spent[_agent] += _amount
    self.total_spent[_agent] += _amount

@external
def emergency_pause(_agent: address):
    """
    Emergency pause for an agent.
    """
    assert self.emergency_pause_enabled
    assert msg.sender == self.admin
    
    self.is_paused[_agent] = True
    log EmergencyPause(_agent, msg.sender)

@external
def emergency_resume(_agent: address):
    """
    Resume after emergency pause.
    """
    assert msg.sender == self.admin
    
    self.is_paused[_agent] = False
    log EmergencyResume(_agent, msg.sender)