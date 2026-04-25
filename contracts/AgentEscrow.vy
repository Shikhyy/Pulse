"""
AgentEscrow - Track C2
Task-based escrow with approval and dispute resolution
Based on vyper-agentic-payments patterns
"""
from eth_typing import ChecksumAddress

# ERC20 Interface
interface IERC20:
    def transfer(_to: address, _amount: uint256) -> bool: nonpayable
    def transferFrom(_from: address, _to: address, _amount: uint256) -> bool: nonpayable
    def balanceOf(_owner: address) -> uint256: view

# Event declarations
Event TaskCreated: indexed(task_id: bytes32, creator: address, amount: uint256, description: String[500])
Event TaskClaimed: indexed(task_id: bytes32, worker: address)
Event TaskApproved: indexed(task_id: bytes32, approver: address, amount: uint256)
Event TaskDisputed: indexed(task_id: bytes32, disputed_by: address, reason: String[500])
Event TaskResolved: indexed(task_id: bytes32, resolver: address, amount_paid: uint256)
Event FundsDeposited: indexed(depositor: address, amount: uint256)
Event FundsWithdrawn: indexed(withdrawer: address, amount: uint256)

# Task states
enum TaskStatus:
    PENDING
    CLAIMED
    COMPLETED
    APPROVED
    DISPUTED
    RESOLVED
    CANCELLED

# Contract storage
usdc: public(address)

# Task data
tasks: HashMap[bytes32, {
    creator: address,
    worker: address,
    amount: uint256,
    status: TaskStatus,
    description: String[500],
    created_at: uint256,
    claimed_at: uint256,
    completed_at: uint256,
    approved_at: uint256
}]

# Escrow pool per employer
escrow_balances: HashMap[address, uint256]
task_id_by_index: DynArray[bytes32, 1000]

# Arbiter (dispute resolution)
arbiter: public(address)

# Fee (basis points, max 5%)
service_fee_bps: public(uint256)

# Administrative
admin: public(address)

@external
def __init__(_usdc: address, _arbiter: address, _admin: address):
    self.usdc = _usdc
    self.arbiter = _arbiter
    self.admin = _admin
    self.service_fee_bps = 250  # 2.5% fee

@external
def create_task(_task_id: bytes32, _amount: uint256, _description: String[500]):
    """
    Create a new task with funds in escrow.
    """
    assert self.tasks[_task_id].status == TaskStatus.PENDING  # Must not exist
    assert _amount > 0
    
    # Transfer funds from creator to escrow
    usdc_contract: IERC20 = IERC20(self.usdc)
    usdc_contract.transferFrom(msg.sender, self, _amount)
    
    # Create task
    self.tasks[_task_id] = {
        creator: msg.sender,
        worker: 0x0000000000000000000000000000000000000000,
        amount: _amount,
        status: TaskStatus.PENDING,
        description: _description,
        created_at: block.timestamp,
        claimed_at: 0,
        completed_at: 0,
        approved_at: 0
    }
    
    self.task_id_by_index.append(_task_id)
    self.escrow_balances[msg.sender] += _amount
    
    log TaskCreated(_task_id, msg.sender, _amount, _description)

@external
def claim_task(_task_id: bytes32):
    """
    Worker claims a pending task.
        """
    task: Task = self.tasks[_task_id]
    assert task.status == TaskStatus.PENDING
    assert task.creator != msg.sender  # Creator can't claim own task
    
    task.worker = msg.sender
    task.status = TaskStatus.CLAIMED
    task.claimed_at = block.timestamp
    
    log TaskClaimed(_task_id, msg.sender)

@external
def submit_completed(_task_id: bytes32):
    """
    Worker submits completed work.
        """
    task: Task = self.tasks[_task_id]
    assert task.status == TaskStatus.CLAIMED
    assert task.worker == msg.sender
    
    task.status = TaskStatus.COMPLETED
    task.completed_at = block.timestamp

@external
def approve_task(_task_id: bytes32):
    """
    Creator approves completed work and releases payment.
    """
    task: Task = self.tasks[_task_id]
    assert task.status == TaskStatus.COMPLETED
    assert task.creator == msg.sender
    
    # Calculate fee
    fee: uint256 = (task.amount * self.service_fee_bps) / 10000
    payout: uint256 = task.amount - fee
    
    # Transfer to worker
    usdc_contract: IERC20 = IERC20(self.usdc)
    usdc_contract.transfer(task.worker, payout)
    
    # Update tracking
    self.escrow_balances[task.creator] -= task.amount
    
    task.status = TaskStatus.APPROVED
    task.approved_at = block.timestamp
    
    log TaskApproved(_task_id, msg.sender, payout)

@external
def dispute_task(_task_id: bytes32, _reason: String[500]):
    """
    Raise a dispute on a completed task.
    """
    task: Task = self.tasks[_task_id]
    assert task.status == TaskStatus.COMPLETED or task.status == TaskStatus.CLAIMED
    assert msg.sender == task.creator or msg.sender == task.worker
    
    task.status = TaskStatus.DISPUTED
    
    log TaskDisputed(_task_id, msg.sender, _reason)

@external
def resolve_dispute(_task_id: bytes32, _worker_payout: uint256):
    """
    Arbiter resolves a dispute.
    """
    assert msg.sender == self.arbiter
    
    task: Task = self.tasks[_task_id]
    assert task.status == TaskStatus.DISPUTED
    
    # Transfer to worker
    usdc_contract: IERC20 = IERC20(self.usdc)
    if _worker_payout > 0:
        usdc_contract.transfer(task.worker, _worker_payout)
    
    # Refund remainder to creator
    refund: uint256 = task.amount - _worker_payout
    if refund > 0:
        usdc_contract.transfer(task.creator, refund)
        self.escrow_balances[task.creator] -= refund
    
    task.status = TaskStatus.RESOLVED
    
    log TaskResolved(_task_id, msg.sender, _worker_payout)

@external
def cancel_task(_task_id: bytes32):
    """
    Creator cancels a pending task and gets refund.
    """
    task: Task = self.tasks[_task_id]
    assert task.status == TaskStatus.PENDING
    assert task.creator == msg.sender
    
    # Refund
    usdc_contract: IERC20 = IERC20(self.usdc)
    usdc_contract.transfer(task.creator, task.amount)
    
    self.escrow_balances[task.creator] -= task.amount
    task.status = TaskStatus.CANCELLED
    
    log FundsWithdrawn(task.creator, task.amount)