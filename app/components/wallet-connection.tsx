import React from 'react';
import { Button } from './button';

interface WalletConnectionProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  connected: boolean;
  userAddress?: string;
}

export function WalletConnection({ 
  onConnect, 
  onDisconnect, 
  connected, 
  userAddress 
}: WalletConnectionProps) {
  const handleConnect = () => {
    // Simulate wallet connection with a mock address
    const mockAddress = "0x4BC146E7e24554e5Cea5c4d15Cb0aEA26D5F43A3";
    onConnect(mockAddress);
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  if (connected && userAddress) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
        </span>
        <Button variant="secondary" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button variant="primary" onClick={handleConnect}>
      Connect Wallet
    </Button>
  );
}
