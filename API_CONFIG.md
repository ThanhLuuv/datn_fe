# API Configuration - BookStore Frontend

## 🔗 API Backend

**Base URL:** `https://localhost:5256/api`

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

API configuration được định nghĩa trong `js/angular/app.config.js`:

```javascript
app.constant('APP_CONFIG', {
    API_BASE_URL: 'https://localhost:5256/api',
    API_TIMEOUT: 10000,
    // ... other config
});
```

## 🚀 Cách sử dụng

1. **Đảm bảo BookStore API đang chạy** trên `https://localhost:5256`
2. **Chạy Frontend** trên `http://localhost:3000`
3. **Test API** tại `http://localhost:3000/#!/api-test`

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
