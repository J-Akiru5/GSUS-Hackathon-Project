# Security & Deployment Checklist

This document lists recommended security controls and steps to safely deploy the GSUS web app.

## Immediate pre-deploy checklist
- Do not commit production secrets. Use environment variables in CI/hosting.
- Enable Firebase App Check (reCAPTCHA v3) and add site key to `VITE_FIREBASE_APPCHECK_KEY` in hosting env.
- Harden Firestore rules (already updated in this repo). Run tests in the Firebase Emulator.
- Disable anonymous sign-in in production (see `src/hooks/useAuth.js` — gated by `VITE_ALLOW_ANON_SIGNIN`).
- Add CSP/security headers (see `firebase.json`).

## Recommended runtime protections
- Enable Firebase Authentication providers you need and configure email verification if using email sign-up.
- Enable Cloud Logging and set up alerting for error spikes and suspicious activity.
- Integrate dependency scanning (Dependabot, Snyk) and run `npm audit` regularly.
- Use App Check to reduce client abuse.

## CI/CD
- Store secrets in the provider's secret store (GitHub Actions secrets, Firebase Hosting env config).
- Fail builds on high/critical vulnerabilities.

## Emergency runbook
1. Rotate compromised credentials immediately.
2. Disable Hosting or block access via temporary redirect if active exploit detected.
3. Revoke any compromised service account keys and re-issue new ones.

## Contact
Repository owner: see project README or repo settings.
