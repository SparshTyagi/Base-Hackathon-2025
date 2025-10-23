# 🚀 Deploy Your Swear Jar Miniapp on Base

## Step 1: Deploy Frontend to Vercel

### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy to Vercel
vercel --prod
```

### Option B: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Import the `frontend` folder as a new project
4. Set build command: `npm run build`
5. Set output directory: `.next`
6. Deploy!

## Step 2: Deploy Backend to Railway/Render

### Option A: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy backend
cd logic
railway deploy
```

### Option B: Render
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your repository
4. Set build command: `cd logic && npm install && npm run build`
5. Set start command: `cd logic && npm start`
6. Deploy!

## Step 3: Update Environment Variables

### Frontend Environment Variables (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_WS_URL=wss://your-backend-url.com/ws
NEXT_PUBLIC_CONTRACT_ADDRESS=0x73183E071A52C76921CcAfB037400BeC1f635E4B
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

### Backend Environment Variables (Railway/Render)
```
RPC_URL=https://sepolia.base.org
CONTRACT_ADDRESS=0x73183E071A52C76921CcAfB037400BeC1f635E4B
PORT=8080
```

## Step 4: Test Your Miniapp

### Local Testing
1. Start backend: `cd logic && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Open: `http://localhost:3000`

### Production Testing
1. Open your deployed frontend URL
2. Test all functionality
3. Verify onchain transactions

## Step 5: Submit to Base Miniapp Directory

### Requirements
- ✅ Deployed frontend with proper manifest
- ✅ Working smart contract on Base
- ✅ Backend API endpoints
- ✅ Miniapp metadata in `/.well-known/farcaster.json`

### Submission Process
1. Go to [Base Miniapp Directory](https://base.org/miniapps)
2. Submit your miniapp with:
   - Frontend URL
   - Smart contract address
   - Description and screenshots
   - Category: Social/Finance

## 🎯 Your Miniapp Features

- ✅ **Smart Contract**: Deployed on Base Sepolia
- ✅ **Frontend**: React/Next.js with beautiful UI
- ✅ **Backend**: Fastify API with real-time updates
- ✅ **Database**: SQLite with group management
- ✅ **Real-time**: WebSocket connections
- ✅ **Consensus**: Voting system for pot distribution

## 🌟 Next Steps

1. **Deploy to production** using the steps above
2. **Test thoroughly** with real transactions
3. **Submit to Base directory** for discovery
4. **Share with friends** and start using!

Your Swear Jar miniapp is ready to help friends stay accountable while saving money together! 🐷💰
