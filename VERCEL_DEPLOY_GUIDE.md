# 🚀 Deploy BookStore Frontend lên Vercel

## 📋 Chuẩn Bị

### 1. Tài Khoản Vercel
- Đăng ký tài khoản tại [vercel.com](https://vercel.com)
- Kết nối với GitHub account

### 2. Repository GitHub
- Push code lên GitHub repository
- Đảm bảo có các files cần thiết:
  - `vercel.json` ✅
  - `package.json` ✅
  - `.vercelignore` ✅
  - `env/production.js` ✅

## 🔧 Cấu Hình

### Files Đã Tạo Cho Vercel:

#### `vercel.json`
```json
{
  "version": 2,
  "name": "bookstore-frontend",
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

#### `.vercelignore`
```
node_modules/
env/development.js
env/staging.js
*.md
!README.md
```

## 🚀 Các Cách Deploy

### Cách 1: Deploy qua Vercel Dashboard (Khuyến nghị)

1. **Đăng nhập Vercel Dashboard**
   - Truy cập [vercel.com/dashboard](https://vercel.com/dashboard)

2. **Import Project**
   - Click "New Project"
   - Chọn GitHub repository của bạn
   - Click "Import"

3. **Cấu Hình Project**
   - **Project Name**: `bookstore-frontend`
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (mặc định)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `./` (mặc định)

4. **Environment Variables** (Optional)
   ```
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Deploy"
   - Chờ deployment hoàn thành

### Cách 2: Deploy qua Vercel CLI

1. **Cài đặt Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Production Deploy**
   ```bash
   vercel --prod
   ```

### Cách 3: Deploy qua GitHub Integration

1. **Kết nối Repository**
   - Vào Vercel Dashboard
   - Click "New Project"
   - Chọn repository từ GitHub

2. **Auto Deploy**
   - Mỗi lần push code lên `main` branch
   - Vercel sẽ tự động deploy

## 🌍 Environment Configuration

### Production Environment
Khi deploy lên Vercel, ứng dụng sẽ tự động:
- Detect domain `*.vercel.app` → sử dụng production environment
- Load `env/production.js` với API endpoint:
  ```
  https://bookstore-api-386583671447.asia-southeast1.run.app/api
  ```

### Custom Domain (Optional)
1. **Mua domain** từ nhà cung cấp
2. **Cấu hình DNS**:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
3. **Add Domain trong Vercel**:
   - Vào Project Settings
   - Tab "Domains"
   - Add domain của bạn

## 🔍 Kiểm Tra Deployment

### 1. Health Check
Sau khi deploy, kiểm tra:
- ✅ Website load được
- ✅ API calls hoạt động
- ✅ Authentication flow
- ✅ All pages accessible

### 2. Debug Console
Mở Developer Console trên Vercel URL:
```javascript
console.log('Environment:', BookstoreEnv.getCurrentEnvironment());
console.log('API Base URL:', window.ENV_CONFIG.API_BASE_URL);
```

### 3. Network Tab
Kiểm tra API calls:
- ✅ Requests đến đúng endpoint
- ✅ CORS headers
- ✅ Authentication headers

## 🛠️ Troubleshooting

### Lỗi 404 - Page Not Found
**Nguyên nhân**: SPA routing không hoạt động
**Giải pháp**: Kiểm tra `vercel.json` có `rewrites` rule

### Lỗi CORS
**Nguyên nhân**: API server không cho phép Vercel domain
**Giải pháp**: Cấu hình CORS trên API server

### Environment không đúng
**Nguyên nhân**: `env/production.js` không load
**Giải pháp**: 
- Kiểm tra file có tồn tại
- Kiểm tra `.vercelignore` không exclude file này

### API calls fail
**Nguyên nhân**: API endpoint không đúng
**Giải pháp**: Kiểm tra `env/production.js` có đúng API URL

## 📊 Performance Optimization

### 1. Enable Compression
Vercel tự động enable gzip compression

### 2. CDN
Vercel sử dụng global CDN tự động

### 3. Caching
```json
// Thêm vào vercel.json
"headers": [
  {
    "source": "/static/(.*)",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }
    ]
  }
]
```

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📈 Monitoring

### Vercel Analytics
- Enable trong Project Settings
- Track page views, performance metrics

### Error Tracking
- Vercel tự động track build errors
- Runtime errors trong Function logs

## 🎯 Kết Quả

Sau khi deploy thành công:
- ✅ Website accessible tại `https://your-project.vercel.app`
- ✅ API calls đến Google Cloud Run
- ✅ Environment tự động detect production
- ✅ SPA routing hoạt động
- ✅ Performance optimized với CDN

## 🔗 Links Hữu Ích

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/cli)
- [Static Site Deployment](https://vercel.com/docs/concepts/deployments/static)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🎉 Chúc Mừng!

Bạn đã deploy thành công BookStore Frontend lên Vercel! 

**Next Steps:**
1. Test tất cả features trên production
2. Setup custom domain (optional)
3. Enable analytics và monitoring
4. Setup CI/CD pipeline (optional)
