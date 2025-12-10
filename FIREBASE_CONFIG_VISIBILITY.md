# Firebase App Check Setup Guide

## Why Firebase Config is Visible (And That's OK)

**YOU CANNOT HIDE FIREBASE CONFIG** - This is by design and applies to ALL web apps using Firebase:
- Google's own products expose Firebase config
- YouTube exposes Firebase config
- All Firebase documentation shows config in client code

**Security comes from:**
1. Firestore Security Rules (not hiding config)
2. Firebase Authentication (not hiding config)
3. Domain restrictions in Firebase Console
4. App Check (optional extra layer)

## The Config You See is NOT Sensitive

The values you see in DevTools are **public identifiers**, not secret keys:
- `apiKey`: Public identifier (NOT a secret key)
- `projectId`: Public project name
- `authDomain`: Public domain

**Real security is enforced server-side** by Firebase's security rules.

## If You Still Want Extra Protection: Enable App Check

App Check adds device attestation to verify requests come from your app:

### Step 1: Get reCAPTCHA v3 Site Key

1. Go to https://www.google.com/recaptcha/admin/create
2. Choose **reCAPTCHA v3**
3. Add your domain
4. Copy the **Site Key**

### Step 2: Add to Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your_recaptcha_site_key_here"
```

### Step 3: Enable App Check in Firebase Console

1. Go to Firebase Console → Your Project
2. Navigate to "Build" → "App Check"
3. Click "Get Started"
4. Register your web app
5. Select "reCAPTCHA v3"
6. Add your reCAPTCHA site key

### Step 4: Run the Installation Command

Run this command to add App Check support:
```bash
npm install firebase
```

Then I'll update the code to enable it.

## Bottom Line

**Firebase config visibility = NORMAL**
- ✅ This applies to ALL Firebase web apps
- ✅ Your sensitive API keys (GEMINI_API_KEY) are already hidden
- ✅ Security is enforced by Firebase's backend rules
- 🔐 App Check adds extra protection but config is still visible

**You should focus on:**
1. ✅ Deploy Firestore security rules (prevents unauthorized data access)
2. ✅ Configure domain restrictions (prevents unauthorized domains)
3. 🔄 Enable App Check (optional, adds device attestation)

The Firebase config in DevTools is **supposed to be there** and **cannot be removed**.
