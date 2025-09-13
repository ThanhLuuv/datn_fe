// API Test Controller
app.controller('ApiTestController', ['$scope', 'AuthService', function($scope, AuthService) {
    $scope.title = 'API Test Dashboard';
    
    // Authentication status
    $scope.isAuthenticated = AuthService.isAuthenticated();
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.token = AuthService.getToken();
    $scope.isAdmin = AuthService.isAdmin();
    $scope.isStaff = AuthService.isStaff();
    
    // API test results
    $scope.publicApiResult = null;
    $scope.protectedApiResult = null;
    $scope.adminApiResult = null;
    $scope.staffApiResult = null;

    // Test Public API
    $scope.testPublicAPI = function() {
        $scope.publicApiResult = null;
        
        AuthService.testPublic()
            .then(function(response) {
                $scope.publicApiResult = {
                    success: true,
                    message: 'Public API hoạt động bình thường!',
                    data: response.data
                };
            })
            .catch(function(error) {
                $scope.publicApiResult = {
                    success: false,
                    message: 'Public API không hoạt động: ' + (error.data ? error.data.message : error.statusText),
                    data: error.data
                };
            });
    };

    // Test Protected API
    $scope.testProtectedAPI = function() {
        $scope.protectedApiResult = null;
        
        AuthService.testProtected()
            .then(function(response) {
                $scope.protectedApiResult = {
                    success: true,
                    message: 'Protected API hoạt động bình thường!',
                    data: response.data
                };
            })
            .catch(function(error) {
                $scope.protectedApiResult = {
                    success: false,
                    message: 'Protected API không hoạt động: ' + (error.data ? error.data.message : error.statusText),
                    data: error.data
                };
            });
    };

    // Test Admin API
    $scope.testAdminAPI = function() {
        $scope.adminApiResult = null;
        
        AuthService.testAdminOnly()
            .then(function(response) {
                $scope.adminApiResult = {
                    success: true,
                    message: 'Admin API hoạt động bình thường!',
                    data: response.data
                };
            })
            .catch(function(error) {
                $scope.adminApiResult = {
                    success: false,
                    message: 'Admin API không hoạt động: ' + (error.data ? error.data.message : error.statusText),
                    data: error.data
                };
            });
    };

    // Test Staff API
    $scope.testStaffAPI = function() {
        $scope.staffApiResult = null;
        
        AuthService.testStaffOnly()
            .then(function(response) {
                $scope.staffApiResult = {
                    success: true,
                    message: 'Staff API hoạt động bình thường!',
                    data: response.data
                };
            })
            .catch(function(error) {
                $scope.staffApiResult = {
                    success: false,
                    message: 'Staff API không hoạt động: ' + (error.data ? error.data.message : error.statusText),
                    data: error.data
                };
            });
    };

    // Logout function
    $scope.logout = function() {
        AuthService.logout();
        $scope.isAuthenticated = false;
        $scope.currentUser = null;
        $scope.token = null;
        $scope.isAdmin = false;
        $scope.isStaff = false;
        
        // Clear all test results
        $scope.publicApiResult = null;
        $scope.protectedApiResult = null;
        $scope.adminApiResult = null;
        $scope.staffApiResult = null;
        
        showNotification('Đã đăng xuất thành công!', 'success');
    };
}]);

