# Environment Configuration Guide

## 📋 Tổng quan

Hệ thống BookStore Frontend đã được cấu hình để hỗ trợ nhiều môi trường (development, staging, production) với các endpoint API khác nhau. Điều này giúp dễ dàng chuyển đổi giữa các môi trường mà không cần thay đổi code.

## 🔧 Cấu trúc Environment

### Files Environment
```
env/
├── development.js    # Môi trường phát triển
├── staging.js        # Môi trường staging
└── production.js     # Môi trường production
```

### Environment Loader
```
js/
└── env-loader.js     # Script tự động load environment
```

## 🌍 Các Môi Trường

### Development Environment
- **API Base URL**: `http://localhost:5256/api`
- **Debug Mode**: `true`
- **Features**: Tất cả debug logs được bật
- **Sử dụng**: Phát triển và test local

### Staging Environment  
- **API Base URL**: `https://staging-api.bookstore.com/api`
- **Debug Mode**: `true`
- **Features**: Debug logs và performance monitoring
- **Sử dụng**: Test trước khi deploy production

### Production Environment
- **API Base URL**: `https://api.bookstore.com/api`
- **Debug Mode**: `false`
- **Features**: Chỉ performance monitoring
- **Sử dụng**: Môi trường thực tế

## 🚀 Cách Sử Dụng

### 1. Tự Động Detect Environment
Hệ thống sẽ tự động detect environment dựa trên:
- **Hostname**: `localhost` → development
- **Hostname**: `staging-*` → staging  
- **Hostname**: `bookstore.com` → production

### 2. Thay Đổi Environment Qua URL
Thêm parameter `env` vào URL:
```
http://localhost:3000/?env=staging
http://localhost:3000/?env=production
```

### 3. Thay Đổi Environment Qua Console
Mở Developer Console và sử dụng:
```javascript
// Set environment
BookstoreEnv.setEnvironment('staging');

// Get current environment
BookstoreEnv.getCurrentEnvironment();

// Clear environment preference
BookstoreEnv.clearEnvironment();
```

### 4. Thay Đổi Environment Qua localStorage
```javascript
localStorage.setItem('bookstore_environment', 'production');
```

## ⚙️ Cấu Hình Environment

### Thêm Environment Mới
1. Tạo file `env/new-environment.js`:
```javascript
window.ENV_CONFIG = {
    API_BASE_URL: 'https://new-api.example.com/api',
    API_TIMEOUT: 10000,
    ENVIRONMENT: 'new-environment',
    DEBUG_MODE: true,
    // ... other config
};
```

2. Cập nhật `env-loader.js` để hỗ trợ environment mới:
```javascript
if (envParam && ['development', 'staging', 'production', 'new-environment'].includes(envParam)) {
    // ...
}
```

### Thay Đổi API Endpoint
Chỉ cần sửa `API_BASE_URL` trong file environment tương ứng:

**Development** (`env/development.js`):
```javascript
API_BASE_URL: 'http://localhost:8080/api',  // Thay đổi port
```

**Production** (`env/production.js`):
```javascript
API_BASE_URL: 'https://new-api.bookstore.com/api',  // Thay đổi domain
```

## 🔍 Debug và Troubleshooting

### Kiểm Tra Environment Hiện Tại
```javascript
console.log('Current Environment:', BookstoreEnv.getCurrentEnvironment());
console.log('ENV_CONFIG:', window.ENV_CONFIG);
```

### Debug Environment Loading
Mở Developer Console để xem logs:
```
🔧 Initializing environment...
Selected environment: development
✅ Environment script loaded: development
Environment: development
API Base URL: http://localhost:5256/api
```

### Lỗi Thường Gặp

#### 1. Environment Script Không Load
**Nguyên nhân**: File environment không tồn tại
**Giải pháp**: Kiểm tra file `env/[environment].js` có tồn tại

#### 2. API Calls Fail
**Nguyên nhân**: API Base URL không đúng
**Giải pháp**: Kiểm tra `API_BASE_URL` trong environment config

#### 3. Environment Không Thay Đổi
**Nguyên nhân**: Cache hoặc localStorage
**Giải pháp**: 
- Clear localStorage: `BookstoreEnv.clearEnvironment()`
- Hard refresh: `Ctrl + F5`

## 📝 Best Practices

### 1. Environment Naming
- Sử dụng tên rõ ràng: `development`, `staging`, `production`
- Tránh tên phức tạp hoặc có ký tự đặc biệt

### 2. API Configuration
- Luôn sử dụng HTTPS cho production
- Sử dụng HTTP cho development local
- Cấu hình timeout phù hợp với từng môi trường

### 3. Debug Configuration
- Bật debug logs cho development và staging
- Tắt debug logs cho production
- Sử dụng feature flags để control functionality

### 4. Security
- Không commit sensitive data vào environment files
- Sử dụng environment variables cho production secrets
- Validate API endpoints trước khi deploy

## 🔄 Migration từ Hard-coded Config

### Trước (Hard-coded):
```javascript
app.constant('APP_CONFIG', {
    API_BASE_URL: 'http://localhost:5256/api',
    // ...
});
```

### Sau (Environment-based):
```javascript
var config = window.ENV_CONFIG || { /* fallback */ };
app.constant('APP_CONFIG', config);
```

## 📚 API Reference

### BookstoreEnv Object
```javascript
BookstoreEnv = {
    detectEnvironment(),           // Auto-detect environment
    loadEnvironmentScript(env),   // Load specific environment
    setEnvironment(env),          // Set environment preference
    getCurrentEnvironment(),       // Get current environment
    clearEnvironment()             // Clear environment preference
}
```

### Environment Config Structure
```javascript
window.ENV_CONFIG = {
    API_BASE_URL: 'string',       // API base URL
    API_TIMEOUT: 'number',        // Request timeout
    ENVIRONMENT: 'string',        // Environment name
    DEBUG_MODE: 'boolean',        // Debug mode flag
    FEATURES: {                   // Feature flags
        ENABLE_DEBUG_LOGS: 'boolean',
        ENABLE_API_LOGGING: 'boolean',
        ENABLE_PERFORMANCE_MONITORING: 'boolean'
    }
}
```

---

## 🎯 Kết Luận

Hệ thống environment configuration giúp:
- ✅ Dễ dàng chuyển đổi giữa các môi trường
- ✅ Quản lý API endpoints tập trung
- ✅ Debug và monitoring linh hoạt
- ✅ Deploy an toàn và nhất quán
- ✅ Bảo mật thông tin sensitive

Để thay đổi API endpoint, chỉ cần sửa file environment tương ứng và refresh trang!
