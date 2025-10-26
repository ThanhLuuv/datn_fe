// Employee Controller
app.controller('EmployeeController', ['$scope', 'AuthService', 'BookstoreService', 'APP_CONFIG', function($scope, AuthService, BookstoreService, APP_CONFIG) {
    $scope.title = 'Employee Dashboard';
    $scope.stats = {
        pendingOrders: 0,
        todayOrders: 0,
        shippingOrders: 0
    };
    
    $scope.recentOrders = [];
    $scope.selectedOrder = null;

    // Initialize controller
    $scope.init = function() {
        $scope.loadRecentOrders();
    };

    // Update stats from real order data
    $scope.updateStatsFromOrders = function() {
        if (!$scope.recentOrders || $scope.recentOrders.length === 0) {
            $scope.stats = { pendingOrders: 0, todayOrders: 0, shippingOrders: 0 };
            return;
        }

        var today = new Date();
        today.setHours(0, 0, 0, 0);
        
        var pendingOrders = 0;
        var todayOrders = 0;
        var shippingOrders = 0;

        $scope.recentOrders.forEach(function(order) {
            // Count by status - check both string and number
            if (order.status === 'Confirmed' || order.status === 1) {
                shippingOrders++; // Đơn đã xác nhận, cần giao hàng
            }

            // Count today's orders
            var orderDate = new Date(order.placedAt || order.orderDate);
            orderDate.setHours(0, 0, 0, 0);
            if (orderDate.getTime() === today.getTime()) {
                todayOrders++;
            }
        });

        $scope.stats = {
            pendingOrders: pendingOrders,
            todayOrders: todayOrders,
            shippingOrders: shippingOrders
        };
    };

    // Load recent orders
    $scope.loadRecentOrders = function() {
        $scope.loading = true;
        
        // Load orders assigned to this delivery employee
        BookstoreService.getMyAssignedOrders({
            pageNumber: 1,
            pageSize: 50
        }).then(function(response) {
            if (response.data && response.data.success) {
                var orders = response.data.data.orders || [];
                
                // Map API data to expected format
                $scope.recentOrders = orders.map(function(order) {
                    return {
                        orderId: order.orderId,
                        customer: order.customerName,
                        orderDate: order.placedAt,
                        total: order.totalAmount,
                        status: order.status, // Keep as string from API
                        receiverName: order.receiverName,
                        receiverPhone: order.receiverPhone,
                        shippingAddress: order.shippingAddress,
                        deliveryDate: order.deliveryDate,
                        lines: order.lines || [],
                        cancelReason: (order.status === 'Cancelled' || order.status === 3) ? order.note : null
                    };
                });
                
                console.log('Loaded assigned orders:', $scope.recentOrders);
                
                // Update stats based on real data
                $scope.updateStatsFromOrders();
            } else {
                console.log('No assigned orders found');
                $scope.recentOrders = [];
                $scope.stats = { pendingOrders: 0, todayOrders: 0, shippingOrders: 0 };
            }
        }).catch(function(error) {
            console.error('Error loading assigned orders:', error);
            $scope.recentOrders = [];
            $scope.stats = { pendingOrders: 0, todayOrders: 0, shippingOrders: 0 };
            showNotification('Không thể tải danh sách đơn hàng: ' + (error.data?.message || 'Lỗi không xác định'), 'danger');
        }).finally(function() {
            $scope.loading = false;
        });
    };


    // View order details
    $scope.viewOrderDetail = function(order) {
        // Load detailed order information from API
        BookstoreService.getOrderById(order.orderId).then(function(response) {
            if (response.data && response.data.success) {
                var orderData = response.data.data;
                
                // Map API data to expected format for modal
                $scope.selectedOrder = {
                    orderId: orderData.orderId,
                    customerName: orderData.customerName,
                    placedAt: orderData.placedAt,
                    totalAmount: orderData.totalAmount,
                    status: orderData.status, // Keep as string from API
                    receiverName: orderData.receiverName,
                    receiverPhone: orderData.receiverPhone,
                    shippingAddress: orderData.shippingAddress,
                    deliveryDate: orderData.deliveryDate,
                    lines: orderData.lines || [],
                    invoice: orderData.invoice,
                    paymentUrl: orderData.paymentUrl,
                    cancelReason: (orderData.status === 'Cancelled' || orderData.status === 3) ? orderData.note : null
                };
                
                console.log('Loaded order details:', $scope.selectedOrder);
            } else {
                // Fallback to basic order info
                $scope.selectedOrder = order;
                console.log('Using basic order info:', $scope.selectedOrder);
            }
        }).catch(function(error) {
            console.error('Error loading order details:', error);
            // Fallback to basic order info
            $scope.selectedOrder = order;
            showNotification('Không thể tải chi tiết đơn hàng, hiển thị thông tin cơ bản', 'warning');
        });
    };

    // View order details (legacy function)
    $scope.viewOrder = function(order) {
        $scope.viewOrderDetail(order);
        showNotification('Xem chi tiết đơn hàng: ' + order.orderId, 'info');
    };

    // Process order (Approve order) - Chuyển từ PendingConfirmation (0) → Confirmed (1)
    $scope.processOrder = function(order) {
        BookstoreService.approveOrder(order.orderId, {
            approved: true,
            note: 'Đơn hàng đã được duyệt bởi nhân viên giao hàng'
        }).then(function(response) {
            if (response.data && response.data.success) {
                showNotification('Đã duyệt đơn hàng: ' + order.orderId, 'success');
                
                // Reload orders to get updated data
                $scope.loadRecentOrders();
            } else {
                showNotification('Không thể duyệt đơn hàng: ' + (response.data.message || 'Lỗi không xác định'), 'danger');
            }
        }).catch(function(error) {
            console.error('Error approving order:', error);
            showNotification('Có lỗi xảy ra khi duyệt đơn hàng', 'danger');
        });
    };

    // Ship order (Assign delivery) - Chuyển từ PendingConfirmation (0) → Confirmed (1)
    $scope.shipOrder = function(order) {
        BookstoreService.assignOrderDelivery(order.orderId, {
            deliveryEmployeeId: AuthService.getCurrentUser().userId,
            deliveryDate: new Date().toISOString()
        }).then(function(response) {
            if (response.data && response.data.success) {
                showNotification('Đã phân công giao hàng: ' + order.orderId, 'success');
                
                // Reload orders to get updated data
                $scope.loadRecentOrders();
            } else {
                showNotification('Không thể phân công giao hàng: ' + (response.data.message || 'Lỗi không xác định'), 'danger');
            }
        }).catch(function(error) {
            console.error('Error assigning delivery:', error);
            showNotification('Có lỗi xảy ra khi phân công giao hàng', 'danger');
        });
    };

    // Confirm delivery - Chuyển từ Confirmed (1) → Delivered (2)
    $scope.confirmDelivery = function(order) {
        BookstoreService.confirmOrderDelivered(order.orderId, {
            success: true,
            note: 'Đã giao hàng thành công cho khách hàng'
        }).then(function(response) {
            if (response.data && response.data.success) {
                showNotification('Đã xác nhận giao hàng thành công: ' + order.orderId, 'success');
                
                // Reload orders to get updated data
                $scope.loadRecentOrders();
            } else {
                showNotification('Không thể xác nhận giao hàng: ' + (response.data.message || 'Lỗi không xác định'), 'danger');
            }
        }).catch(function(error) {
            console.error('Error confirming delivery:', error);
            showNotification('Có lỗi xảy ra khi xác nhận giao hàng', 'danger');
        });
    };

    // Cancel order - Chuyển sang Cancelled (3)
    $scope.cancelOrder = function(order) {
        // Show modal for cancel reason
        $scope.cancelOrderData = {
            orderId: order.orderId,
            reason: '',
            note: ''
        };
        
        // Show cancel modal
        var cancelModal = new bootstrap.Modal(document.getElementById('cancelOrderModal'));
        cancelModal.show();
    };

    // Confirm cancel order
    $scope.confirmCancelOrder = function() {
        if (!$scope.cancelOrderData.reason.trim()) {
            showNotification('Vui lòng nhập lý do hủy đơn hàng', 'warning');
            return;
        }

        BookstoreService.cancelOrder($scope.cancelOrderData.orderId, {
            reason: $scope.cancelOrderData.reason,
            note: $scope.cancelOrderData.note || ''
        }).then(function(response) {
            if (response.data && response.data.success) {
                showNotification('Đã hủy đơn hàng thành công: ' + $scope.cancelOrderData.orderId, 'success');
                
                // Hide modal
                var cancelModal = bootstrap.Modal.getInstance(document.getElementById('cancelOrderModal'));
                cancelModal.hide();
                
                // Reload orders to get updated data
                $scope.loadRecentOrders();
            } else {
                showNotification('Không thể hủy đơn hàng: ' + (response.data.message || 'Lỗi không xác định'), 'danger');
            }
        }).catch(function(error) {
            console.error('Error cancelling order:', error);
            showNotification('Có lỗi xảy ra khi hủy đơn hàng', 'danger');
        });
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

