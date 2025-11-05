<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/17e0atqFOwjCj3KgCflSvaM-X9wqdou8s

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key

4. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hafarna03aja-droid/Foto-Video-Creative-suite)

### Manual Deploy
1. Fork/clone this repository
2. Push to your GitHub repository
3. Connect to [Vercel](https://vercel.com)
4. Add environment variable `GEMINI_API_KEY` in Vercel dashboard
5. Deploy automatically

📖 **Detailed deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
