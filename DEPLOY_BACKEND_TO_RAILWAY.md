# Deploy Backend to Railway - Step by Step

## Current Status
- ✅ PostgreSQL database created on Railway
- ❌ Backend Flask app NOT deployed yet
- ❌ No public URL available yet

## Deploy Your Backend Now (10 Minutes)

### Step 1: Add New Service to Railway

1. **In Railway project dashboard**, look for a button that says:
   - "New" or "+ New" or "Add Service"
   - Usually in the top-right or center of the screen

2. **Click "New Service"** or similar button

3. **Choose "GitHub Repo"** from the options

### Step 2: Connect Your Repository

1. **Select your repository**: `Weather_Data_API` (or whatever you named it)
   - If you don't see it, click "Configure GitHub App" to give Railway access

2. **Railway will ask about the root directory**:
   - Set root directory to: `03_Website/backend`
   - OR leave it as root and configure later

3. **Click "Deploy"**

### Step 3: Configure the Service

After deployment starts, configure these settings:

1. **Go to Settings** (of the new service you just created)

2. **Set Root Directory** (if not done already):
   ```
   03_Website/backend
   ```

3. **Set Environment Variables** (Click "Variables" tab):
   ```
   SECRET_KEY=VskL9AbW1NZBa5P_9K1v5EEqyvmURi_6GbhIKvXUoJA
   JWT_SECRET_KEY=6eZ6uBKmmmlKSI7NlN8oL5XAJlmnDNYdkxKWpk6PTNI
   FLASK_ENV=production
   PORT=8000
   ```

4. **Connect to PostgreSQL**:
   - In Variables tab, you should see PostgreSQL variables automatically added
   - If not, Railway usually auto-connects services in the same project

### Step 4: Get Your Backend URL

1. **Once deployed**, go back to the service overview

2. **Look for "Domains"** section

3. **Click "Generate Domain"** if no domain exists

4. **Copy the URL** - it will be like:
   ```
   https://backend-production-xxxx.up.railway.app
   ```

### Step 5: Test Your Backend

Run this in terminal (replace with your actual URL):

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T...",
  "version": "1.0.0"
}
```

## Troubleshooting

### Error: "Build failed"

**Check these files exist in `03_Website/backend`:**
- `requirements.txt`
- `app.py`
- `Dockerfile` (optional but recommended)

**In Railway logs, look for:**
- Python version errors → Add `runtime.txt` with: `python-3.11`
- Missing packages → Check `requirements.txt` is complete

### Error: "Application failed to respond"

**Check Railway logs for:**
- Port configuration → Ensure `PORT` env var is set
- Import errors → Check all dependencies in `requirements.txt`

**Common fix:**
```env
PORT=8000
FLASK_ENV=production
```

### Error: "No such file or directory"

**Root directory is wrong.** Go to Settings → update to:
```
03_Website/backend
```

## Alternative: Deploy Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
cd 03_Website/backend
railway up
```

## What Happens Next

Once deployed successfully:

1. ✅ Backend will have a public URL
2. ✅ Database will be connected
3. ✅ You can test API endpoints
4. 🔄 Still need to deploy frontend separately
5. 🔄 Connect frontend to backend URL

## Next Steps After Backend Deploys

1. Get the Railway URL from the Domains section
2. Update frontend config to use this URL
3. Deploy frontend to Netlify
4. Update CORS settings to allow frontend domain
5. Test end-to-end: signup, login, API calls

---

**Reply with your Railway backend URL once it's deployed and I'll configure the rest!**
