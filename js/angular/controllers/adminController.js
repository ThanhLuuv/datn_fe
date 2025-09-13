// Admin Controller
app.controller('AdminController', ['$scope', 'AuthService', 'APP_CONFIG', function($scope, AuthService, APP_CONFIG) {
    $scope.title = 'Admin Dashboard';
    $scope.stats = {
        totalUsers: 0,
        totalBooks: 0,
        todayOrders: 0,
        monthlyRevenue: 0,
        growthRate: 0,
        newUsers: 0,
        soldBooks: 0
    };
    
    $scope.recentActivities = [];

    // Initialize controller
    $scope.init = function() {
        $scope.loadStats();
        $scope.loadRecentActivities();
    };

    // Load statistics
    $scope.loadStats = function() {
        // Mock data - in real app, this would come from API
        $scope.stats = {
            totalUsers: 1250,
            totalBooks: 3500,
            todayOrders: 45,
            monthlyRevenue: 125000000,
            growthRate: 12.5,
            newUsers: 25,
            soldBooks: 180
        };
    };

    // Load recent activities
    $scope.loadRecentActivities = function() {
        // Mock data - in real app, this would come from API
        $scope.recentActivities = [
            {
                timestamp: new Date(),
                user: 'admin@bookstore.com',
                action: 'Đăng nhập',
                type: 'success',
                details: 'Đăng nhập vào hệ thống'
            },
            {
                timestamp: new Date(Date.now() - 300000),
                user: 'user@example.com',
                action: 'Mua sách',
                type: 'info',
                details: 'Mua 2 cuốn sách'
            },
            {
                timestamp: new Date(Date.now() - 600000),
                user: 'staff@bookstore.com',
                action: 'Cập nhật',
                type: 'warning',
                details: 'Cập nhật thông tin sách'
            },
            {
                timestamp: new Date(Date.now() - 900000),
                user: 'user2@example.com',
                action: 'Đăng ký',
                type: 'primary',
                details: 'Tạo tài khoản mới'
            }
        ];
    };

    // Test API endpoints
    $scope.testPublicAPI = function() {
        AuthService.testPublic()
            .then(function(response) {
                console.log('Public API test:', response.data);
                showNotification('Public API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Public API test failed:', error);
                showNotification('Public API không hoạt động!', 'danger');
            });
    };

    $scope.testProtectedAPI = function() {
        AuthService.testProtected()
            .then(function(response) {
                console.log('Protected API test:', response.data);
                showNotification('Protected API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Protected API test failed:', error);
                showNotification('Protected API không hoạt động!', 'danger');
            });
    };

    $scope.testAdminAPI = function() {
        AuthService.testAdminOnly()
            .then(function(response) {
                console.log('Admin API test:', response.data);
                showNotification('Admin API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Admin API test failed:', error);
                showNotification('Admin API không hoạt động!', 'danger');
            });
    };

    $scope.testStaffAPI = function() {
        AuthService.testStaffOnly()
            .then(function(response) {
                console.log('Staff API test:', response.data);
                showNotification('Staff API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Staff API test failed:', error);
                showNotification('Staff API không hoạt động!', 'danger');
            });
    };

    // Initialize when controller loads
    $scope.init();
}]);

