# Copilot Instructions for Base-Hackathon-2025

## Project Overview
- This project implements a blockchain-integrated "Swear Jar" service using TypeScript, Fastify, and Ethers.js.
- The main logic is in `logic/`, with a Fastify server (`src/server.ts`) exposing HTTP endpoints to interact with an on-chain contract (see `src/abi/SwearJar.ts`).
- The service is containerized with Docker and can be orchestrated via Docker Compose.

## Key Components
- **src/server.ts**: Fastify API server. Endpoints:
  - `GET /health`: Service health and config
  - `GET /state?user=0x...`: Query on-chain state for a user
  - `POST /deposit`: Deposit bond (requires `DEFAULT_PRIVATE_KEY`)
  - `POST /withdraw`: Withdraw bond (requires `DEFAULT_PRIVATE_KEY`)
  - `POST /build-withdraw`: Build calldata for pot withdrawal
- **src/jar.ts**: Core logic for contract interaction. Use `getJarReader` for read-only, `getJarSigner` for txs.
- **src/abi/SwearJar.ts**: Contract ABI. Update here if contract changes.

## Developer Workflows
- **Build**: `npm run build` (outputs to `dist/`)
- **Run (local)**: `npm start` (expects built files in `dist/`)
- **Docker**: Use `docker-compose up` in `logic/` to build and run the service.
- **Environment**: Set `.env` in `logic/` with `RPC_URL`, `CONTRACT_ADDRESS`, and optionally `DEFAULT_PRIVATE_KEY` for tx endpoints.

## Conventions & Patterns
- All contract addresses are typed as ``0x${string}`` for safety.
- All contract calls are wrapped in async functions; errors are returned as `{ ok: false, error: ... }` in API responses.
- Only the endpoints `/deposit` and `/withdraw` require a private key; others are read-only or build calldata.
- TypeScript strict mode is enforced.

## Integration Points
- Relies on an EVM-compatible RPC endpoint (Base Sepolia by default).
- Expects a deployed SwearJar contract matching the ABI in `src/abi/SwearJar.ts`.
- Uses Fastify for HTTP, Ethers.js for blockchain interaction.

## Examples
- To query a user's state: `GET /state?user=0xabc...`
- To deposit: `POST /deposit` with `{ "amountEth": "0.1" }` in body and `DEFAULT_PRIVATE_KEY` set in `.env`.

## See Also
- `logic/package.json` for scripts and dependencies
- `logic/Dockerfile` and `logic/docker-compose.yml` for containerization
- `logic/tsconfig.json` for TypeScript config

---
_If you update endpoints, contract ABI, or environment variables, update this file to keep AI agents productive._
