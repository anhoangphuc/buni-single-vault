import { ethers, network } from "hardhat";
import { expandTo18Decimals } from "../test/util";
import { getContracts, saveContract } from "./util";

async function main() {
    const networkName = network.name;
    const addresses = getContracts()[networkName];
    const buniContract = addresses["Buni"];

    const vestingPeriod = 20 * 60;   //20 minutes
    const interestRate = 100;        //Stake 1, get 1
    const vaultLimit = expandTo18Decimals(100);   //Max 5000

    console.log(`Deploying Single VaultContract`)
    const VaultContract = await ethers.getContractFactory("Vault");
    const vaultContract = await VaultContract.deploy( buniContract, vestingPeriod, interestRate, vaultLimit );
    await vaultContract.deployed();

    console.log(`Deployed SingleVaultContract at address ${vaultContract.address}`);
    await saveContract(networkName, 'VaultContract', vaultContract.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
})