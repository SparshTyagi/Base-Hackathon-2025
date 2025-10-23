import { Contract } from "ethers";
export type Address = `0x${string}`;
export type JarConfig = {
    rpcUrl: string;
    contract: Address;
};
/** Get a read-only contract */
export declare function getJarReader(cfg: JarConfig): Contract;
/** Get a signer-bound contract (tx capable) */
export declare function getJarSigner(cfg: JarConfig, privKey: string): Contract;
/** Read the current on-chain state relevant to a user */
export declare function readState(cfg: JarConfig, user: Address): Promise<{
    bondWei: bigint;
    bondEth: string;
    potWei: bigint;
    potEth: string;
    nonce: number;
}>;
/** Deposit into user's bond (ETH). Returns tx hash. */
export declare function depositBond(cfg: JarConfig, privKey: string, amountEth: string): Promise<{
    hash: any;
    block: any;
}>;
/** Withdraw from user's bond (ETH). Returns tx hash. */
export declare function withdrawBond(cfg: JarConfig, privKey: string, amountEth: string): Promise<{
    hash: any;
    block: any;
}>;
/**
 * Build calldata for multisig pot withdrawal.
 * The Safe (multisig) must be the `safe` address set in the contract; this function
 * only returns {to, value, data} for a standard CALL.
 */
export declare function buildWithdrawPotCalldata(cfg: JarConfig, to: Address, amountEth: string): {
    to: Address;
    value: bigint;
    data: string;
    operation: number;
};
/** Utility: validate addresses at the edge (simple check) */
export declare function isAddress(addr: string): addr is Address;
