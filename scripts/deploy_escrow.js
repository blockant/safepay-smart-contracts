
const hre = require("hardhat");

async function main() {
  const registry = "0x23F7F82Eb917A49a722E970580Ee138Af5f71D74";
  const USDT = "0x0D464eC55324128b5ea64c09A281E42974E095b0";
  const SPAY = "0x65F1cC9855DE82B9F3777cE78Cc648bfba86FD06";
  const platformSigner = "0xc0A0aEa4f8457Caa8C47ED5B5DA410E40EFCbf3c";

  const Job = await hre.ethers.getContractFactory("Escrow"); // 0x104885e03B4d1003Cda40a79541362553378eA5F
  const job = await Job.deploy(registry, USDT, SPAY, platformSigner);
  // const job = await Job.attach("0x104885e03B4d1003Cda40a79541362553378eA5F");


  await job.deployed();

  console.log("job deployed to:", job.address);

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
