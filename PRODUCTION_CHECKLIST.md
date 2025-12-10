# SkillSphere Production Deployment Checklist

## Pre-Deployment (1-2 days before)

### Security Audit
- [ ] All API keys removed from code
- [ ] `.env.local` added to `.gitignore`
- [ ] No secrets in git history (check with `git log -p | grep -i "key\|secret\|password"`)
- [ ] Firebase security rules reviewed and strict
- [ ] CORS configuration verified
- [ ] Rate limiting tested and working
- [ ] Input validation tested

### Code Quality
- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] ESLint warnings reviewed
- [ ] All tests passing (if available)
- [ ] No console.error or sensitive logs in production build

### Performance
- [ ] Build size checked (should be < 500KB)
- [ ] Images optimized
- [ ] Database queries optimized
- [ ] API response times < 2 seconds

### Testing
- [ ] Sign up functionality tested
- [ ] Sign in functionality tested
- [ ] Dashboard loading correctly
- [ ] CAPTCHA working
- [ ] Chatbot responding
- [ ] Career recommendations generating
- [ ] Resume helper working
- [ ] Career comparison working
- [ ] Logout functionality working
- [ ] Protected routes redirecting unauthenticated users

## Deployment Day

### Infrastructure Setup
- [ ] Domain registered and DNS configured
- [ ] SSL/TLS certificate obtained (auto with Vercel)
- [ ] Deployment platform selected (Vercel/Docker/Self-hosted)
- [ ] Database backups configured
- [ ] Monitoring tools set up

### Environment Configuration
- [ ] Production `.env.local` created with real credentials
- [ ] All Firebase environment variables set
- [ ] Gemini API key configured
- [ ] App URL set correctly
- [ ] Database connection verified

### Deployment
- [ ] Code pushed to production branch
- [ ] Build logs reviewed for errors
- [ ] Deployment completed successfully
- [ ] Health checks passing
- [ ] Application accessible at domain

### Post-Deployment Verification (30 mins)
- [ ] Homepage loads
- [ ] Sign up works
- [ ] Sign in works
- [ ] Dashboard accessible
- [ ] Chatbot functional
- [ ] AI features responsive
- [ ] No console errors
- [ ] Network requests successful

## First Week Monitoring

### Daily Checks
- [ ] Application uptime > 99%
- [ ] Error logs reviewed
- [ ] API response times normal
- [ ] Database size monitoring
- [ ] User feedback collected

### Weekly Checks
- [ ] Database backups verified
- [ ] Security logs reviewed
- [ ] Traffic patterns analyzed
- [ ] Uptime reports generated
- [ ] Cost analysis (if applicable)

## Documentation Updates

- [ ] README.md updated with deployment info
- [ ] API documentation complete
- [ ] Runbook created for common issues
- [ ] Incident response plan documented
- [ ] Team trained on deployment process

## Security Verification

### Before Going Live
```bash
# Check for secrets in code
npm install -g detect-secrets
detect-secrets scan

# Check security headers
curl -I https://your-domain.com
# Should include: X-Content-Type-Options, X-Frame-Options, etc.

# Test rate limiting
for i in {1..15}; do curl -X POST https://your-domain.com/api/chatbot; done
# Should return 429 on requests > 10/minute

# Verify HTTPS
curl https://your-domain.com -I | grep "Strict-Transport-Security"
```

### Post-Deployment
- [ ] Run security header check at [SecurityHeaders.com](https://securityheaders.com)
- [ ] Run SSL test at [SSLLabs.com](https://www.ssllabs.com/ssltest/)
- [ ] Check security.txt at `/.well-known/security.txt`
- [ ] Verify CORS headers correct
- [ ] Test with OWASP ZAP or similar security scanner

## Rollback Plan

If critical issues found:

1. **Immediate Actions** (< 5 mins)
   - [ ] Revert to previous stable version
   - [ ] Notify team
   - [ ] Update status page

2. **Investigation** (within 1 hour)
   - [ ] Check error logs
   - [ ] Identify root cause
   - [ ] Document issue

3. **Fix & Retest** (within 4 hours)
   - [ ] Fix issue in development
   - [ ] Test thoroughly
   - [ ] Create deployment plan

4. **Redeploy** (when ready)
   - [ ] Deploy fix
   - [ ] Verify functionality
   - [ ] Monitor for issues

## Incident Response

### Contact List
- **Team Lead**: [Name] [Phone] [Email]
- **DevOps**: [Name] [Phone] [Email]
- **Database Admin**: [Name] [Phone] [Email]

### Escalation Matrix
- **Critical** (Service down): Escalate immediately
- **High** (Major feature broken): Within 15 minutes
- **Medium** (Minor issue): Within 1 hour
- **Low** (Cosmetic): Within 24 hours

## Performance Targets

- [ ] Page Load Time: < 3 seconds
- [ ] API Response: < 2 seconds
- [ ] Database Query: < 500ms
- [ ] Uptime: > 99.5%
- [ ] Error Rate: < 0.1%

## Cost Monitoring (if applicable)

- [ ] Vercel costs tracking
- [ ] Firebase costs tracking
- [ ] API call costs monitoring
- [ ] Alert thresholds set
- [ ] Budget notifications enabled

## Post-Launch (1-4 weeks)

### Performance Analysis
- [ ] User metrics collected
- [ ] Performance bottlenecks identified
- [ ] Optimization opportunities found
- [ ] Scaling needs assessed

### Feedback Collection
- [ ] User feedback reviewed
- [ ] Bug reports triaged
- [ ] Feature requests collected
- [ ] Improvements prioritized

### System Hardening
- [ ] Additional security measures implemented
- [ ] Performance optimizations applied
- [ ] Database indexes tuned
- [ ] Caching strategies optimized

## Sign-Off

- [ ] Product Owner: _________________ Date: _______
- [ ] Tech Lead: _________________ Date: _______
- [ ] DevOps: _________________ Date: _______
- [ ] Security: _________________ Date: _______

---

## Quick Reference Commands

### Build & Deploy
```bash
cd frontend
npm install
npm run build
npm start
```

### Environment Setup
```bash
# Copy example and edit
cp .env.example .env.local
nano .env.local  # Add your keys
```

### Docker Deployment
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Emergency Rollback
```bash
# Vercel
vercel rollback

# Docker
docker-compose down
docker-compose pull
docker-compose up -d
```

---

**Last Updated**: December 11, 2025
**Version**: 1.0
**Status**: Production Ready ✅
