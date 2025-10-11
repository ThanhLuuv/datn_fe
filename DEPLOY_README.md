# 🚀 BookStore Frontend - Vercel Deployment

## ⚡ Quick Deploy

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel
- Truy cập [vercel.com](https://vercel.com)
- Click "New Project"
- Import GitHub repository
- Click "Deploy"

### 3. Done! 🎉
- Website sẽ có URL: `https://your-project.vercel.app`
- Tự động sử dụng production environment
- API endpoint: `https://bookstore-api-386583671447.asia-southeast1.run.app/api`

## 📁 Files Added for Vercel

- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Exclude unnecessary files
- ✅ Updated `package.json` - Static hosting ready
- ✅ Updated `js/env-loader.js` - Auto-detect Vercel environment

## 🔧 Environment Auto-Detection

- **Vercel domains** (`*.vercel.app`) → Production environment
- **Localhost** → Development environment
- **Manual override** → `?env=production`

## 📖 Detailed Guide

Xem [VERCEL_DEPLOY_GUIDE.md](VERCEL_DEPLOY_GUIDE.md) để biết chi tiết.

---

**Ready to deploy! 🚀**
