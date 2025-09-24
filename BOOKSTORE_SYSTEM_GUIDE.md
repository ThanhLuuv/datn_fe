# 📚 HỆ THỐNG QUẢN LÝ NHÀ SÁCH - HƯỚNG DẪN SỬ DỤNG

## 🚀 Tổng quan hệ thống

Hệ thống quản lý nhà sách được xây dựng với AngularJS 1.8.2 và Bootstrap 5.3.0, hỗ trợ đầy đủ các chức năng quản lý sách, danh mục, đơn đặt hàng và phiếu nhập hàng với hệ thống phân quyền chi tiết.

## 👥 Phân quyền hệ thống

### 1. ADMIN (RoleId: 1) - Quản trị viên
- **Quyền hạn:** Tất cả quyền trong hệ thống
- **Chức năng:**
  - Quản lý danh mục sách (CRUD)
  - Quản lý sách/sản phẩm (CRUD)
  - Quản lý đơn đặt hàng (CRUD)
  - Quản lý phiếu nhập hàng (CRUD)
  - Xem tất cả dữ liệu

### 2. SALES_EMPLOYEE (RoleId: 2) - Nhân viên bán hàng
- **Quyền hạn:** Quản lý đơn đặt hàng và xem sách
- **Chức năng:**
  - Tạo và quản lý đơn đặt hàng
  - Xem danh sách sách và danh mục
  - Xem thông tin khách hàng

### 3. DELIVERY_EMPLOYEE (RoleId: 3) - Nhân viên giao hàng
- **Quyền hạn:** Quản lý phiếu nhập hàng
- **Chức năng:**
  - Tạo và quản lý phiếu nhập hàng
  - Xem đơn đặt hàng có thể tạo phiếu nhập
  - Xem danh sách sách và danh mục

### 4. CUSTOMER (RoleId: 4) - Khách hàng
- **Quyền hạn:** Chỉ xem sách và danh mục
- **Chức năng:**
  - Xem danh sách sách
  - Xem danh mục sách
  - Tìm kiếm sách theo danh mục

## 🏗️ Cấu trúc hệ thống

### Frontend Architecture
```
DATN_FE/
├── app/
│   ├── views/                 # Các view templates
│   │   ├── categories.html    # Xem danh mục
│   │   ├── admin-categories.html # Quản lý danh mục
│   │   ├── books.html         # Xem sách
│   │   ├── admin-books.html   # Quản lý sách
│   │   ├── admin-purchase-orders.html # Quản lý đơn đặt hàng
│   │   └── admin-goods-receipts.html  # Quản lý phiếu nhập
│   └── components/            # Các component HTML
├── js/
│   ├── angular/
│   │   ├── app.js            # Cấu hình routing
│   │   ├── app.config.js     # Cấu hình ứng dụng
│   │   ├── services/         # Các service
│   │   │   ├── authService.js
│   │   │   ├── dataService.js
│   │   └── └── bookstoreService.js
│   │   ├── controllers/      # Các controller
│   │   │   ├── authController.js
│   │   │   ├── categoryController.js
│   │   │   ├── bookController.js
│   │   │   ├── purchaseOrderController.js
│   │   └── └── goodsReceiptController.js
│   │   ├── directives/       # Các directive
│   │   │   ├── permissionDirectives.js
│   │   └── └── commonDirectives.js
│   │   └── filters/          # Các filter
│   │       └── bookstoreFilters.js
│   └── custom/
│       └── main.js          # JavaScript tùy chỉnh
└── css/                     # Stylesheets
```

## 🔧 Các component chung

### 1. Directives phân quyền
- `admin-only`: Chỉ hiển thị cho ADMIN
- `sales-only`: Hiển thị cho SALES_EMPLOYEE và ADMIN
- `delivery-only`: Hiển thị cho DELIVERY_EMPLOYEE và ADMIN
- `staff-only`: Hiển thị cho tất cả nhân viên và ADMIN
- `can-manage-categories`: Quyền quản lý danh mục
- `can-manage-products`: Quyền quản lý sản phẩm
- `can-manage-purchase-orders`: Quyền quản lý đơn đặt hàng
- `can-manage-goods-receipts`: Quyền quản lý phiếu nhập

### 2. Directives UI chung
- `loading-spinner`: Hiển thị loading
- `empty-state`: Hiển thị trạng thái rỗng
- `error-state`: Hiển thị lỗi
- `success-message`: Hiển thị thông báo thành công
- `pagination`: Phân trang
- `search-box`: Hộp tìm kiếm
- `confirm-dialog`: Dialog xác nhận

### 3. Filters chung
- `currency`: Format tiền tệ
- `date`: Format ngày
- `datetime`: Format ngày giờ
- `roleDisplayName`: Tên hiển thị role
- `truncate`: Cắt ngắn text
- `highlight`: Highlight từ khóa tìm kiếm

## 📋 Chức năng chính

### 1. Quản lý danh mục (Categories)
- **Xem danh mục:** `/categories`
- **Quản lý danh mục:** `/admin/categories`
- **API endpoints:**
  - `GET /api/category` - Lấy danh sách
  - `GET /api/category/{id}` - Lấy chi tiết
  - `POST /api/category` - Tạo mới (ADMIN)
  - `PUT /api/category/{id}` - Cập nhật (ADMIN)

### 2. Quản lý sách (Books)
- **Xem sách:** `/books`
- **Quản lý sách:** `/admin/books`
- **API endpoints:**
  - `GET /api/book` - Lấy danh sách
  - `GET /api/book/{isbn}` - Lấy chi tiết
  - `GET /api/book/authors` - Lấy danh sách tác giả
  - `POST /api/book/authors` - Tạo tác giả (ADMIN)

### 3. Quản lý đơn đặt hàng (Purchase Orders)
- **Quản lý đơn đặt hàng:** `/admin/purchase-orders`
- **API endpoints:**
  - `GET /api/purchaseorder` - Lấy danh sách
  - `POST /api/purchaseorder` - Tạo mới (SALES_EMPLOYEE/ADMIN)

### 4. Quản lý phiếu nhập (Goods Receipts)
- **Quản lý phiếu nhập:** `/admin/goods-receipts`
- **API endpoints:**
  - `GET /api/goodsreceipt` - Lấy danh sách
  - `GET /api/goodsreceipt/available-purchase-orders` - Lấy đơn có thể tạo phiếu nhập
  - `POST /api/goodsreceipt` - Tạo mới (DELIVERY_EMPLOYEE/ADMIN)

## 🔐 Xác thực và bảo mật

### 1. JWT Authentication
- Token được lưu trong localStorage
- Tự động thêm vào header Authorization
- Kiểm tra quyền truy cập cho mỗi route

### 2. Route Protection
- Sử dụng `resolve` trong routing
- Kiểm tra quyền trước khi load view
- Redirect về login nếu không có quyền

### 3. UI Permission Control
- Sử dụng directives để ẩn/hiện elements
- Kiểm tra quyền trong controller
- Hiển thị thông báo lỗi phù hợp

## 🎨 Giao diện người dùng

### 1. Responsive Design
- Sử dụng Bootstrap 5.3.0
- Responsive trên mọi thiết bị
- Mobile-first approach

### 2. Modern UI Components
- Cards cho hiển thị dữ liệu
- Tables cho danh sách
- Modals cho forms
- Alerts cho thông báo

### 3. User Experience
- Loading states
- Error handling
- Success feedback
- Intuitive navigation

## 🚀 Hướng dẫn sử dụng

### 1. Khởi động hệ thống
```bash
# Mở file index.html trong browser
# Hoặc sử dụng live server
npx live-server
```

### 2. Đăng nhập
- Truy cập `/login`
- Sử dụng tài khoản demo:
  - Admin: `admin@bookstore.com` / `123456`
  - Sales: `sales@bookstore.com` / `123456`
  - Delivery: `delivery@bookstore.com` / `123456`
  - Customer: `customer@bookstore.com` / `123456`

### 3. Sử dụng các chức năng
- **Xem sách:** Truy cập `/books`
- **Xem danh mục:** Truy cập `/categories`
- **Quản lý:** Sử dụng menu admin (chỉ ADMIN)
- **Tạo đơn đặt hàng:** Menu "Đơn đặt hàng" (SALES/ADMIN)
- **Tạo phiếu nhập:** Menu "Phiếu nhập" (DELIVERY/ADMIN)

## 🔧 Cấu hình API

### 1. Base URL
```javascript
// Trong app.config.js
API_BASE_URL: 'http://localhost:5000/api'
```

### 2. Authentication Headers
```javascript
// Tự động thêm vào mọi request
headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
}
```

## 📝 Ghi chú quan trọng

1. **API Compatibility:** Hệ thống được thiết kế để tương thích với API backend đã cung cấp
2. **Error Handling:** Xử lý lỗi chi tiết với thông báo phù hợp
3. **Performance:** Sử dụng pagination và lazy loading
4. **Security:** Kiểm tra quyền ở cả frontend và backend
5. **Maintainability:** Code được tổ chức theo module rõ ràng

## 🐛 Troubleshooting

### 1. Lỗi kết nối API
- Kiểm tra API server có chạy không
- Kiểm tra CORS settings
- Kiểm tra URL trong app.config.js

### 2. Lỗi phân quyền
- Kiểm tra token có hợp lệ không
- Kiểm tra roleId trong localStorage
- Kiểm tra route protection

### 3. Lỗi hiển thị
- Kiểm tra console browser
- Kiểm tra network requests
- Kiểm tra AngularJS errors

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Console browser để xem lỗi
2. Network tab để xem API calls
3. LocalStorage để xem token và user info
4. API documentation tại `/swagger`

---

**🎉 Chúc bạn sử dụng hệ thống hiệu quả!**


