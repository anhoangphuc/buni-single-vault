import { BigNumber } from "bignumber.js";
import { BigNumber as BN} from "ethers";
import fs from "fs";
import path from "path/posix";

const parse = require('csv-parse/lib/sync');

export async function saveContract(network: string, contract: string, address: string) {
    const addresses = await getContracts();
    addresses[network] = addresses[network] || {};
    addresses[network][contract] = address;
    fs.writeFileSync(path.join(__dirname, '../data/contract-addresses.json'),
                                JSON.stringify(addresses, null, "    "));
}

export function getContracts(): any {
    let json;
    try {
        json = fs.readFileSync(path.join(__dirname,'../data/contract-addresses.json'), 'utf-8');
    } catch {
        json = '{}';
    }   
    return JSON.parse(json);
}

export function expandTo18Decimals(x: string): BN {
    const temp =  new BigNumber(x).multipliedBy(new BigNumber(10).pow(18));
    return BN.from(temp.toString());
}

export interface AirdropItem {
    account: string,
    hashRate: string
}
export async function getListAirdrop(): Promise<AirdropItem[]> {
    const fileContent = await fs.readFileSync(path.join(__dirname, '../data/list-airdrop.csv'), 'utf-8');
    const records: AirdropItem[] = parse(fileContent, { columns: true });
    return records;
}