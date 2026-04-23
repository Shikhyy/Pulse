// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/PulseComputeNetwork.sol";
import "../contracts/PulseAgentIdentity.sol";

/**
 * Deployment Script for Pulse Contracts
 * Run: forge script script/Deploy.s.sol --rpc-url $ARC_TESTNET_RPC_URL --broadcast --private-key $PRIVATE_KEY
 */
contract DeployScript is Script {
    
    // Arc Testnet addresses
    address constant USDC = 0x3600000000000000000000000000000000000000;
    address constant GATEWAY = 0x0077777d7EBA4688BDeF3E311b846F25870A19B9;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying Pulse contracts to Arc Testnet...");
        console.log("Chain ID:", block.chainid);
        
        // Deploy PulseComputeNetwork
        console.log("Deploying PulseComputeNetwork...");
        PulseComputeNetwork pulseNetwork = new PulseComputeNetwork(USDC);
        console.log("PulseComputeNetwork deployed at:", address(pulseNetwork));
        
        // Deploy PulseAgentIdentity (ERC-8004)
        console.log("Deploying PulseAgentIdentity...");
        PulseAgentIdentity agentIdentity = new PulseAgentIdentity();
        console.log("PulseAgentIdentity deployed at:", address(agentIdentity));
        
        // Verify USDC
        console.log("USDC address:", USDC);
        console.log("Gateway address:", GATEWAY);
        
        vm.stopBroadcast();
        
        // Write deployment addresses to file
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("PulseComputeNetwork:", address(pulseNetwork));
        console.log("PulseAgentIdentity:", address(agentIdentity));
    }
}