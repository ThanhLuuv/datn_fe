// Employee Controller
app.controller('EmployeeController', ['$scope', 'AuthService', 'APP_CONFIG', function($scope, AuthService, APP_CONFIG) {
    $scope.title = 'Employee Dashboard';
    $scope.stats = {
        pendingOrders: 0,
        todayOrders: 0,
        lowStockBooks: 0,
        todayRevenue: 0
    };
    
    $scope.recentOrders = [];
    $scope.notifications = [];
    $scope.lowStockBooks = [];

    // Initialize controller
    $scope.init = function() {
        $scope.loadStats();
        $scope.loadRecentOrders();
        $scope.loadNotifications();
        $scope.loadLowStockBooks();
    };

    // Load statistics
    $scope.loadStats = function() {
        // Mock data - in real app, this would come from API
        $scope.stats = {
            pendingOrders: 12,
            todayOrders: 25,
            lowStockBooks: 8,
            todayRevenue: 2500000
        };
    };

    // Load recent orders
    $scope.loadRecentOrders = function() {
        // Mock data - in real app, this would come from API
        $scope.recentOrders = [
            {
                orderId: 'ORD001',
                customer: 'Nguyễn Văn A',
                orderDate: new Date(),
                total: 150000,
                status: 'Chờ xử lý',
                statusClass: 'warning'
            },
            {
                orderId: 'ORD002',
                customer: 'Trần Thị B',
                orderDate: new Date(Date.now() - 3600000),
                total: 300000,
                status: 'Đã xử lý',
                statusClass: 'success'
            },
            {
                orderId: 'ORD003',
                customer: 'Lê Văn C',
                orderDate: new Date(Date.now() - 7200000),
                total: 200000,
                status: 'Đang giao',
                statusClass: 'info'
            },
            {
                orderId: 'ORD004',
                customer: 'Phạm Thị D',
                orderDate: new Date(Date.now() - 10800000),
                total: 450000,
                status: 'Chờ xử lý',
                statusClass: 'warning'
            }
        ];
    };

    // Load notifications
    $scope.loadNotifications = function() {
        // Mock data - in real app, this would come from API
        $scope.notifications = [
            {
                message: 'Có 5 đơn hàng mới cần xử lý',
                type: 'info'
            },
            {
                message: 'Sách "Lập trình AngularJS" sắp hết hàng',
                type: 'warning'
            },
            {
                message: 'Hệ thống sẽ bảo trì vào 2h sáng mai',
                type: 'info'
            }
        ];
    };

    // Load low stock books
    $scope.loadLowStockBooks = function() {
        // Mock data - in real app, this would come from API
        $scope.lowStockBooks = [
            {
                id: 1,
                title: 'Lập trình AngularJS',
                stock: 3
            },
            {
                id: 2,
                title: 'JavaScript ES6',
                stock: 5
            },
            {
                id: 3,
                title: 'Node.js cơ bản',
                stock: 2
            },
            {
                id: 4,
                title: 'React.js nâng cao',
                stock: 4
            }
        ];
    };

    // View order details
    $scope.viewOrder = function(order) {
        // In real app, this would open a modal or navigate to order details
        console.log('Viewing order:', order);
        showNotification('Xem chi tiết đơn hàng: ' + order.orderId, 'info');
    };

    // Process order
    $scope.processOrder = function(order) {
        // In real app, this would call API to update order status
        order.status = 'Đã xử lý';
        order.statusClass = 'success';
        showNotification('Đã xử lý đơn hàng: ' + order.orderId, 'success');
    };

    // Restock book
    $scope.restockBook = function(book) {
        // In real app, this would open a modal to input restock quantity
        book.stock += 10;
        showNotification('Đã nhập thêm 10 cuốn sách: ' + book.title, 'success');
    };

    // Test API endpoints
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

