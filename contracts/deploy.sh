#!/bin/bash
# Pulse Contract Deployment Script
# Uses Foundry to deploy to Arc Testnet
# https://docs.arc.network/arc/tutorials/deploy-on-arc

set -e

echo "=========================================="
echo "Pulse Contracts Deployment to Arc Testnet"
echo "=========================================="

# Check environment
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set"
    echo "Generate a wallet with: cast wallet new"
    exit 1
fi

# Check RPC
ARC_RPC="${ARC_TESTNET_RPC_URL:-https://rpc.testnet.arc.network}"
echo "Using RPC: $ARC_RPC"

# Verify chain ID (should be 5042002 for Arc Testnet)
CHAIN_ID=$(cast chain-id --rpc-url "$ARC_RPC" 2>/dev/null || echo "0")
echo "Chain ID: $CHAIN_ID"

if [ "$CHAIN_ID" != "5042002" ]; then
    echo "Warning: Expected chain ID 5042002 (Arc Testnet), got $CHAIN_ID"
    echo "Continuing anyway..."
fi

# Check USDC balance
echo ""
echo "Checking wallet balance..."
BALANCE=$(cast balance --rpc-url "$ARC_RPC" $(cast wallet address --private-key "$PRIVATE_KEY") 2>/dev/null || echo "0")
echo "Balance: $BALANCE USDC"

if [ "$BALANCE" = "0" ]; then
    echo "Error: No USDC balance"
    echo "Get testnet USDC from: https://faucet.circle.com"
    exit 1
fi

# Build contracts
echo ""
echo "Building contracts..."
cd "$(dirname "$0")/.."
forge build

# Deploy
echo ""
echo "Deploying contracts..."
forge script script/Deploy.s.sol \
    --rpc-url "$ARC_RPC" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --verify \
    --etherscan-api-key testnet \
    -vvv

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update .env with new contract addresses"
echo "2. Run demo: npm run demo:fast"
echo ""
echo "Contract addresses (from output above)"