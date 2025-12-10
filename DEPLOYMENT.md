# SkillSphere Deployment Guide

## Pre-Deployment Checklist

### Security
- [x] API keys stored in environment variables (not in code)
- [x] Rate limiting implemented on API endpoints
- [x] Input validation and sanitization added
- [x] Security headers configured (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, etc.)
- [x] HTTPS required for production
- [x] Firebase security rules configured
- [x] CORS properly configured

### Environment Configuration
1. Create `.env.local` file in `/frontend` directory
2. Use `.env.example` as a template
3. Fill in all required environment variables:
   - Firebase credentials
   - Gemini API key

### Testing Before Deployment
```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Build for production
npm run build

# Test production build locally
npm start
```

## Deployment Steps

### Option 1: Vercel (Recommended for Next.js)
1. Push code to GitHub
2. Visit https://vercel.com/new
3. Import the repository
4. Set environment variables in project settings
5. Deploy automatically

### Option 2: Docker Deployment
```bash
docker build -t skillsphere:latest .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key skillsphere:latest
```

### Option 3: Self-hosted (Node.js)
```bash
# Build
npm install
npm run build

# Run
npm start
```

## Production Environment Variables

Create `.env.local` in the frontend directory:

```
# Firebase (Public - can be in frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_value
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API Key (KEEP SECRET - Server-side only)
GEMINI_API_KEY=your_secret_key

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Security Best Practices

### 1. API Security
- ✅ Rate limiting: 10 requests per minute per IP
- ✅ Input validation: Messages limited to 500 characters
- ✅ Error handling: No sensitive info in error messages
- ✅ API keys: Never logged or exposed

### 2. HTTP Security Headers
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: Restrict geolocation, microphone, camera

### 3. Data Protection
- ✅ HTTPS only (enforce in production)
- ✅ Firebase Authentication for user data
- ✅ No sensitive data in URLs
- ✅ Secure cookie settings

### 4. API Keys
- ✅ Store in environment variables
- ✅ Never commit to git
- ✅ Use separate keys for dev/prod
- ✅ Rotate keys periodically

## Monitoring

### Recommended Monitoring Tools
- **Vercel Analytics**: For performance monitoring
- **Sentry**: For error tracking
- **Firebase Console**: For authentication and data monitoring

## Troubleshooting

### Common Issues

**Issue**: Environment variables not loading
```
Solution: Restart the application after updating .env.local
```

**Issue**: CORS errors
```
Solution: Ensure NEXT_PUBLIC_APP_URL matches your deployment domain
```

**Issue**: Rate limiting errors
```
Solution: The API allows 10 requests per minute. Wait before retrying.
```

## Post-Deployment

1. Test all features in production
2. Monitor error logs
3. Check Analytics dashboard
4. Set up automated backups
5. Plan security audits

## Emergency Rollback

If issues occur:
1. Revert to previous version on deployment platform
2. Check logs for error details
3. Test fixes in development
4. Redeploy fixed version
