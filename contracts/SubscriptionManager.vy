"""
SubscriptionManager - Track C3
Recurring payments with plans, subscriptions, and billing
Based on vyper-agentic-payments patterns
"""
from eth_typing import ChecksumAddress

# ERC20 Interface
interface IERC20:
    def transfer(_to: address, _amount: uint256) -> bool: nonpayable
    def transferFrom(_from: address, _to: address, _amount: uint256) -> bool: nonpayable
    def balanceOf(_owner: address) -> uint256: view

# Event declarations
Event PlanCreated: indexed(plan_id: uint256, creator: address, price: uint256, interval: uint256)
Event Subscribed: indexed(subscriber: address, plan_id: uint256, start: uint256, next_bill: uint256)
Event Charged: indexed(subscriber: address, plan_id: uint256, amount: uint256, timestamp: uint256)
Event SubscriptionCancelled: indexed(subscriber: address, plan_id: uint256, timestamp: uint256)
Event SubscriptionPaused: indexed(subscriber: address, plan_id: uint256)
Event SubscriptionResumed: indexed(subscriber: address, plan_id: uint256, next_bill: uint256)

# Subscription intervals
enum BillingInterval:
    DAILY
    WEEKLY
    MONTHLY
    YEARLY

# Plan data
struct Plan:
    creator: address
    name: String[100]
    description: String[500]
    price: uint256
    interval: BillingInterval
    max_subscribers: uint256
    is_active: bool

# Subscription data
struct Subscription:
    subscriber: address
    plan_id: uint256
    start_time: uint256
    next_bill_time: uint256
    is_active: bool
    last_charged: uint256
    total_paid: uint256

# Contract storage
usdc: public(address)

# Plans
plans: public(HashMap[uint256, Plan])
next_plan_id: public(uint256)

# Subscriptions: subscriber -> plan_id -> Subscription
subscriptions: HashMap[address, HashMap[uint256, Subscription]]

# Track all subscribers per plan
plan_subscribers: DynArray[address, 1000]

# Service fee (basis points)
service_fee_bps: public(uint256)

# Administrative
admin: public(address)

@external
def __init__(_usdc: address, _admin: address):
    self.usdc = _usdc
    self.admin = _admin
    self.service_fee_bps = 250  # 2.5%
    self.next_plan_id = 1

@external
def create_plan(_name: String[100], _description: String[500], _price: uint256, _interval: BillingInterval, _max_subscribers: uint256) -> uint256:
    """
    Create a subscription plan.
    """
    plan_id: uint256 = self.next_plan_id
    
    self.plans[plan_id] = Plan({
        creator: msg.sender,
        name: _name,
        description: _description,
        price: _price,
        interval: _interval,
        max_subscribers: _max_subscribers,
        is_active: True
    })
    
    self.next_plan_id += 1
    
    log PlanCreated(plan_id, msg.sender, _price, convert(_interval, uint256))
    
    return plan_id

@external
def subscribe(_plan_id: uint256):
    """
    Subscribe to a plan.
    """
    plan: Plan = self.plans[_plan_id]
    assert plan.is_active
    
    # Check max subscribers
    current_subs: uint256 = 0
    for sub_addr in self.plan_subscribers:
        if sub_addr in self.subscriptions:
            if self.subscriptions[sub_addr][_plan_id].is_active:
                current_subs += 1
    
    assert current_subs < plan.max_subscribers
    
    # Calculate first billing time
    interval_seconds: uint256 = 86400  # daily
    if plan.interval == BillingInterval.WEEKLY:
        interval_seconds = 604800
    elif plan.interval == BillingInterval.MONTHLY:
        interval_seconds = 2592000
    elif plan.interval == BillingInterval.YEARLY:
        interval_seconds = 31536000
    
    # Authorize USDC transfer
    usdc_contract: IERC20 = IERC20(self.usdc)
    usdc_contract.transferFrom(msg.sender, self, plan.price)
    
    # Create subscription
    self.subscriptions[msg.sender][_plan_id] = Subscription({
        subscriber: msg.sender,
        plan_id: _plan_id,
        start_time: block.timestamp,
        next_bill_time: block.timestamp + interval_seconds,
        is_active: True,
        last_charged: block.timestamp,
        total_paid: plan.price
    })
    
    self.plan_subscribers.append(msg.sender)
    
    log Subscribed(msg.sender, _plan_id, block.timestamp, block.timestamp + interval_seconds)

@external
def charge_subscribers(_plan_id: uint256):
    """
    Charge all active subscribers for a plan.
    Called by anyone (keeper pattern).
    """
    plan: Plan = self.plans[_plan_id]
    assert plan.is_active
    
    usdc_contract: IERC20 = IERC20(self.usdc)
    charged_count: uint256 = 0
    
    for sub_addr in self.plan_subscribers:
        if sub_addr in self.subscriptions:
            sub: Subscription = self.subscriptions[sub_addr][_plan_id]
            
            if sub.is_active and block.timestamp >= sub.next_bill_time:
                # Calculate next billing
                interval_seconds: uint256 = 86400
                if plan.interval == BillingInterval.WEEKLY:
                    interval_seconds = 604800
                elif plan.interval == BillingInterval.MONTHLY:
                    interval_seconds = 2592000
                elif plan.interval == BillingInterval.YEARLY:
                    interval_seconds = 31536000
                
                # Charge
                fee: uint256 = (plan.price * self.service_fee_bps) / 10000
                payout: uint256 = plan.price - fee
                
                usdc_contract.transfer(subscriber, payout)
                
                # Update subscription
                sub.next_bill_time += interval_seconds
                sub.last_charged = block.timestamp
                sub.total_paid += plan.price
                self.subscriptions[sub_addr][_plan_id] = sub
                
                log Charged(sub_addr, _plan_id, plan.price, block.timestamp)
                charged_count += 1
    
    return charged_count

@external
def cancel_subscription(_plan_id: uint256):
    """
    Cancel subscription (subscriber can cancel anytime).
    """
    assert msg.sender in self.subscriptions
    
    sub: Subscription = self.subscriptions[msg.sender][_plan_id]
    assert sub.is_active
    
    sub.is_active = False
    self.subscriptions[msg.sender][_plan_id] = sub
    
    log SubscriptionCancelled(msg.sender, _plan_id, block.timestamp)

@external
def pause_subscription(_plan_id: uint256):
    """
    Pause subscription (no billing during pause).
    """
    assert msg.sender in self.subscriptions
    
    sub: Subscription = self.subscriptions[msg.sender][_plan_id]
    sub.is_active = False
    self.subscriptions[msg.sender][_plan_id] = sub
    
    log SubscriptionPaused(msg.sender, _plan_id)

@external
def resume_subscription(_plan_id: uint256):
    """
    Resume paused subscription.
    """
    assert msg.sender in self.subscriptions
    
    plan: Plan = self.plans[_plan_id]
    
    # Calculate next billing
    interval_seconds: uint256 = 86400
    if plan.interval == BillingInterval.WEEKLY:
        interval_seconds = 604800
    elif plan.interval == BillingInterval.MONTHLY:
        interval_seconds = 2592000
    elif plan.interval == BillingInterval.YEARLY:
        interval_seconds = 31536000
    
    sub: Subscription = self.subscriptions[msg.sender][_plan_id]
    sub.is_active = True
    sub.next_bill_time = block.timestamp + interval_seconds
    self.subscriptions[msg.sender][_plan_id] = sub
    
    log SubscriptionResumed(msg.sender, _plan_id, sub.next_bill_time)

@external
def withdraw_funds():
    """
    Plan creator - withdraw accumulated fees.
    """
    # This would require tracking fees separately
    # Simplified for demo
    pass