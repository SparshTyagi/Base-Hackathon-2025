import { Contract, JsonRpcProvider, Wallet, parseEther, formatEther, Interface, ZeroAddress } from "ethers";
import { SwearJarABI } from "./abi/SwearJar.js";

export type Address = `0x${string}`;

export type JarConfig = {
  rpcUrl: string;
  contract: Address;
};

/** Get a read-only contract */
export function getJarReader(cfg: JarConfig) {
  const provider = new JsonRpcProvider(cfg.rpcUrl);
  return new Contract(cfg.contract, SwearJarABI, provider);
}

/** Get a signer-bound contract (tx capable) */
export function getJarSigner(cfg: JarConfig, privKey: string) {
  const provider = new JsonRpcProvider(cfg.rpcUrl);
  const signer = new Wallet(privKey, provider);
  return new Contract(cfg.contract, SwearJarABI, signer);
}

/** Read the current on-chain state relevant to a user */
export async function readState(cfg: JarConfig, user: Address) {
  const jar = getJarReader(cfg);
  const [bondWei, potWei, nonce] = await Promise.all([
    jar.getBond(user) as Promise<bigint>,
    jar.getPotBalance() as Promise<bigint>,
    jar.getNonce(user) as Promise<bigint>,
  ]);
  return {
    bondWei,
    bondEth: formatEther(bondWei),
    potWei,
    potEth: formatEther(potWei),
    nonce: Number(nonce),
  };
}

/** Deposit into user's bond (ETH). Returns tx hash. */
export async function depositBond(cfg: JarConfig, privKey: string, amountEth: string) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.depositBond({ value: parseEther(amountEth) });
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

/** Withdraw from user's bond (ETH). Returns tx hash. */
export async function withdrawBond(cfg: JarConfig, privKey: string, amountEth: string) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.withdrawBond(parseEther(amountEth));
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

/**
 * Build calldata for multisig pot withdrawal.
 * The Safe (multisig) must be the `safe` address set in the contract; this function
 * only returns {to, value, data} for a standard CALL.
 */
export function buildWithdrawPotCalldata(cfg: JarConfig, to: Address, amountEth: string) {
  const iface = new Interface(SwearJarABI);
  const data = iface.encodeFunctionData("withdrawPot", [to, parseEther(amountEth)]);
  return {
    to: cfg.contract as Address,
    value: 0n,                 // the call sends no native ETH along; contract transfers internally
    data,                      // feed this into your Safe tx builder / UI
    operation: 0               // 0 = CALL (for Safe UIs/SDKs)
  };
}

// ============ GROUP-SPECIFIC FUNCTIONS ============

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
export async function createGroup(
  cfg: JarConfig, 
  privKey: string, 
  name: string, 
  targetAmountEth: string, 
  durationDays: number
) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.createGroup(name, parseEther(targetAmountEth), durationDays);
  const rcpt = await tx.wait();
  
  // Extract group ID from events
  const event = rcpt.logs.find((log: any) => {
    try {
      const parsed = jar.interface.parseLog(log);
      return parsed?.name === 'GroupCreated';
    } catch {
      return false;
    }
  });
  
  const groupId = event ? jar.interface.parseLog(event)?.args[0] : null;
  
  return { 
    hash: tx.hash, 
    block: rcpt.blockNumber, 
    groupId: groupId?.toString() 
  };
}

/** Join a group with bond deposit */
export async function joinGroup(
  cfg: JarConfig, 
  privKey: string, 
  groupId: string, 
  bondAmountEth: string
) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.joinGroup(groupId, { value: parseEther(bondAmountEth) });
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

/** Leave a group and withdraw bond */
export async function leaveGroup(cfg: JarConfig, privKey: string, groupId: string) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.leaveGroup(groupId);
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

/** Deposit additional bond to group */
export async function depositBondToGroup(
  cfg: JarConfig, 
  privKey: string, 
  groupId: string, 
  amountEth: string
) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.depositBondToGroup(groupId, { value: parseEther(amountEth) });
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

/** Withdraw bond from group */
export async function withdrawBondFromGroup(
  cfg: JarConfig, 
  privKey: string, 
  groupId: string, 
  amountEth: string
) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.withdrawBondFromGroup(groupId, parseEther(amountEth));
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

/** Apply penalty to group member (owner only) */
export async function applyPenaltyToGroup(
  cfg: JarConfig, 
  privKey: string, 
  groupId: string, 
  user: Address, 
  amountEth: string
) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.applyPenaltyToGroup(groupId, user, parseEther(amountEth));
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

/** Withdraw from group pot (owner only) */
export async function withdrawGroupPot(
  cfg: JarConfig, 
  privKey: string, 
  groupId: string, 
  to: Address, 
  amountEth: string
) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.withdrawGroupPot(groupId, to, parseEther(amountEth));
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

/** Distribute group pot equally among members (owner only) */
export async function distributeGroupPot(cfg: JarConfig, privKey: string, groupId: string) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.distributeGroupPot(groupId);
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

/** Deactivate group (creator or owner only) */
export async function deactivateGroup(cfg: JarConfig, privKey: string, groupId: string) {
  const jar = getJarSigner(cfg, privKey);
  const tx = await jar.deactivateGroup(groupId);
  const rcpt = await tx.wait();
  return { hash: tx.hash, block: rcpt.blockNumber };
}

// ============ GROUP VIEW FUNCTIONS ============

/** Get group information */
export async function getGroup(cfg: JarConfig, groupId: string): Promise<GroupInfo> {
  const jar = getJarReader(cfg);
  const group = await jar.getGroup(groupId);
  return {
    id: group.id,
    name: group.name,
    creator: group.creator,
    targetAmount: group.targetAmount,
    potBalance: group.potBalance,
    memberCount: group.memberCount,
    isActive: group.isActive,
    createdAt: group.createdAt,
    expiresAt: group.expiresAt
  };
}

/** Get group member information */
export async function getGroupMember(cfg: JarConfig, groupId: string, member: Address): Promise<MemberInfo> {
  const jar = getJarReader(cfg);
  const memberInfo = await jar.getGroupMember(groupId, member);
  return {
    wallet: memberInfo.wallet,
    bondAmount: memberInfo.bondAmount,
    isActive: memberInfo.isActive,
    joinedAt: memberInfo.joinedAt
  };
}

/** Get group pot balance */
export async function getGroupPotBalance(cfg: JarConfig, groupId: string): Promise<bigint> {
  const jar = getJarReader(cfg);
  return await jar.getGroupPotBalance(groupId);
}

/** Get member's bond in group */
export async function getGroupBond(cfg: JarConfig, groupId: string, member: Address): Promise<bigint> {
  const jar = getJarReader(cfg);
  return await jar.getGroupBond(groupId, member);
}

/** Get group member list */
export async function getGroupMembers(cfg: JarConfig, groupId: string): Promise<Address[]> {
  const jar = getJarReader(cfg);
  return await jar.getGroupMembers(groupId);
}

/** Get user's groups */
export async function getUserGroups(cfg: JarConfig, user: Address): Promise<string[]> {
  const jar = getJarReader(cfg);
  return await jar.getUserGroups(user);
}

/** Check if user is member of group */
export async function isGroupMember(cfg: JarConfig, groupId: string, user: Address): Promise<boolean> {
  const jar = getJarReader(cfg);
  return await jar.isGroupMember(groupId, user);
}

/** Get group member count */
export async function getGroupMemberCount(cfg: JarConfig, groupId: string): Promise<number> {
  const jar = getJarReader(cfg);
  const count = await jar.getGroupMemberCount(groupId);
  return Number(count);
}

/** Check if group has reached target */
export async function hasGroupReachedTarget(cfg: JarConfig, groupId: string): Promise<boolean> {
  const jar = getJarReader(cfg);
  return await jar.hasGroupReachedTarget(groupId);
}

/** Get group progress percentage */
export async function getGroupProgress(cfg: JarConfig, groupId: string): Promise<number> {
  const jar = getJarReader(cfg);
  const progress = await jar.getGroupProgress(groupId);
  return Number(progress);
}

/** Get all group IDs */
export async function getAllGroupIds(cfg: JarConfig): Promise<string[]> {
  const jar = getJarReader(cfg);
  return await jar.getAllGroupIds();
}

/** Utility: validate addresses at the edge (simple check) */
export function isAddress(addr: string): addr is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(addr) && addr !== ZeroAddress;
}
