// Customer Orders Controller
app.controller('CustomerOrdersController', ['$scope', '$rootScope', 'BookstoreService', 'AuthService', '$location', function($scope, $rootScope, BookstoreService, AuthService, $location) {
    // Check authentication
    if (!AuthService.isAuthenticated()) {
        $location.path('/login');
        return;
    }

    $scope.title = 'Đơn hàng của tôi';
    $scope.loading = false;
    $scope.orders = [];
    $scope.selectedOrder = null;

    // Load customer orders
    $scope.loadOrders = function() {
        $scope.loading = true;
        BookstoreService.getMyOrders({
            pageNumber: 1,
            pageSize: 50
        }).then(function(response) {
            var payload = response && response.data ? response.data : null;
            var list = [];
            if (payload && payload.data && Array.isArray(payload.data.orders)) {
                list = payload.data.orders;
            }
            $scope.orders = list;
            $scope.loading = false;
        }).catch(function(error) {
            $scope.loading = false;
            console.error('Error loading orders:', error);
            if (window.showNotification) {
                window.showNotification('Không thể tải danh sách đơn hàng', 'danger');
            }
        });
    };

    // Get status class for badge
    $scope.getStatusClass = function(status) {
        // Handle both string and numeric status
        var statusValue = typeof status === 'number' ? status : status;
        switch(statusValue) {
            case 0:
            case 'Paid':
                return 'bg-success';
            case 1:
            case 'Assigned':
                return 'bg-info';
            case 2:
            case 'Delivered':
                return 'bg-success';
            case 3:
            case 'PendingPayment':
                return 'bg-warning';
            case 4:
            case 'Cancelled':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    // Get status text
    $scope.getStatusText = function(status) {
        // Handle both string and numeric status
        var statusValue = typeof status === 'number' ? status : status;
        switch(statusValue) {
            case 0:
            case 'Paid':
                return 'Đã thanh toán';
            case 1:
            case 'Assigned':
                return 'Đã phân công';
            case 2:
            case 'Delivered':
                return 'Đã giao';
            case 3:
            case 'PendingPayment':
                return 'Chờ thanh toán';
            case 4:
            case 'Cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    // View order detail
    $scope.viewOrderDetail = function(order) {
        $scope.selectedOrder = angular.copy(order);
        
        // Ensure lines array exists
        if (!$scope.selectedOrder.lines || !Array.isArray($scope.selectedOrder.lines)) {
            $scope.selectedOrder.lines = [];
        }

        // Show modal
        setTimeout(function() {
            var el = document.getElementById('orderDetailModal');
            if (!el) return;
            try {
                var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
                if (modal) modal.show();
            } catch (e) {
                if (el.showModal) el.showModal();
            }
        }, 0);
    };

    // Initialize
    $scope.loadOrders();
}]);
