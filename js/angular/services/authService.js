// Authentication Service
app.service('AuthService', ['$http', '$q', 'APP_CONFIG', function($http, $q, APP_CONFIG) {
    var baseUrl = APP_CONFIG.API_BASE_URL || 'https://localhost:5256/api';
    
    // Login function
    this.login = function(loginData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/auth/login',
            data: {
                email: loginData.email,
                password: loginData.password
            },
            headers: {
                'Content-Type': 'application/json'
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
                'Content-Type': 'application/json'
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

    // Check if user is admin
    this.isAdmin = function() {
        return this.hasRole(3);
    };

    // Check if user is employee
    this.isEmployee = function() {
        return this.hasRole(2);
    };

    // Check if user is customer
    this.isCustomer = function() {
        return this.hasRole(1);
    };

    // Check if user is staff (employee or admin)
    this.isStaff = function() {
        return this.isEmployee() || this.isAdmin();
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

