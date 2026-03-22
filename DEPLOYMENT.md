# Deployment Guide

## Deploy to GitHub

Since git CLI is not available on this system, use one of these methods:

### Option 1: GitHub Desktop (Recommended)

1. Download [GitHub Desktop](https://desktop.github.com/)
2. Create new repository → "Add" → select this folder
3. Name: `echoesofriftwar`
4. Publish repository → Add remote: `https://github.com/theantipopau/echoesofriftwar`
5. Push to main

### Option 2: Git Bash / WSL

If you have Git installed separately:

```bash
cd "c:\RPG Game\Echoes of the Riftwar"
git init
git add .
git commit -m "Initial commit: PHASE 9 complete with world state system"
git branch -M main
git remote add origin https://github.com/theantipopau/echoesofriftwar.git
git push -u origin main
```

### Option 3: GitHub Web Interface

1. Create repository at https://github.com/new
2. Name: `echoesofriftwar`
3. Clone to your machine
4. Copy project files into cloned folder
5. Commit and push

## Deploy to Live Hosting

### Cloudflare Pages

1. Go to https://dash.cloudflare.com/
2. Pages → Create project → Connect to GitHub
3. Select `theantipopau/echoesofriftwar`
4. Build settings:
   - Framework: "None"
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy

### GitHub Pages

1. Go to repository Settings → Pages
2. Source: Deploy from branch
3. Branch: main, folder: /(root)
4. Site builds automatically on each push
5. Access at: https://theantipopau.github.io/echoesofriftwar

### Vercel

1. Go to https://vercel.com/new
2. Import repository
3. Framework: "Other"
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

## Build Artifacts

After running `npm run build`, the `dist/` folder contains:
- `index.html` — Single-page app entry point
- `assets/` — JavaScript bundles and CSS
- Ready to deploy to any static host

Total size: ~1.1 MB (263 KB gzipped)
