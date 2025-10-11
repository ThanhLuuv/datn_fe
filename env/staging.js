// Staging Environment Configuration
window.ENV_CONFIG = {
    // API Configuration
    API_BASE_URL: 'https://staging-api.bookstore.com/api',
    API_TIMEOUT: 12000,
    
    // Application Settings
    APP_NAME: 'BookStore Frontend - Staging',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'Dự án Frontend sử dụng AngularJS + Bootstrap - Staging Mode',
    
    // Environment
    ENVIRONMENT: 'staging',
    DEBUG_MODE: true,
    
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
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_DEBUG_LOGS: true,
        ENABLE_API_LOGGING: true,
        ENABLE_PERFORMANCE_MONITORING: true
    }
};
