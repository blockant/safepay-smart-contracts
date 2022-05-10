const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const truffleAssert = require('truffle-assertions');

const PROJECT_NAME = "ProjectName";
const CHAIN_ID = "31337";
const VERSION = "1";
let verifyingContract;
const getJobId = (userAddress, number) =>{
  return ethers.utils.solidityPack([ "address", "uint96" ], [userAddress, number]); 
  //0x60C1F061B4fd365389dEFa3596FfFC8749D83b3B000000000000000000000001
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const signJobCreation = async(signer, contractor, _jobId,_freelancer, _payment, _fees,_startTime,_endTime) => {

  const domain = {
      name: PROJECT_NAME,
      version: VERSION,
      chainId: CHAIN_ID,
      verifyingContract: verifyingContract
  };

  // The named list of all type definitions
  const types = {
    jobCreation: [
      {name: "contractor", type: "address"},
      {name: "jobId", type: "uint256"},
      {name: "freelancer", type: "address"},
      {name: "payment", type: "uint256" },
      {name: "fees", type: "uint256"},
      {name: "startTime", type: "uint256"},
      {name: "endTime", type: "uint256"}
    ]
  };

  const value = {
    contractor: contractor.address,
    jobId: _jobId,
    freelancer: _freelancer,
    payment: _payment,
    fees: _fees,
    startTime: _startTime,
    endTime: _endTime
  };

  let signature = signer._signTypedData(domain, types, value);
      return signature;
}

const signJobCancellation = async(signer, _jobId, _FEES, _startTime, _endTime) => {

  const domain = {
    name: PROJECT_NAME,
    version: VERSION,
    chainId: CHAIN_ID,
    verifyingContract: verifyingContract
};

// The named list of all type definitions
const types = {
  jobCancellation: [
    {name: "jobId", type: "uint256"},
    {name: "fees", type: "uint256"},
    {name: "startTime", type: "uint256"},
    {name: "endTime", type: "uint256"}
  ]
};

const value = {
  jobId: _jobId,
  fees: _FEES,
  startTime: _startTime,
  endTime: _endTime
};

let signature = signer._signTypedData(domain, types, value);
    return signature;
}

const signJobClaim = async(signer,_jobId,_fees,_startTime,_endTime) => {

  const domain = {
    name: PROJECT_NAME,
    version: VERSION,
    chainId: CHAIN_ID,
    verifyingContract: verifyingContract
};

// The named list of all type definitions
const types = {
  jobClaim: [
    {name: "jobId", type: "uint256"},
    {name: "fees", type: "uint256"},
    {name: "startTime", type: "uint256"},
    {name: "endTime", type: "uint256"}
  ]
};

const value = {
  jobId: _jobId,
  fees: _fees,
  startTime: _startTime,
  endTime: _endTime
};

let signature = signer._signTypedData(domain, types, value);
    return signature;
}

describe("Escrow", function () {
  let escrow, token1, token2;
  let admin, contractor, freelancer, hacker;
  let tx, signature;
  let tokenId;
  let PAYMENT, FEES;
  let startTime, endTime;
  let COUNTER;
  let balance1USDT, balance2USDT;
  let balance1SPAY, balance2SPAY;

  before(async function () {

  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  COUNTER = timestampBefore;

    [admin, contractor, freelancer, feesRegistry, hacker, platformSigner] = await ethers.getSigners();

    let CD = await ethers.getContractFactory("contracts/TEST_ERC20/Token.sol:Token");
    token1 = await CD.deploy("US Dollar Coin", "USDC", "10000000000000000000000000");
    await token1.deployed();
    console.log("token1 Deployed to : ", token1.address);
    await token1.transfer(contractor.address, "100000000000000000000000");

    CD = await ethers.getContractFactory("contracts/TEST_ERC20/Token.sol:Token");
    token2 = await CD.deploy("Safe Pay", "SPAY", "10000000000000000000000000");
    await token2.deployed();
    console.log("token2 Deployed to : ", token2.address);
    await token2.transfer(contractor.address, "100000000000000000000000");

    CD = await ethers.getContractFactory("Escrow");
    escrow = await CD.deploy(platformSigner.address, token1.address, token2.address, feesRegistry.address);
    await escrow.deployed();
    console.log("escrow Deployed to : ", escrow.address);
    verifyingContract = escrow.address;

    

  });

  it("Should create job", async function () {
  console.log(COUNTER);
  jobId = getJobId(contractor.address, COUNTER);
  console.log(jobId);

    [PAYMENT, FEES] = ["10000","500"];
    [startTime, endTime] = [COUNTER, COUNTER+20];

    signature = await signJobCreation(hacker, contractor, jobId, freelancer.address, PAYMENT, FEES, startTime, endTime );

    await truffleAssert.reverts(
      escrow.connect(contractor).initializeJob([jobId, freelancer.address, PAYMENT, FEES, startTime, endTime], signature),
    "VM Exception while processing transaction: reverted with reason string 'Invalid signature'");
    
    signature = await signJobCreation(platformSigner, contractor, jobId, freelancer.address, PAYMENT, FEES, startTime, endTime );

    await truffleAssert.reverts(
      escrow.connect(contractor).initializeJob([jobId, freelancer.address, PAYMENT, FEES, startTime, endTime], signature),
    "VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'");

    await truffleAssert.reverts(
      escrow.connect(hacker).initializeJob([jobId, freelancer.address, PAYMENT, FEES, startTime, endTime], signature),
    "VM Exception while processing transaction: reverted with reason string 'Caller is not owner of job Id'");

    await token1.connect(contractor).approve(escrow.address, ethers.constants.MaxUint256);
    await token2.connect(contractor).approve(escrow.address, ethers.constants.MaxUint256);

    balance1USDT = await token1.balanceOf(contractor.address);
    balance1SPAY = await token2.balanceOf(contractor.address);
    
    tx = await escrow.connect(contractor).initializeJob([jobId, freelancer.address, PAYMENT, FEES, startTime, endTime], signature);
    await tx.wait(1);

    balance2USDT = await token1.balanceOf(contractor.address);
    assert((balance1USDT -balance2USDT).toString(),PAYMENT);
    balance2SPAY = await token2.balanceOf(contractor.address);
    // console.log("balance1SPAY - balance2SPAY",balance1SPAY," ",balance2SPAY);
    assert((balance1SPAY - balance2SPAY).toString(),FEES);


    await truffleAssert.reverts(
      escrow.connect(contractor).initializeJob([jobId, freelancer.address, PAYMENT, FEES, startTime, endTime], signature),
      "VM Exception while processing transaction: reverted with reason string 'job id exists'"
      );


  });

  it("Should release and claim payment", async function () {

    signature = await signJobClaim(platformSigner, jobId, FEES, startTime, endTime);
    await truffleAssert.reverts(
      escrow.connect(freelancer).claimPayment([jobId,FEES,startTime, endTime], signature),
      "VM");

    let releasePayment = "2000";

    await truffleAssert.reverts(
      escrow.connect(hacker).releasePayment(jobId, releasePayment),
    "VM Exception while processing transaction: reverted with reason string 'Caller is not owner of job Id'");

    await truffleAssert.reverts(
      escrow.connect(contractor).releasePayment(jobId, releasePayment*10),
    "VM Exception while processing transaction: reverted with reason string 'Payment release exceeds job payment'");

    await truffleAssert.reverts(
      escrow.connect(admin).releasePayment(jobId, releasePayment),
    "VM Exception while processing transaction: reverted with reason string 'Caller is not owner of job Id'");

    await escrow.connect(contractor).releasePayment(jobId, releasePayment);

    await truffleAssert.reverts(
      escrow.connect(freelancer).claimPayment([jobId,FEES,startTime, endTime], signature),
    "VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds balance'");

    await token1.transfer(freelancer.address, "100000000000000000000000");
    await token2.transfer(freelancer.address, "100000000000000000000000");

    await truffleAssert.reverts(
      escrow.connect(freelancer).claimPayment([jobId,FEES,startTime, endTime], signature),
      "VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'");

    await token1.connect(freelancer).approve(escrow.address, ethers.constants.MaxUint256);
    await token2.connect(freelancer).approve(escrow.address, ethers.constants.MaxUint256);

    balance1USDT = await token1.balanceOf(freelancer.address);
    await escrow.connect(freelancer).claimPayment([jobId,FEES,startTime, endTime], signature);
    balance2USDT = await token1.balanceOf(freelancer.address);
    assert((balance1USDT - balance2USDT).toString(),releasePayment);

    for(let i = 0; i<4; i++){
      await escrow.connect(contractor).releasePayment(jobId, releasePayment);
    }

    await truffleAssert.reverts( 
      escrow.connect(contractor).releasePayment(jobId, releasePayment),
    "VM Exception while processing transaction: reverted with reason string 'Job already complete'");

    await truffleAssert.reverts(
       escrow.connect(contractor).releasePayment(jobId, releasePayment),
       "VM Exception while processing transaction: reverted with reason string 'Job already complete'");

    balance1SPAY = await token2.balanceOf(freelancer.address);
    tx = await escrow.connect(freelancer).claimPayment([jobId, FEES,startTime, endTime], signature);
    await tx.wait(1);
    balance2SPAY = await token2.balanceOf(freelancer.address);
    assert((balance1SPAY - balance2SPAY).toString(),FEES);

    await truffleAssert.reverts(
      escrow.connect(freelancer).claimPayment([jobId,FEES,startTime, endTime], signature),
      "VM Exception while processing transaction: reverted with reason string 'Nothing left to claim'");

  });

  it("Should cancel job", async function () {
    jobId = getJobId(contractor.address, COUNTER+1);

    [PAYMENT, FEES] = ["10000","500"];
    [startTime, endTime] = [COUNTER, COUNTER+50];
    
    signature = await signJobCreation(platformSigner, contractor, jobId, freelancer.address, PAYMENT, FEES, startTime, endTime );
    tx = await escrow.connect(contractor).initializeJob([jobId, freelancer.address, PAYMENT, FEES, startTime, endTime], signature);
    await tx.wait(1);
    
    signature = await signJobCancellation(platformSigner, jobId, FEES, startTime, endTime );

    //admin cannot cancel job
    await truffleAssert.reverts(
      escrow.connect(admin).cancelJob([jobId,FEES,startTime, endTime], signature),
      "VM Exception while processing transaction: reverted with reason string 'Caller is not owner of job Id'"); 

    //hacker cannot cancel job
    await truffleAssert.reverts(
      escrow.connect(hacker).cancelJob([jobId,FEES,startTime, endTime], signature),
      "VM Exception while processing transaction: reverted with reason string 'Caller is not owner of job Id'"); 

      //contractor cannot cancel without admin cancellation
    await truffleAssert.reverts(
      escrow.connect(contractor).cancelJob([jobId,FEES,startTime, endTime], signature),
      "VM Exception while processing transaction: reverted with reason string 'Not cancelled by admin'"); 

    await escrow.connect(admin).cancelJobAdmin(jobId);

    await truffleAssert.reverts(
      escrow.connect(hacker).cancelJob([jobId,FEES,startTime, endTime], signature),
    "VM Exception while processing transaction: reverted with reason string 'Caller is not owner of job Id'");


    let releasePayment = "2000";
    await escrow.connect(contractor).releasePayment(jobId, releasePayment);
    balance1USDT = await token1.balanceOf(freelancer.address);

    let claimsignature = await signJobClaim(platformSigner,jobId,FEES, startTime, endTime );
    await escrow.connect(freelancer).claimPayment([jobId,FEES,startTime, endTime], claimsignature);
    balance2USDT = await token1.balanceOf(freelancer.address);
    assert((balance2USDT-balance1USDT).toString(),releasePayment);


    balance1USDT = await token1.balanceOf(contractor.address);
    let balance1USDT_escrow = await token1.balanceOf(contractor.address);
    await escrow.connect(contractor).cancelJob([jobId,FEES,startTime, endTime], signature);
    let balance2USDT_escrow = await token1.balanceOf(contractor.address);
    balance2USDT = await token1.balanceOf(contractor.address);
    assert((balance2USDT-balance1USDT).toString(), PAYMENT - releasePayment);
    assert((balance1USDT_escrow-balance2USDT_escrow).toString(), PAYMENT - releasePayment);

    await truffleAssert.reverts(
      escrow.connect(contractor).cancelJob([jobId,FEES,startTime, endTime], signature),
      "VM Exception while processing transaction: reverted with reason string 'Job already complete'");
  
  });

  it("Time based test", async function () {
    jobId = getJobId(contractor.address, COUNTER+2);

    [PAYMENT, FEES] = ["10000","500"];
    [startTime, endTime] = [COUNTER, COUNTER+50];
    
    signature = await signJobCreation(platformSigner, contractor, jobId, freelancer.address, PAYMENT, FEES, startTime, endTime );

    await ethers.provider.send('evm_mine', [COUNTER+ 50]);

    await truffleAssert.reverts(
      escrow.connect(contractor).initializeJob([jobId, freelancer.address, PAYMENT, FEES, startTime, endTime], signature),
      "VM Exception while processing transaction: reverted with reason string 'Invalid Job Creation time'");



      jobId = getJobId(contractor.address, COUNTER+3);

      [PAYMENT, FEES] = ["10000","500"];
      [startTime, endTime] = [COUNTER+50, COUNTER+100];
      
      signature = await signJobCreation(platformSigner, contractor, jobId, freelancer.address, PAYMENT, FEES, startTime, endTime );
      await escrow.connect(contractor).initializeJob([jobId, freelancer.address, PAYMENT, FEES, startTime, endTime], signature);

      await escrow.connect(admin).cancelJobAdmin(jobId);

      signature = await signJobCancellation(platformSigner, jobId, FEES, startTime, endTime);

      await ethers.provider.send('evm_mine', [COUNTER+ 100]);

      await truffleAssert.reverts(
        escrow.connect(contractor).cancelJob([jobId,FEES,startTime, endTime], signature),
      "VM Exception while processing transaction: reverted with reason string 'Invalid Job Cancellation time'");
  });

});
