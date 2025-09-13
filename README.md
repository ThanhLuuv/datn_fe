# Dự án Frontend - AngularJS + Bootstrap

Dự án Frontend được xây dựng sử dụng HTML5, CSS3, Bootstrap 5, jQuery và AngularJS 1.8.

## 🚀 Công nghệ sử dụng

- **HTML5** - Cấu trúc trang web
- **CSS3** - Styling và responsive design
- **Bootstrap 5** - UI framework
- **jQuery 3.7** - DOM manipulation và AJAX
- **AngularJS 1.8** - SPA framework
- **Bootstrap Icons** - Icon library

## 📁 Cấu trúc thư mục

```
DATN_FE/
├── index.html                 # File HTML chính
├── package.json              # Cấu hình npm
├── README.md                 # Documentation
├── app/                      # AngularJS application
│   ├── components/           # Reusable components
│   │   └── card.html
│   ├── views/               # Page templates
│   │   ├── home.html
│   │   ├── about.html
│   │   └── contact.html
│   ├── controllers/         # AngularJS controllers
│   │   ├── homeController.js
│   │   ├── aboutController.js
│   │   └── contactController.js
│   ├── services/            # AngularJS services
│   │   └── dataService.js
│   ├── directives/          # Custom directives
│   │   └── customDirectives.js
│   ├── filters/             # Custom filters
│   │   └── customFilters.js
│   └── assets/              # Static assets
│       ├── images/          # Hình ảnh
│       ├── fonts/           # Fonts
│       └── icons/           # Icons
├── css/                     # Stylesheets
│   ├── bootstrap/           # Bootstrap CSS (custom)
│   └── custom/              # Custom CSS
│       └── main.css
├── js/                      # JavaScript files
│   ├── angular/             # AngularJS files
│   │   ├── app.js
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── directives/
│   │   └── filters/
│   ├── jquery/              # jQuery files
│   └── custom/              # Custom JavaScript
│       └── main.js
└── data/                    # Data files
    └── json/                # JSON data
        ├── features.json
        └── users.json
```

## 🛠️ Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn

### Cài đặt dependencies
```bash
npm install
```

### Chạy dự án
```bash
# Chạy development server
npm run dev

# Hoặc chạy production server
npm start
```

Dự án sẽ chạy tại: `http://localhost:3000` (dev) hoặc `http://localhost:8080` (production)

## 📋 Tính năng

### Trang chủ (Home)
- Hiển thị danh sách tính năng
- Thêm/xóa tính năng động
- Thống kê tổng quan
- Responsive design

### Giới thiệu (About)
- Thông tin công ty
- Đội ngũ nhân viên
- Công nghệ sử dụng
- Sứ mệnh và tầm nhìn

### Liên hệ (Contact)
- Form liên hệ với validation
- Thông tin liên hệ
- Mạng xã hội
- Responsive form

## 🎨 Customization

### Thay đổi màu sắc
Chỉnh sửa file `css/custom/main.css`:
```css
:root {
    --primary-color: #0d6efd;    /* Màu chính */
    --secondary-color: #6c757d;  /* Màu phụ */
    /* ... */
}
```

### Thêm trang mới
1. Tạo controller trong `js/angular/controllers/`
2. Tạo view trong `app/views/`
3. Thêm route trong `js/angular/app.js`

### Thêm component mới
1. Tạo directive trong `js/angular/directives/`
2. Tạo template trong `app/components/`

## 📱 Responsive Design

Dự án được thiết kế responsive với Bootstrap 5:
- **Mobile**: < 768px
- **Tablet**: 768px - 992px
- **Desktop**: > 992px

## 🔧 Development

### Cấu trúc AngularJS
- **Module**: `myApp` (được định nghĩa trong `app.js`)
- **Routes**: Sử dụng `ngRoute` cho SPA
- **Services**: Quản lý dữ liệu và API calls
- **Directives**: Component tùy chỉnh
- **Filters**: Xử lý dữ liệu hiển thị

### jQuery Integration
- DOM manipulation
- Event handling
- AJAX calls
- Animation effects

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👥 Contributing

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📞 Support

Nếu có vấn đề gì, vui lòng tạo issue trên GitHub hoặc liên hệ qua email.
