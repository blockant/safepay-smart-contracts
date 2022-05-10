
const hre = require("hardhat");

async function main() {

  const Job = await hre.ethers.getContractFactory("Escrow"); // 0x104885e03B4d1003Cda40a79541362553378eA5F
  // const job = await Job.deploy();
  const job = await Job.attach("0x104885e03B4d1003Cda40a79541362553378eA5F");


  // await job.deployed();

  // console.log("job deployed to:", job.address);

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
