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
    jar.bond(user) as Promise<bigint>,
    jar.potBalance() as Promise<bigint>,
    jar.nonces(user) as Promise<bigint>,
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

/** Utility: validate addresses at the edge (simple check) */
export function isAddress(addr: string): addr is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(addr) && addr !== ZeroAddress;
}
