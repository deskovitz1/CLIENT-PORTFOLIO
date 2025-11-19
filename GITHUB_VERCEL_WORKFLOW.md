# GitHub & Vercel Workflow Guide

## Overview
This project is configured to use **GitHub** for version control and **Vercel** for deployment. All changes should be made through GitHub, not stored locally.

## Workflow

### Making Changes

1. **Create a new branch** (optional for small changes):
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** locally

3. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main  # or your branch name
   ```

4. **Vercel will automatically deploy** when you push to the `main` branch

### Syncing Local with Remote

If you need to sync your local repository with the latest from GitHub:

```bash
# Fetch latest changes
git fetch origin

# Reset local to match remote (discards local changes)
git reset --hard origin/main

# Clean untracked files
git clean -fd
```

### Vercel Setup

1. **Connect your GitHub repository to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository: `deskovitz1/v0-v37-rebuild`
   - Vercel will auto-detect Next.js settings

2. **Environment Variables**:
   - Add any required environment variables in Vercel dashboard
   - They will be available in production automatically

3. **Automatic Deployments**:
   - Every push to `main` triggers a production deployment
   - Pull requests get preview deployments automatically

### Important Notes

- ✅ **DO**: Make changes, commit, and push to GitHub
- ✅ **DO**: Let Vercel handle deployments automatically
- ❌ **DON'T**: Store changes only locally
- ❌ **DON'T**: Manually deploy to Vercel (unless necessary)

### Checking Deployment Status

- View deployments in the Vercel dashboard
- Check GitHub Actions for build status
- Preview URLs are available in pull requests

## Quick Commands

```bash
# Pull latest changes
git pull origin main

# Reset to match remote (discard local changes)
git reset --hard origin/main && git clean -fd

# Check status
git status

# View remote repository
git remote -v
```

