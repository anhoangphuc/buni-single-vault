import chai, { expect } from "chai";
import { Contract } from "ethers";
import { solidity  } from "ethereum-waffle";
import { ethers } from "hardhat";
import { expandTo18Decimals } from "./util";


chai.use(solidity);

context('#Vault', async() => {
    let vaultToken: Contract;
    let vaultContract: Contract;
    let vestingPeriod: number;
    let interestRate: number;
    let vaultLimt: number;
    beforeEach(async() => {
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        vaultToken = await MockERC20.deploy(expandTo18Decimals(1000000));
        await vaultToken.deployed();

        vestingPeriod = 10 * 24 * 60;
        interestRate = 100; // 100%
        vaultLimt = 500;    //500 token

        const Vault = await ethers.getContractFactory("Vault");
        vaultContract = await Vault.deploy( vaultToken.address, vestingPeriod, interestRate, vaultLimt );
        await vaultContract.deployed();
    });

    it('Deploy success', async() => {
        expect(vaultContract.address).to.be.properAddress;
    })
})