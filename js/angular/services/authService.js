// Authentication Service
console.log('Loading AuthService...');
app.service('AuthService', ['$http', '$q', 'APP_CONFIG', function($http, $q, APP_CONFIG) {
    console.log('AuthService - APP_CONFIG received:', APP_CONFIG);
    var baseUrl = APP_CONFIG.API_BASE_URL || 'https://api-datn.thanhlaptrinh.online/api';
    
    // Debug log
    console.log('AuthService - API Base URL:', baseUrl);
    console.log('APP_CONFIG.API_BASE_URL:', APP_CONFIG.API_BASE_URL);
    
    // Login function
    this.login = function(loginData) {
        console.log('AUTHSERVICE.LOGIN CALLED!');
        console.log('Login data:', loginData);
        var loginUrl = baseUrl + '/auth/login';
        console.log('Login URL:', loginUrl);
        
        return $http({
            method: 'POST',
            url: loginUrl,
            data: {
                email: loginData.email,
                password: loginData.password
            },
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    };

    // Register function
    this.register = function(registerData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/auth/register',
            data: registerData,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    };

    // Logout function
    this.logout = function() {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // In a real application, you might want to call a logout endpoint
        // to invalidate the token on the server
        return $q.resolve();
    };

    // Check if user is authenticated
    this.isAuthenticated = function() {
        var token = localStorage.getItem('token');
        return token && token.length > 0;
    };

    // Get current user
    this.getCurrentUser = function() {
        var userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    // Get token
    this.getToken = function() {
        return localStorage.getItem('token');
    };

    // Check if user has specific role
    this.hasRole = function(roleId) {
        var user = this.getCurrentUser();
        return user && user.roleId === roleId;
    };

    // Role mapping (DB): CUSTOMER=1, SALES=2, ADMIN=3, DELIVERY=4
    this.isAdmin = function() {
        return this.hasRole(3);
    };

    this.isSalesEmployee = function() {
        return this.hasRole(2);
    };

    this.isDeliveryEmployee = function() {
        return this.hasRole(4);
    };

    this.isCustomer = function() {
        return this.hasRole(1);
    };

    // Check if user is staff (sales, delivery employee or admin)
    this.isStaff = function() {
        return this.isSalesEmployee() || this.isDeliveryEmployee() || this.isAdmin();
    };

    // Check if user is admin or teacher (admin or sales employee)
    this.isAdminOrTeacher = function() {
        return this.isAdmin() || this.isSalesEmployee();
    };

    // Check if user can manage categories (admin only)
    this.canManageCategories = function() {
        return this.isAdmin();
    };

    // Check if user can manage products (admin only)
    this.canManageProducts = function() {
        return this.isAdmin();
    };

    // Check if user can manage purchase orders (sales employee and admin)
    this.canManagePurchaseOrders = function() {
        return this.isSalesEmployee() || this.isAdmin();
    };

    // Check if user can manage goods receipts (delivery employee and admin)
    this.canManageGoodsReceipts = function() {
        return this.isDeliveryEmployee() || this.isAdmin();
    };

    // Check if user can view books and categories (all authenticated users)
    this.canViewBooks = function() {
        return this.isAuthenticated();
    };

    // Test API endpoints
    this.testPublic = function() {
        return $http.get(baseUrl + '/test/public');
    };

    this.testProtected = function() {
        var token = this.getToken();
        return $http({
            method: 'GET',
            url: baseUrl + '/test/protected',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    };

    this.testAdminOnly = function() {
        var token = this.getToken();
        return $http({
            method: 'GET',
            url: baseUrl + '/test/admin-only',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    };

    this.testStaffOnly = function() {
        var token = this.getToken();
        return $http({
            method: 'GET',
            url: baseUrl + '/test/staff-only',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    };

    // Refresh token (if implemented in backend)
    this.refreshToken = function() {
        var token = this.getToken();
        if (!token) {
            return $q.reject('No token available');
        }

        return $http({
            method: 'POST',
            url: baseUrl + '/auth/refresh',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }).then(function(response) {
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                return response.data.token;
            }
            return token;
        });
    };

    // Validate token
    this.validateToken = function() {
        var token = this.getToken();
        if (!token) {
            return $q.reject('No token available');
        }

        return $http({
            method: 'GET',
            url: baseUrl + '/auth/validate',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    };
}]);

