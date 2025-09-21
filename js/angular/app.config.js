// Application Configuration
console.log('Loading APP_CONFIG...');
app.constant('APP_CONFIG', {
    // API Configuration
    API_BASE_URL: 'http://localhost:5000/api',
    API_TIMEOUT: 10000,
    
    // Application Settings
    APP_NAME: 'My AngularJS App',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'Dự án Frontend sử dụng AngularJS + Bootstrap',
    
    // Pagination
    ITEMS_PER_PAGE: 10,
    MAX_PAGES_DISPLAY: 5,
    
    // Date Format
    DATE_FORMAT: 'dd/MM/yyyy',
    DATETIME_FORMAT: 'dd/MM/yyyy HH:mm:ss',
    
    // Validation
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[0-9]{10,11}$/,
    
    // Messages
    MESSAGES: {
        SUCCESS: 'Thao tác thành công!',
        ERROR: 'Có lỗi xảy ra, vui lòng thử lại!',
        LOADING: 'Đang tải dữ liệu...',
        NO_DATA: 'Không có dữ liệu',
        CONFIRM_DELETE: 'Bạn có chắc chắn muốn xóa?',
        REQUIRED_FIELD: 'Trường này là bắt buộc',
        INVALID_EMAIL: 'Email không hợp lệ',
        INVALID_PHONE: 'Số điện thoại không hợp lệ'
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        USER_TOKEN: 'user_token',
        USER_INFO: 'user_info',
        THEME: 'theme',
        LANGUAGE: 'language'
    }
});

    // Debug log
console.log('APP_CONFIG loaded - API_BASE_URL:', 'http://localhost:5000/api');

// Environment Configuration
app.constant('ENV', {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    CURRENT: 'development' // Change to 'production' when deploying
});
