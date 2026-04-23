const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("PulseComputeNetwork", function () {
  let pulseNetwork
  let usdc
  let owner
  let worker
  let employer

  const USDC_MOCK = "0x0000000000000000000000000000000000000001"
  const PAYMENT_PER_PING = 9000 // 0.009 USDC

  beforeEach(async () => {
    ;[owner, worker, employer] = await ethers.getSigners()

    // Deploy mock USDC
    const MockToken = await ethers.getContractFactory("MockERC20")
    usdc = await MockToken.deploy("USD Coin", "USDC", 6)
    await usdc.waitForDeployment()

    // Deploy Pulse Network
    const PulseNetwork = await ethers.getContractFactory("PulseComputeNetwork")
    pulseNetwork = await PulseNetwork.deploy(await usdc.getAddress())
    await pulseNetwork.waitForDeployment()

    // Fund employer with USDC
    await usdc.mint(employer.address, ethers.parseUnits("1000", 6))
    await usdc.connect(employer).approve(await pulseNetwork.getAddress(), ethers.parseUnits("1000", 6))
  })

  it("should create a session", async () => {
    const tx = await pulseNetwork.createSession(worker.address, employer.address)
    const receipt = await tx.wait()

    // Check SessionCreated event
    const event = receipt.logs.find(
      (l) => pulseNetwork.interface.parseLog(l).name === "SessionCreated"
    )
    expect(event).to.exist
  })

  it("should record pings and transfer USDC", async () => {
    // Create session
    await pulseNetwork.createSession(worker.address, employer.address)

    const workerBalanceBefore = await usdc.balanceOf(worker.address)

    // Record ping
    await pulseNetwork.recordPing(
      ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256"],
        [worker.address, employer.address, 1]
      )),
      80
    )

    const workerBalanceAfter = await usdc.balanceOf(worker.address)
    expect(workerBalanceAfter - workerBalanceBefore).to.equal(PAYMENT_PER_PING)
  })

  it("should pause and resume worker", async () => {
    await pulseNetwork.pauseWorker(worker.address, employer.address)

    const config = await pulseNetwork.getWorkerConfig(worker.address)
    expect(config.isPaused).to.be.true

    await pulseNetwork.resumeWorker(worker.address, employer.address)

    const configAfter = await pulseNetwork.getWorkerConfig(worker.address)
    expect(configAfter.isPaused).to.be.false
  })

  it("should enforce daily cap", async () => {
    // Set very low daily cap
    await pulseNetwork.setWorkerDailyCap(worker.address, 10000) // $10

    // Try to create session and record multiple pings
    await pulseNetwork.createSession(worker.address, employer.address)

    const sessionId = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256"],
      [worker.address, employer.address, 1]
    ))

    // First ping should succeed
    await pulseNetwork.recordPing(sessionId, 80)

    // Second ping should fail due to cap
    await expect(pulseNetwork.recordPing(sessionId, 80)).to.be.revertedWith("Daily cap exceeded")
  })
})