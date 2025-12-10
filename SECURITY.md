# Security Guide for SkillSphere

## 🔐 API Key Security

### ✅ What's Already Secure

1. **Server-Side API Keys**
   - ✅ `GEMINI_API_KEY` is **never exposed** to the browser
   - ✅ All AI API calls are made from **server-side routes** (`/api/*`)
   - ✅ API keys are stored in `.env.local` (not committed to git)

2. **Firebase Configuration**
   - ⚠️ Firebase client config **IS visible** in browser (this is NORMAL and EXPECTED)
   - ✅ Firebase API keys are **restricted by domain** in Firebase Console
   - ✅ Security is enforced by **Firestore Security Rules**, not by hiding the config

### 🛡️ Understanding Firebase Security

**Important:** Firebase client-side API keys are **designed to be public**. They are NOT secret keys!

Firebase security works differently than traditional APIs:
- **Authentication**: Controls WHO can access your app
- **Security Rules**: Controls WHAT data authenticated users can access
- **Domain Restrictions**: Prevents unauthorized domains from using your Firebase project

### 📋 Security Checklist

#### 1. Firebase Security Rules (CRITICAL)

Deploy the `firestore.rules` file to your Firebase project:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

#### 2. Firebase Console Settings

**Go to Firebase Console** → Your Project → Settings

##### A. Authorized Domains
Add only your production domains:
- ✅ `skillsphere.com` (your domain)
- ✅ `*.vercel.app` (if using Vercel)
- ❌ Remove `localhost` in production

##### B. API Key Restrictions (Optional but recommended)
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" → "Credentials"
3. Find your API key
4. Add **Application restrictions**:
   - HTTP referrers: Add your domain
5. Add **API restrictions**:
   - Firebase Authentication API
   - Cloud Firestore API

#### 3. Enable Firebase App Check (Recommended)

App Check prevents unauthorized access to your Firebase backend:

```typescript
// Add to src/lib/firebase.ts
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// After initializing Firebase app
if (typeof window !== 'undefined') {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  });
}
```

Get reCAPTCHA key from: https://www.google.com/recaptcha/admin

#### 4. Rate Limiting (Already Implemented ✅)

- Chatbot API: 10 requests per minute per IP
- Input validation: Max 500 characters
- All implemented in `/api/chatbot/route.ts`

#### 5. Security Headers (Already Implemented ✅)

Next.js security headers are configured in `next.config.ts`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy

## 🚨 What Users See in Network Tab

### Expected (Normal):
```javascript
// These are PUBLIC and SAFE to expose:
{
  apiKey: "AIzaSyBFQ...........",
  authDomain: "skillsphere-web.firebaseapp.com",
  projectId: "skillsphere-web",
  // ... other Firebase config
}
```

### Never Exposed (Protected):
```bash
# These are SERVER-SIDE ONLY:
GEMINI_API_KEY=AIzaSyB_kcrGMy-u0c..........  # ✅ Never in browser
```

## 🔍 Verification

### Check if your API keys are secure:

1. **Open DevTools** → Network tab
2. **Check Firebase requests**: 
   - ✅ Should see Firebase config (normal)
   - ❌ Should NOT see GEMINI_API_KEY anywhere
3. **Check API routes** (`/api/*`):
   - ✅ Requests should go to YOUR server
   - ✅ Response should come from YOUR server
   - ❌ Should NOT see direct calls to `generativelanguage.googleapis.com` from browser

### Test API Protection:

```bash
# This should FAIL (unauthorized):
curl -X POST https://your-domain.com/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# This should return 429 after 10 requests (rate limiting):
for i in {1..15}; do
  curl https://your-domain.com/api/chatbot -d '{"message":"test"}';
done
```

## 📚 Additional Resources

- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

## 🆘 If Your Keys Are Compromised

If you accidentally exposed `GEMINI_API_KEY`:

1. **Immediately rotate the key**:
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Delete the compromised key
   - Create a new key
   - Update `.env.local`

2. **Check usage**:
   - Review API usage in Google Cloud Console
   - Look for suspicious activity

3. **Update and redeploy**:
   ```bash
   # Update .env.local with new key
   git add .env.local  # Make sure .env.local is in .gitignore!
   npm run build
   # Deploy to production
   ```

## ✅ Current Security Status

- ✅ All sensitive API keys are server-side only
- ✅ Rate limiting implemented
- ✅ Input validation implemented
- ✅ Security headers configured
- ✅ CAPTCHA protection on critical endpoints
- ✅ Protected routes with authentication
- ⚠️ **ACTION REQUIRED**: Deploy Firestore security rules
- ⚠️ **ACTION REQUIRED**: Configure Firebase domain restrictions
- 🔄 **RECOMMENDED**: Enable Firebase App Check
