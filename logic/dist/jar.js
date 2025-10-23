import { Contract, JsonRpcProvider, Wallet, parseEther, formatEther, Interface, ZeroAddress } from "ethers";
import { SwearJarABI } from "./abi/SwearJar.js";
/** Get a read-only contract */
export function getJarReader(cfg) {
    const provider = new JsonRpcProvider(cfg.rpcUrl);
    return new Contract(cfg.contract, SwearJarABI, provider);
}
/** Get a signer-bound contract (tx capable) */
export function getJarSigner(cfg, privKey) {
    const provider = new JsonRpcProvider(cfg.rpcUrl);
    const signer = new Wallet(privKey, provider);
    return new Contract(cfg.contract, SwearJarABI, signer);
}
/** Read the current on-chain state relevant to a user */
export async function readState(cfg, user) {
    const jar = getJarReader(cfg);
    const [bondWei, potWei, nonce] = await Promise.all([
        jar.bond(user),
        jar.potBalance(),
        jar.nonces(user),
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
export async function depositBond(cfg, privKey, amountEth) {
    const jar = getJarSigner(cfg, privKey);
    const tx = await jar.depositBond({ value: parseEther(amountEth) });
    const rcpt = await tx.wait();
    return { hash: tx.hash, block: rcpt.blockNumber };
}
/** Withdraw from user's bond (ETH). Returns tx hash. */
export async function withdrawBond(cfg, privKey, amountEth) {
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
export function buildWithdrawPotCalldata(cfg, to, amountEth) {
    const iface = new Interface(SwearJarABI);
    const data = iface.encodeFunctionData("withdrawPot", [to, parseEther(amountEth)]);
    return {
        to: cfg.contract,
        value: 0n, // the call sends no native ETH along; contract transfers internally
        data, // feed this into your Safe tx builder / UI
        operation: 0 // 0 = CALL (for Safe UIs/SDKs)
    };
}
/** Utility: validate addresses at the edge (simple check) */
export function isAddress(addr) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr) && addr !== ZeroAddress;
}
