
const hre = require("hardhat");

async function main() {

  const USDT = await hre.ethers.getContractFactory("TetherToken");
  // const usdt = await USDT.deploy("1000000000", "US Dollar Token", "USDT", 2); // 0xf43A1f60BD18935469DC571accda81D03795393B
  const usdt = await USDT.attach("0xf43A1f60BD18935469DC571accda81D03795393B"); 
  await usdt.deployed();
  // console.log("usdt deployed to:", usdt.address);

  // await usdt.issue("10000000");
  // await usdt.transfer("0x60C1F061B4fd365389dEFa3596FfFC8749D83b3B","1000000");
  await usdt.approve("0x104885e03B4d1003Cda40a79541362553378eA5F","1000000");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
