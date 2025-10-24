# 🐷 SwearJar - Base Mini App

**Group Accountability on Base Network**

A decentralized accountability system where groups can create shared goals, deposit bonds, and face penalties for rule violations detected via Farcaster monitoring.

## 🎯 **What It Does**

- **Group Creation**: Create accountability groups with shared goals
- **Bond System**: Members deposit ETH bonds that can be penalized
- **Farcaster Monitoring**: AI agents monitor Farcaster posts for rule violations
- **Real-time Notifications**: WebSocket updates for group events
- **Base Mini App**: Native integration with Base ecosystem

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│              Base Mini App (Frontend)                    │
│  - Hosted on Vercel                                     │
│  - /.well-known/farcaster.json manifest                 │
│  - Serverless API routes                                │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│              Smart Contract (Base Sepolia)              │
│  - SwearJar.sol deployed contract                       │
│  - Group-specific pots and bonds                        │
│  - Penalty application and pot distribution             │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│          Farcaster Monitoring Agent (Python)            │
│  - Polls Farcaster casts via Neynar API                │
│  - Rule engine (keyword + LLM)                          │
│  - Detects violations → Posts to backend API           │
└─────────────────────────────────────────────────────────┘
```

## 🚀 **Quick Start**

### **1. Contract (Deployed)**
- **Address**: `0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9`
- **Network**: Base Sepolia (Chain ID: 84532)
- **Explorer**: https://sepolia.basescan.org/address/0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9

### **2. Frontend (Vercel)**
```bash
cd frontend
npm install
npm run build
# Deploy to Vercel
```

### **3. Python Agents (Railway)**
```bash
cd Agents
pip install -r requirements.txt
# Deploy to Railway with cron schedule
```

## 📋 **Deployment Status**

| Component | Status | URL |
|-----------|--------|-----|
| Smart Contract | ✅ Deployed | Base Sepolia |
| Frontend | ✅ Ready | Deploy to Vercel |
| Backend API | ✅ Ready | Serverless functions |
| Python Agents | ⏳ Pending | Deploy to Railway |

## 🔧 **Environment Variables**

### **Frontend (Vercel)**
```bash
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CONTRACT_ADDRESS=0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### **Python Agents (Railway)**
```bash
NEYNAR_API_KEY=your_neynar_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
BACKEND_WEBHOOK_URL=https://your-app.vercel.app/api/violations/webhook
```

## 🧪 **Testing**

### **Local Development**
```bash
cd frontend
npm run dev
# Visit http://localhost:3000/test
```

### **API Endpoints**
- `GET /api/health` - Health check
- `POST /api/groups` - Create group
- `GET /api/groups/[id]` - Get group info
- `POST /api/groups/[id]` - Group operations

## 📁 **Project Structure**

```
├── contracts/
│   └── SwearJar.sol              # Smart contract
├── frontend/                     # Next.js app
│   ├── app/api/                  # Serverless API routes
│   ├── .well-known/              # Base Mini App manifest
│   └── minikit.config.ts         # Mini App configuration
├── logic/                        # Backend logic (unused in Vercel)
├── Agents/                       # Python monitoring agents
│   ├── monitor.py                # Main monitoring logic
│   └── railway.json              # Railway deployment config
└── deployments/                  # Contract deployment info
```

## 🎯 **Key Features**

### **Smart Contract**
- Group-specific pots and bonds
- Penalty application system
- Pot distribution mechanism
- Member management

### **Frontend**
- Base Mini App integration
- Group creation and management
- Real-time notifications
- Wallet connection

### **Python Agents**
- Farcaster cast monitoring
- Rule violation detection
- Webhook integration
- Scheduled execution

## 🚀 **Next Steps**

1. **Deploy Frontend to Vercel**
2. **Deploy Python Agents to Railway**
3. **Configure Base Mini App manifest**
4. **Test complete flow**
5. **Deploy to Base Mainnet**

## 📚 **Documentation**

- **Contract**: See `contracts/SwearJar.sol` for smart contract details
- **API**: See `frontend/app/api/` for serverless function documentation
- **Agents**: See `Agents/` for Python monitoring agent setup

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details

---

**Ready to build accountable communities on Base! 🚀**