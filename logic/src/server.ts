import Fastify from "fastify";
import dotenv from "dotenv";
import {
  readState,
  depositBond,
  withdrawBond,
  buildWithdrawPotCalldata,
  isAddress,
  type JarConfig
} from "./jar.js";

dotenv.config();

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "8080", 10);

const cfg: JarConfig = {
  rpcUrl: process.env.RPC_URL || "https://sepolia.base.org",
  contract: (process.env.CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`
};

const DEFAULT_KEY = process.env.DEFAULT_PRIVATE_KEY; // optional: used by /deposit and /withdraw if present

app.get("/health", async () => ({
  ok: true,
  rpcUrl: cfg.rpcUrl,
  contract: cfg.contract
}));

app.get("/state", async (req, res) => {
  const user = (req.query as any).user as string;
  if (!user || !isAddress(user)) return res.status(400).send({ ok: false, error: "invalid 'user' address" });
  const state = await readState(cfg, user as `0x${string}`);
  return { ok: true, state };
});

app.post("/deposit", async (req, res) => {
  if (!DEFAULT_KEY) return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
  const { amountEth } = req.body as any;
  if (!amountEth) return res.status(400).send({ ok: false, error: "amountEth required" });
  const rcpt = await depositBond(cfg, DEFAULT_KEY, String(amountEth));
  return { ok: true, tx: rcpt };
});

app.post("/withdraw", async (req, res) => {
  if (!DEFAULT_KEY) return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
  const { amountEth } = req.body as any;
  if (!amountEth) return res.status(400).send({ ok: false, error: "amountEth required" });
  const rcpt = await withdrawBond(cfg, DEFAULT_KEY, String(amountEth));
  return { ok: true, tx: rcpt };
});

app.post("/build-withdraw", async (req, res) => {
  const { to, amountEth } = req.body as any;
  if (!to || !isAddress(String(to))) return res.status(400).send({ ok: false, error: "invalid 'to' address" });
  if (!amountEth) return res.status(400).send({ ok: false, error: "amountEth required" });
  const call = buildWithdrawPotCalldata(cfg, to as `0x${string}`, String(amountEth));
  return { ok: true, call };
});

app.listen({ port: PORT, host: "0.0.0.0" }).catch((e) => {
  console.error(e);
  process.exit(1);
});
