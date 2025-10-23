"use client";
import React, { useState } from 'react';
import { Button } from './button';

interface WalletConnectionProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  connected: boolean;
  userAddress?: string;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  onConnect,
  onDisconnect,
  connected,
  userAddress
}) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      // For Base miniapp, this would integrate with OnchainKit
      // For now, we'll simulate a connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      onConnect("0x1234567890123456789012345678901234567890");
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  if (connected && userAddress) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">
          {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
        </div>
        <Button variant="secondary" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="primary" 
      onClick={handleConnect}
      disabled={loading}
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};
