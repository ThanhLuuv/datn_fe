// Application Configuration
console.log('Loading APP_CONFIG...');

// Detect environment (avoid duplicate declarations)
var currentHost = window.location.hostname;
var isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '';
var isVercelHost = currentHost.includes('vercel.app') || currentHost.includes('now.sh');

// Fallback configuration
var fallbackConfig = {
    API_BASE_URL: isLocal ? 'http://localhost:5256/api' : 'https://bookstore-api-386583671447.asia-southeast1.run.app/api',
    API_TIMEOUT: 15000,
    APP_NAME: 'BookStore Frontend',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'Dự án Frontend sử dụng AngularJS + Bootstrap',
    ENVIRONMENT: isLocal ? 'development' : (isVercelHost ? 'production' : 'staging'),
    DEBUG_MODE: isLocal,
    ITEMS_PER_PAGE: 10,
    MAX_PAGES_DISPLAY: 5,
    DATE_FORMAT: 'dd/MM/yyyy',
    DATETIME_FORMAT: 'dd/MM/yyyy HH:mm:ss',
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[0-9]{10,11}$/,
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
    STORAGE_KEYS: {
        USER_TOKEN: 'user_token',
        USER_INFO: 'user_info',
        THEME: 'theme',
        LANGUAGE: 'language'
    },
    FEATURES: {
        ENABLE_DEBUG_LOGS: false,
        ENABLE_API_LOGGING: false,
        ENABLE_PERFORMANCE_MONITORING: true
    }
};

// Use ENV_CONFIG if available, otherwise use fallback
var config = window.ENV_CONFIG || fallbackConfig;

// Don't override if ENV_CONFIG already exists
if (!window.ENV_CONFIG) {
    window.ENV_CONFIG = config;
}

// Wait for AngularJS to be ready, then configure
(function() {
    function configureApp() {
        if (window.angular && window.angular.module) {
            var app = angular.module('myApp');
            app.constant('APP_CONFIG', config);
            app.constant('ENV', {
                DEVELOPMENT: 'development',
                STAGING: 'staging',
                PRODUCTION: 'production',
                CURRENT: config.ENVIRONMENT || 'production'
            });
            
            // Debug log
            console.log('APP_CONFIG loaded - Environment:', config.ENVIRONMENT);
            console.log('APP_CONFIG loaded - API_BASE_URL:', config.API_BASE_URL);
            console.log('APP_CONFIG loaded - Debug Mode:', config.DEBUG_MODE);
        } else {
            // Retry after 100ms
            setTimeout(configureApp, 100);
        }
    }
    
    configureApp();
})();
