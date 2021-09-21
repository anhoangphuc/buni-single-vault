import { BigNumber } from "ethers";
import { network } from "hardhat";

export function currentTimestamp() {
    return Math.floor(Date.now() / 1000);
}

export async function mine(increasedTime: number) {
    await network.provider.send("evm_increaseTime", [increasedTime]);
    await network.provider.send("evm_mine");
}

export function expandTo18Decimals(x: number): BigNumber {
    return BigNumber.from(x).mul(BigNumber.from(10).pow(18));
}

export function getRelativeNumber(x: BigNumber, percent: number): BigNumber {
    return x.add(x.div(percent));
}

export function withinRange(g: BigNumber, x: BigNumber, perc: number = 10000): boolean {
    return g.gte(x.sub(x.div(perc))) && g.lte(x.add(x.div(perc)));
}