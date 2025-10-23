export const SwearJarABI = [
    // read
    { "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "bonds", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "potBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "nonces", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getBond", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "getPotBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getNonce", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function" },
    // write
    { "inputs": [], "name": "depositBond", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "withdrawBond", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [
            { "internalType": "address", "name": "user", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "applyPenalty", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [
            { "internalType": "address payable", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "withdrawPot", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];
