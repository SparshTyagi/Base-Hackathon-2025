'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setResult(data);
    } catch (error) {
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
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">SwearJar API Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testHealth}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Health Endpoint'}
          </button>
          
          <button
            onClick={testCreateGroup}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Create Group'}
          </button>
        </div>

        {result && (
          <div className="mt-8 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
