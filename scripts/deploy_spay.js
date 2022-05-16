
const hre = require("hardhat");

async function main() {
  let [owner, contractor, freelancer] = await ethers.getSigners();

  const ESCROW = "0x195B38A9E8CFBc0f1bC9A25Df4aE624AB95BE785";
  const SPAY = await hre.ethers.getContractFactory("Token");
  const SPAY_ADD = "0x65F1cC9855DE82B9F3777cE78Cc648bfba86FD06";

  // const spay = await SPAY.deploy("SafePay", "SPAY", "10000000000000"); // 0xf43A1f60BD18935469DC571accda81D03795393B
  const spay = await SPAY.attach(SPAY_ADD); 
  // await spay.deployed();
  // console.log("spay deployed to:", spay.address);

  let tx;

  tx = await spay.transfer("0xa018B0fC0426Eda514AA5d1C343CAfaAa11060E0","1000000");
  await tx.wait(1);
  tx =await spay.transfer("0xe8A07fC6F8E546C21807Daecb9e1FE70415871C2","1000000");
  await tx.wait(1);

  tx =await spay.connect(contractor).approve(ESCROW,"1000000");
  await tx.wait(1);
  tx =await spay.connect(freelancer).approve(ESCROW,"1000000");
  await tx.wait(1);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
