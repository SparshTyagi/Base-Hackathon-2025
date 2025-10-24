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
export type GroupInfo = {
    id: string;
    name: string;
    creator: Address;
    targetAmount: bigint;
    potBalance: bigint;
    memberCount: bigint;
    isActive: boolean;
    createdAt: bigint;
    expiresAt: bigint;
};
export type MemberInfo = {
    wallet: Address;
    bondAmount: bigint;
    isActive: boolean;
    joinedAt: bigint;
};
/** Create a new group */
export declare function createGroup(cfg: JarConfig, privKey: string, name: string, targetAmountEth: string, durationDays: number): Promise<{
    hash: any;
    block: any;
    groupId: any;
}>;
/** Join a group with bond deposit */
export declare function joinGroup(cfg: JarConfig, privKey: string, groupId: string, bondAmountEth: string): Promise<{
    hash: any;
    block: any;
}>;
/** Leave a group and withdraw bond */
export declare function leaveGroup(cfg: JarConfig, privKey: string, groupId: string): Promise<{
    hash: any;
    block: any;
}>;
/** Deposit additional bond to group */
export declare function depositBondToGroup(cfg: JarConfig, privKey: string, groupId: string, amountEth: string): Promise<{
    hash: any;
    block: any;
}>;
/** Withdraw bond from group */
export declare function withdrawBondFromGroup(cfg: JarConfig, privKey: string, groupId: string, amountEth: string): Promise<{
    hash: any;
    block: any;
}>;
/** Apply penalty to group member (owner only) */
export declare function applyPenaltyToGroup(cfg: JarConfig, privKey: string, groupId: string, user: Address, amountEth: string): Promise<{
    hash: any;
    block: any;
}>;
/** Withdraw from group pot (owner only) */
export declare function withdrawGroupPot(cfg: JarConfig, privKey: string, groupId: string, to: Address, amountEth: string): Promise<{
    hash: any;
    block: any;
}>;
/** Distribute group pot equally among members (owner only) */
export declare function distributeGroupPot(cfg: JarConfig, privKey: string, groupId: string): Promise<{
    hash: any;
    block: any;
}>;
/** Deactivate group (creator or owner only) */
export declare function deactivateGroup(cfg: JarConfig, privKey: string, groupId: string): Promise<{
    hash: any;
    block: any;
}>;
/** Get group information */
export declare function getGroup(cfg: JarConfig, groupId: string): Promise<GroupInfo>;
/** Get group member information */
export declare function getGroupMember(cfg: JarConfig, groupId: string, member: Address): Promise<MemberInfo>;
/** Get group pot balance */
export declare function getGroupPotBalance(cfg: JarConfig, groupId: string): Promise<bigint>;
/** Get member's bond in group */
export declare function getGroupBond(cfg: JarConfig, groupId: string, member: Address): Promise<bigint>;
/** Get group member list */
export declare function getGroupMembers(cfg: JarConfig, groupId: string): Promise<Address[]>;
/** Get user's groups */
export declare function getUserGroups(cfg: JarConfig, user: Address): Promise<string[]>;
/** Check if user is member of group */
export declare function isGroupMember(cfg: JarConfig, groupId: string, user: Address): Promise<boolean>;
/** Get group member count */
export declare function getGroupMemberCount(cfg: JarConfig, groupId: string): Promise<number>;
/** Check if group has reached target */
export declare function hasGroupReachedTarget(cfg: JarConfig, groupId: string): Promise<boolean>;
/** Get group progress percentage */
export declare function getGroupProgress(cfg: JarConfig, groupId: string): Promise<number>;
/** Get all group IDs */
export declare function getAllGroupIds(cfg: JarConfig): Promise<string[]>;
/** Utility: validate addresses at the edge (simple check) */
export declare function isAddress(addr: string): addr is Address;
