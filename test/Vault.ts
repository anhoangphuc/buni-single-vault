import chai, { expect, util } from "chai";
import { BigNumber, Contract, utils } from "ethers";
import { solidity  } from "ethereum-waffle";
import { ethers } from "hardhat";
import { expandTo18Decimals, mine, withinRange, domain, signedTypes } from "./util";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


chai.use(solidity);

context('#Vault', async() => {
    let vaultToken: Contract;
    let vaultContract: Contract;
    let vestingPeriod: number;
    let interestRate: number;
    let vaultLimt: BigNumber;
    let admin: SignerWithAddress;
    let account1: SignerWithAddress;
    let account2: SignerWithAddress;
    beforeEach(async() => {
        ([ admin, account1, account2 ] = await ethers.getSigners());

        const MockERC20 = await ethers.getContractFactory("MockERC20", admin);
        vaultToken = await MockERC20.deploy(expandTo18Decimals(1000000));
        await vaultToken.deployed();

        vestingPeriod = 10 * 24 * 60;
        interestRate = 100; // 100%
        vaultLimt = expandTo18Decimals(500);    //500 token


        const Vault = await ethers.getContractFactory("Vault", admin);
        vaultContract = await Vault.deploy( vaultToken.address, vestingPeriod, interestRate, vaultLimt );
        await vaultContract.deployed();

        await vaultToken.connect(admin).transfer(vaultContract.address, vaultLimt.mul(interestRate).div(100));

        await vaultToken.connect(admin).transfer(account1.address, vaultLimt.mul(10));
        await vaultToken.connect(admin).transfer(account2.address, vaultLimt.mul(10));

        await vaultToken.connect(account1).approve(vaultContract.address, vaultLimt.mul(10));
        await vaultToken.connect(account2).approve(vaultContract.address, vaultLimt.mul(10));
    });

    it('Deploy success', async() => {
        expect(vaultContract.address).to.be.properAddress;
    }); 

    context('#Stake correctly', async() => {
        const stakeAmount = expandTo18Decimals(200);
        beforeEach(async() => {
            await vaultContract.connect(account1).stake(stakeAmount);
        });

        it('State variable corrects', async() => {
            const totalSupply = await vaultContract.totalSupply();
            expect(totalSupply).to.be.eq(stakeAmount, "Total Supply is not correct");

            const totalDeposit = await vaultContract.totalDeposit();
            expect(totalDeposit).to.be.eq(stakeAmount, "Total Deposit is not correct");

            const userBlanace = await vaultContract.balanceOf(account1.address);
            expect(userBlanace).to.be.eq(stakeAmount, "User balance is not correct");
        });

        it('UserVault infor correct', async() => {
            const userVaultInfos = await vaultContract.getUserVaultInfo(account1.address);
            expect(userVaultInfos.length).to.be.eq(1);

            expect(userVaultInfos[0].amount).to.be.eq(stakeAmount);
            expect(userVaultInfos[0].vestingPeriodEnds.sub(userVaultInfos[0].depositTime)).to.be.eq(vestingPeriod);
        });

        it('Stake second time', async() => {
            await expect(vaultContract.connect(account1).stake(stakeAmount))
                .to.emit(vaultContract, "Staked")
                .withArgs(account1.address, stakeAmount);
            const userVaultInfos = await vaultContract.getUserVaultInfo(account1.address);
            expect(userVaultInfos.length).to.be.eq(2);
        });

        it('Cannot stake excceds vaultLimt', async() => {
            const availableStake = vaultLimt.sub(stakeAmount);
            await expect(vaultContract.connect(account1).stake(availableStake.add(1)))
                .to.be.revertedWith("vault limit exceeded");
        });
    });

    context('Getreward correctly', async() => {
        const stakeAmount = expandTo18Decimals(200);
        beforeEach(async() => {
            await vaultContract.connect(account1).stake(stakeAmount);
        });

        context('half time passed', async() => {
            beforeEach(async() => {
                await mine(Math.round(vestingPeriod / 2));
            });

            it('Earned function correct', async() => {
                const earned = await vaultContract.earned(account1.address);
                const expectEarned = stakeAmount.mul(100 + interestRate).div(100).div(2);
                expect(withinRange(earned, expectEarned));
            });

            it('Claim correct', async() => {
                await vaultToken.connect(account1).burn();
                const earned = stakeAmount.mul(100 + interestRate).div(100).div(2);
                await vaultContract.connect(account1).claim();
                const newBalance = await vaultToken.balanceOf(account1.address);
                expect(withinRange(newBalance, earned));
            })
        });
        
        context('all time passed', async() => {
            beforeEach(async() => {
                await mine(vestingPeriod + 1000);
            });

            it('Earned function correct', async() => {
                const earned = await vaultContract.earned(account1.address);
                const expectEarned = stakeAmount.mul(100 + interestRate).div(100);
                expect(withinRange(earned, expectEarned));
            });

            it('Claim correct', async() => {
                await vaultToken.connect(account1).burn();
                const earned = stakeAmount.mul(100 + interestRate).div(100);
                await expect(vaultContract.connect(account1).claim())
                    .to.emit(vaultContract, "Claimed");
                const newBalance = await vaultToken.balanceOf(account1.address);
                expect(newBalance).to.be.eq(earned);
            })
        });
    });

    context('#Meta transaction', async() => {
        it('Execute stake function', async() => {
            const stakeAmount = expandTo18Decimals(1);
            const nonce = await vaultContract.getNonce(account1.address);
            const descr = new utils.Interface(
                ["function stake(uint256)"]
            );
            const sighash = descr.getSighash("stake(uint256)");
            const functionSignature = ethers.utils.solidityPack(
                    ["bytes4", "uint256"],
                    [sighash, stakeAmount]
                )
            const value = {
                nonce: nonce,
                from: account1.address,
                functionSignature: functionSignature
            }
            
            const signature = (await account1._signTypedData(
                domain(vaultContract.address), signedTypes, value
            )).slice(2);
            const r = '0x' + signature.slice(0, 64);
            const s = '0x' + signature.slice(64, 128);
            const v = '0x' + signature.slice(128);

            await expect(vaultContract
                .executeMetaTransaction(account1.address, functionSignature, r, s, v))
                .to.be.emit(vaultContract, "Staked")
                .withArgs(account1.address, stakeAmount);
            
            const accountBalance = await vaultContract.balanceOf(account1.address);
            expect(accountBalance).to.be.eq(stakeAmount);
        });
    });

})
