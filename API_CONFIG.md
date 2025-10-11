# API Configuration - BookStore Frontend

## 🔗 API Backend

**Base URL:** Configurable via Environment (see [ENVIRONMENT_GUIDE.md](ENVIRONMENT_GUIDE.md))

- **Development**: `http://localhost:5256/api`
- **Staging**: `https://staging-api.bookstore.com/api`  
- **Production**: `https://api.bookstore.com/api`

## 🌍 Environment Management

The application now supports multiple environments with automatic detection:

### Auto-Detection
- `localhost` → Development environment
- `staging-*` → Staging environment
- `bookstore.com` → Production environment

### Manual Override
- URL Parameter: `?env=staging`
- Console: `BookstoreEnv.setEnvironment('production')`
- localStorage: `localStorage.setItem('bookstore_environment', 'staging')`

For detailed environment configuration, see [ENVIRONMENT_GUIDE.md](ENVIRONMENT_GUIDE.md).

## 📋 Available Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký

### Test Endpoints
- `GET /api/test/public` - Test public API (không cần authentication)
- `GET /api/test/protected` - Test protected API (cần authentication)
- `GET /api/test/admin-only` - Test admin API (chỉ ADMIN)
- `GET /api/test/staff-only` - Test staff API (EMPLOYEE và ADMIN)

### Publisher APIs
- `GET /api/publisher` - Lấy danh sách nhà xuất bản (cần authentication)
  - Query: `pageNumber`, `pageSize`, `searchTerm`
  - Response: `{ success: true, data: { publishers: [...], totalCount, pageNumber, pageSize, totalPages } }`

### Book APIs
- `GET /api/book` - Lấy danh sách sách (cần authentication)
  - Query: `pageNumber`, `pageSize`, `searchTerm`, `categoryId`, `publisherId`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`
  - Response: `{ success: true, data: { books: [...], totalCount, pageNumber, pageSize, totalPages } }`
- `GET /api/book/by-publisher/{publisherId}` - Lấy danh sách sách theo nhà xuất bản (cần authentication)
  - Query: `pageNumber`, `pageSize`, `searchTerm`
  - Response: `{ success: true, data: { books: [...], totalCount, pageNumber, pageSize, totalPages } }`

### Category APIs
- `GET /api/category` - Lấy danh sách danh mục (cần authentication)
  - Query: `pageNumber`, `pageSize`, `searchTerm`
  - Response: `{ success: true, data: { categories: [...], totalCount, pageNumber, pageSize, totalPages } }`

## 🔧 Configuration

API configuration được quản lý qua Environment System:

### Environment Files
- `env/development.js` - Development configuration
- `env/staging.js` - Staging configuration  
- `env/production.js` - Production configuration

### Auto-Loading
Environment được tự động load bởi `js/env-loader.js` và áp dụng vào `js/angular/app.config.js`:

```javascript
var config = window.ENV_CONFIG || { /* fallback */ };
app.constant('APP_CONFIG', config);
```

## 🚀 Cách sử dụng

### Development
1. **Đảm bảo BookStore API đang chạy** trên `http://localhost:5256`
2. **Chạy Frontend** trên `http://localhost:3000`
3. **Test API** tại `http://localhost:3000/#!/api-test`

### Staging/Production
1. **Cấu hình environment** theo [ENVIRONMENT_GUIDE.md](ENVIRONMENT_GUIDE.md)
2. **Deploy frontend** với environment tương ứng
3. **Verify API connectivity** qua health check endpoints

## 🔐 Authentication Flow

1. **Đăng ký:** `POST /api/auth/register`
   ```json
   {
     "email": "user@example.com",
     "password": "123456",
     "confirmPassword": "123456",
     "roleId": 1
   }
   ```

2. **Đăng nhập:** `POST /api/auth/login`
   ```json
   {
     "email": "user@example.com",
     "password": "123456"
   }
   ```

3. **Sử dụng token:** `Authorization: Bearer {jwt_token}`

## 📝 Notes

- API sử dụng HTTPS với self-signed certificate
- JWT token được lưu trong localStorage
- Có 3 roles: CUSTOMER (1), EMPLOYEE (2), ADMIN (3)
