// Base Mini App Configuration
// This file contains the configuration for your Base Mini App
// The actual Mini App functionality will be implemented using the manifest and wallet integration

export const minikitConfig = {
  // Base Mini App configuration
  frame: {
    version: '1',
    name: 'Swear Jar - Group Accountability',
    iconUrl: '/icon.png',
    splashImageUrl: '/splash.png',
    splashBackgroundColor: '#0052FF',
    homeUrl: '/',
  },
  
  // Smart wallet configuration
  smartWallet: {
    url: 'https://keys.coinbase.com',
  },
  
  // Network configuration
  networks: {
    base: {
      chainId: 8453,
      rpcUrl: 'https://mainnet.base.org',
    },
    baseSepolia: {
      chainId: 84532,
      rpcUrl: 'https://sepolia.base.org',
    },
  },
  
  // Default network
  defaultNetwork: 'baseSepolia',
};

export default minikitConfig;