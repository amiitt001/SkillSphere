# 🚀 Quick Start Deployment Guide

## Choose Your Deployment Method

### ⭐ VERCEL (Recommended - 5 minutes)
**Best for**: Easiest deployment, automatic HTTPS, global CDN

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
cd frontend
vercel

# 3. Follow prompts to:
#    - Connect GitHub
#    - Select project
#    - Set environment variables
#    - Deploy

# Done! Your app is live 🎉
```

### 🐳 DOCKER (5-10 minutes)
**Best for**: Self-hosted, full control, reproducible builds

```bash
# 1. Create .env.local with your values
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local and add real values

# 2. Deploy
docker-compose up -d

# 3. Access at http://localhost:3000 (or your domain)

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 🖥️ Traditional Server (10-30 minutes)
**Best for**: Linux/Ubuntu servers, maximum control

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Clone and build
git clone https://github.com/amiitt001/SkillSphere.git
cd SkillSphere/frontend
npm install
npm run build

# 3. Set environment variables
export NEXT_PUBLIC_FIREBASE_API_KEY=your_key
export GEMINI_API_KEY=your_key
# ... set all other variables

# 4. Install PM2 for process management
sudo npm install -g pm2

# 5. Start application
pm2 start "npm start" --name "skillsphere"
pm2 startup
pm2 save

# Done! Your app is running 🚀
```

---

## Environment Variables Setup

### 1. Copy Example File
```bash
cd frontend
cp .env.example .env.local
```

### 2. Fill in Your Values
```env
# Get these from Firebase Console
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=skillsphere.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=skillsphere
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=skillsphere.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Get this from Google Cloud Console
GEMINI_API_KEY=AIzaSy...

# Your deployment domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Important Notes
- ⚠️ **NEVER commit `.env.local` to git**
- ⚠️ **GEMINI_API_KEY is SECRET - keep it safe**
- Firebase keys are public (prefixed with `NEXT_PUBLIC_`)
- Each environment needs its own `.env.local`

---

## Verification Checklist

### Before Deploying
```bash
# Build locally
npm run build
# Should complete without errors ✅

# Check for secrets in code
grep -r "AIzaSy" src/
# Should return NO results (secrets should be in env only) ✅
```

### After Deploying
```bash
# Check health
curl https://yourdomain.com
# Should return HTML page ✅

# Check security headers
curl -I https://yourdomain.com
# Should see X-Content-Type-Options and other headers ✅

# Test authentication
# Try to access dashboard without login
# Should redirect to /signin ✅

# Test chatbot
# Open app, login, try chatbot
# Should respond with AI answer ✅
```

---

## Common Issues & Solutions

### "GEMINI_API_KEY is not defined"
```
✗ Problem: Environment variable not set
✓ Solution: 
  1. Check .env.local file exists
  2. Verify GEMINI_API_KEY is set
  3. Restart application
  4. For Vercel: Check Project Settings → Environment Variables
```

### "Firebase authentication failed"
```
✗ Problem: Firebase credentials wrong or auth method not enabled
✓ Solution:
  1. Verify Firebase keys in .env.local
  2. Go to Firebase Console → Authentication
  3. Enable "Email/Password" method
  4. Enable "Google" OAuth provider
  5. Restart application
```

### "CORS error on API calls"
```
✗ Problem: Domain not matching NEXT_PUBLIC_APP_URL
✓ Solution:
  1. Set NEXT_PUBLIC_APP_URL to your actual domain
  2. For local development: http://localhost:3000
  3. For production: https://yourdomain.com
  4. Restart application
```

### "Rate limiting (too many requests)"
```
✗ Problem: Exceeded 10 requests per minute
✓ Solution:
  1. Wait 60 seconds before making new request
  2. Check if multiple tabs making requests
  3. Check for browser extensions making requests
```

---

## Post-Deployment Steps

### 1. Test All Features
- [ ] Sign up with email/password
- [ ] Sign in with Google
- [ ] Access dashboard
- [ ] Use chatbot
- [ ] Get AI recommendations
- [ ] Generate resume bullet points
- [ ] Compare careers
- [ ] Logout

### 2. Security Verification
```bash
# Check HTTPS
curl -I https://yourdomain.com | grep "HTTP"
# Should show "HTTP/2 200" or "HTTP/1.1 200"

# Check security headers
curl -I https://yourdomain.com | grep -i "x-"
# Should show security headers

# Test rate limiting
for i in {1..15}; do 
  curl -X POST https://yourdomain.com/api/chatbot
done
# After 10 requests, should get 429 status
```

### 3. Set Up Monitoring
- [ ] Enable error tracking (Sentry/Firebase)
- [ ] Set up uptime monitoring
- [ ] Configure alerts for high error rate
- [ ] Set up database monitoring

### 4. Configure Backups
- [ ] Enable Firebase automated backups
- [ ] Test backup restoration
- [ ] Schedule regular backups

---

## Production Essentials

### Domain Setup
```bash
# Point your domain to deployment platform
# For Vercel: Add CNAME record pointing to Vercel
# For Docker/Server: Point A record to server IP
```

### SSL Certificate
- ✅ Vercel: Automatic (free)
- ✅ Docker: Use Let's Encrypt (free)
- ✅ Server: Use Let's Encrypt with Certbot (free)

### Database
- ✅ Firebase Firestore: Auto-scaling, included with project
- ✅ Backups: Auto-backup included
- ✅ Regions: Select closest to your users

---

## Scaling as You Grow

### Phase 1: Launch (Current)
- Vercel + Firebase
- Handles: 1,000 users
- Cost: $25-50/month

### Phase 2: Growth (10K+ users)
- Enable Firestore sharding
- Use Vercel Pro for advanced analytics
- Enable CDN edge functions
- Cost: $50-200/month

### Phase 3: Scale (100K+ users)
- Multi-region Firebase
- Dedicated database instances
- Advanced CDN caching
- Cost: $200-1000+/month

---

## Monitoring Dashboard

### Key Metrics to Watch
```
Daily:
  - Error rate (should be < 0.1%)
  - Response time (should be < 2s)
  - Uptime (should be > 99%)

Weekly:
  - Active users
  - API call volume
  - Database size
  - Cost trends

Monthly:
  - Scaling needs
  - Performance improvements
  - Security audits
```

---

## Emergency Contacts

**If something breaks:**
1. Check logs (Firebase Console or Vercel Dashboard)
2. Identify the error
3. Refer to DEPLOYMENT_SECURITY.md for solution
4. If still stuck: Check GitHub Issues or StackOverflow

---

## Resources

| Resource | Link |
|----------|------|
| Vercel Docs | https://vercel.com/docs |
| Firebase Console | https://console.firebase.google.com |
| Google Cloud Console | https://console.cloud.google.com |
| GitHub Repository | https://github.com/amiitt001/SkillSphere |
| OWASP Security | https://owasp.org/www-project-top-ten/ |

---

## Success Metrics

Your deployment is successful if:

✅ Application loads in < 3 seconds
✅ Authentication works (email and Google)
✅ Protected routes require login
✅ Chatbot responds to messages
✅ AI features work (recommendations, resume, compare)
✅ No errors in console
✅ HTTPS is enabled
✅ Security headers present
✅ Rate limiting working
✅ Database queries fast

---

## Next Steps

1. **Choose deployment method** → Vercel (easiest) or Docker
2. **Prepare environment variables** → Copy .env.example and fill in values
3. **Deploy** → Follow instructions for your chosen method
4. **Verify** → Test all features and security
5. **Monitor** → Watch logs and metrics
6. **Optimize** → Improve based on real-world usage

---

**Status**: 🟢 **READY TO DEPLOY**

Your application is fully secured and ready for production! 🚀

For detailed information, see: `PRODUCTION_READY.md` and `DEPLOYMENT_SECURITY.md`
