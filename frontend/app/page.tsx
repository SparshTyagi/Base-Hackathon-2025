'use client';

import { useState } from 'react';

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const testCreateGroup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Group',
          targetAmountEth: '1.0',
          durationDays: 7
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🐷 SwearJar Base Mini App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Group Accountability on Base Network
          </p>
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-8">
            <strong>Contract:</strong> 0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9<br/>
            <strong>Network:</strong> Base Sepolia
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">API Testing</h2>
            <div className="space-y-4">
              <button
                onClick={testHealth}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Health Endpoint'}
              </button>
              
              <button
                onClick={testCreateGroup}
                disabled={loading}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Create Group'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="space-y-2 text-gray-600">
              <li>✅ Group-specific accountability</li>
              <li>✅ Bond deposits and penalties</li>
              <li>✅ Farcaster integration</li>
              <li>✅ Real-time notifications</li>
              <li>✅ Base Mini App ready</li>
            </ul>
          </div>
        </div>

        {result && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Response:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">1. Deploy to Vercel</h3>
              <p className="text-gray-600">Deploy this frontend to Vercel for Base Mini App</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">2. Connect Wallet</h3>
              <p className="text-gray-600">Integrate Base Smart Wallet for transactions</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">3. Monitor Violations</h3>
              <p className="text-gray-600">Deploy Python agents for Farcaster monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}