# Cấu trúc dự án BookStore Frontend

## 📁 Cấu trúc thư mục

```
DATN_FE/
├── index.html                 # File HTML chính
├── package.json              # Cấu hình npm
├── README.md                 # Documentation
├── STRUCTURE.md              # Giải thích cấu trúc
├── .htaccess                 # Apache server config
├── web.config                # IIS server config
│
├── app/                      # AngularJS Templates & Assets
│   ├── views/               # HTML Templates
│   │   ├── home.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── about.html
│   │   ├── contact.html
│   │   ├── admin.html
│   │   ├── employee.html
│   │   └── api-test.html
│   ├── components/          # Reusable Components
│   │   └── card.html
│   └── assets/              # Static Assets
│       ├── images/          # Hình ảnh
│       ├── fonts/           # Fonts
│       └── icons/           # Icons
│
├── css/                     # Stylesheets
│   ├── bootstrap/           # Bootstrap CSS (custom)
│   └── custom/              # Custom CSS
│       ├── main.css         # Main styles
│       └── auth.css         # Authentication styles
│
├── js/                      # JavaScript Files
│   ├── angular/             # AngularJS Application
│   │   ├── app.js           # Main app module
│   │   ├── app.config.js    # App configuration
│   │   ├── controllers/     # Controllers
│   │   │   ├── homeController.js
│   │   │   ├── authController.js
│   │   │   ├── adminController.js
│   │   │   ├── employeeController.js
│   │   │   ├── aboutController.js
│   │   │   ├── contactController.js
│   │   │   └── apiTestController.js
│   │   ├── services/        # Services
│   │   │   ├── dataService.js
│   │   │   └── authService.js
│   │   ├── directives/      # Custom Directives
│   │   │   ├── customDirectives.js
│   │   │   └── authDirectives.js
│   │   └── filters/         # Custom Filters
│   │       └── customFilters.js
│   ├── custom/              # Custom JavaScript
│   │   └── main.js
│   └── jquery/              # jQuery files (empty)
│
├── data/                    # Data Files
│   └── json/                # JSON Data
│       ├── features.json
│       └── users.json
│
└── node_modules/            # Dependencies
```

## 🎯 Nguyên tắc tổ chức

### **1. Phân tách rõ ràng:**
- **`app/`** - Chỉ chứa templates HTML và assets tĩnh
- **`js/`** - Chứa tất cả JavaScript code
- **`css/`** - Chứa tất cả stylesheets

### **2. AngularJS Structure:**
- **Controllers** - Logic xử lý cho từng trang
- **Services** - Xử lý dữ liệu và API calls
- **Directives** - Custom components tái sử dụng
- **Filters** - Xử lý dữ liệu hiển thị

### **3. Templates:**
- **Views** - Các trang chính của ứng dụng
- **Components** - Các component tái sử dụng

## 🚀 Cách sử dụng

### **Chạy dự án:**
```bash
npm install
npm run dev
```

### **Truy cập:**
- **Trang chủ:** `http://localhost:3000/#!/home`
- **Đăng nhập:** `http://localhost:3000/#!/login`
- **Đăng ký:** `http://localhost:3000/#!/register`
- **API Test:** `http://localhost:3000/#!/api-test`

## 📝 Lưu ý

- **Không có thư mục trùng lặp** giữa `app/` và `js/`
- **Tất cả JavaScript** được đặt trong `js/angular/`
- **Tất cả templates** được đặt trong `app/views/`
- **Assets tĩnh** được đặt trong `app/assets/`

