# Environment Configuration - Quick Start

## 🚀 Thay Đổi API Endpoint Nhanh

### 1. Qua URL Parameter
```
http://localhost:3000/?env=staging
http://localhost:3000/?env=production
```

### 2. Qua Console (F12)
```javascript
BookstoreEnv.setEnvironment('staging');
// Refresh trang để áp dụng
```

### 3. Sửa File Environment
- **Development**: `env/development.js`
- **Staging**: `env/staging.js`  
- **Production**: `env/production.js`

Chỉ cần thay đổi `API_BASE_URL` trong file tương ứng.

## 📁 Files Đã Tạo

```
env/
├── development.js    # http://localhost:5256/api
├── staging.js        # https://staging-api.bookstore.com/api
└── production.js     # https://api.bookstore.com/api

js/
└── env-loader.js     # Auto-load environment

ENVIRONMENT_GUIDE.md  # Hướng dẫn chi tiết
```

## ✅ Hoàn Thành

- ✅ Environment files cho development, staging, production
- ✅ Auto-detection environment dựa trên hostname
- ✅ Manual override qua URL parameter hoặc console
- ✅ Fallback configuration nếu environment không load
- ✅ Documentation đầy đủ

**Bây giờ bạn có thể dễ dàng thay đổi API endpoint mà không cần sửa code!**
