// Employee Controller
app.controller('EmployeeController', ['$scope', 'AuthService', 'BookstoreService', 'APP_CONFIG', function ($scope, AuthService, BookstoreService, APP_CONFIG) {
    $scope.title = 'Employee Dashboard';
    // Thông tin nhân viên giao hàng hiện tại
    $scope.currentUser = AuthService.getCurrentUser ? (AuthService.getCurrentUser() || {}) : {};
    $scope.stats = {
        pendingOrders: 0,
        todayOrders: 0,
        shippingOrders: 0
    };

    $scope.recentOrders = [];
    $scope.selectedOrder = null;

    // Tabs state
    $scope.selectedTab = 'all'; // all | confirmed | delivered
    $scope.setTab = function (tab) {
        $scope.selectedTab = tab;
    };

    // Filter orders by tab
    $scope.filteredOrders = [];
    $scope.$watch('recentOrders', function (newVal) {
        if (!newVal) return;
        $scope.updateFilteredOrders();
    }, true);

    $scope.$watch('selectedTab', function () {
        $scope.updateFilteredOrders();
    });

    $scope.updateFilteredOrders = function () {
        if (!$scope.recentOrders || $scope.recentOrders.length === 0) {
            $scope.filteredOrders = [];
            return;
        }

        if ($scope.selectedTab === 'all') {
            $scope.filteredOrders = $scope.recentOrders;
        } else if ($scope.selectedTab === 'confirmed') {
            // Đơn đang giao = Confirmed (1)
            $scope.filteredOrders = $scope.recentOrders.filter(function (order) {
                return order.deliveryStatus === 'Confirmed' || order.deliveryStatus === 1;
            });
        } else if ($scope.selectedTab === 'delivered') {
            // Đơn đã giao = Delivered (2)
            $scope.filteredOrders = $scope.recentOrders.filter(function (order) {
                return order.deliveryStatus === 'Delivered' || order.deliveryStatus === 2;
            });
        } else {
            $scope.filteredOrders = $scope.recentOrders;
        }
    };

    // Helper function to get delivery status class
    $scope.getDeliveryStatusClass = function (status) {
        if (!status && status !== 0) return 'bg-secondary';
        var statusValue = typeof status === 'number' ? status : status;
        if (statusValue === 'Confirmed' || statusValue === 1) return 'bg-primary';
        if (statusValue === 'Delivered' || statusValue === 2) return 'bg-success';
        if (statusValue === 'Cancelled' || statusValue === 3) return 'bg-danger';
        if (statusValue === 'PendingConfirmation' || statusValue === 0) return 'bg-warning';
        return 'bg-secondary';
    };

    // Helper function to get delivery status text
    $scope.getDeliveryStatusText = function (status) {
        if (!status && status !== 0) return 'Không xác định';
        var statusValue = typeof status === 'number' ? status : status;
        if (statusValue === 'Confirmed' || statusValue === 1) return 'Đã xác nhận';
        if (statusValue === 'Delivered' || statusValue === 2) return 'Đã giao';
        if (statusValue === 'Cancelled' || statusValue === 3) return 'Đã hủy';
        if (statusValue === 'PendingConfirmation' || statusValue === 0) return 'Chờ xác nhận';
        return statusValue || 'Không xác định';
    };

    // Initialize controller
    $scope.init = function () {
        $scope.loadRecentOrders();
    };

    // Update stats from real order data
    $scope.updateStatsFromOrders = function () {
        if (!$scope.recentOrders || $scope.recentOrders.length === 0) {
            $scope.stats = { pendingOrders: 0, todayOrders: 0, shippingOrders: 0 };
            return;
        }

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var pendingOrders = 0;
        var todayOrders = 0;
        var shippingOrders = 0;

        $scope.recentOrders.forEach(function (order) {
            // Count by status - check both string and number
            if (order.deliveryStatus === 'Confirmed' || order.deliveryStatus === 1) {
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
    $scope.loadRecentOrders = function () {
        $scope.loading = true;

        // Load orders assigned to this delivery employee
        BookstoreService.getMyAssignedOrders({
            pageNumber: 1,
            pageSize: 50
        }).then(function (response) {
            if (response.data && response.data.success) {
                var orders = response.data.data.orders || [];

                // Map API data to expected format
                $scope.recentOrders = orders.map(function (order) {
                    // Normalize status - try multiple possible fields from API
                    var normalizedStatus = order.deliveryStatus;
                    if (normalizedStatus === null || normalizedStatus === undefined) {
                        normalizedStatus = order.status;
                    }
                    if (normalizedStatus === null || normalizedStatus === undefined) {
                        normalizedStatus = order.statusId;
                    }
                    if (normalizedStatus === null || normalizedStatus === undefined) {
                        normalizedStatus = order.orderStatus;
                    }

                    var mapped = {
                        orderId: order.orderId,
                        customer: order.customerName,
                        orderDate: order.placedAt,
                        total: order.totalAmount,
                        // both generic status & dedicated deliveryStatus để tránh conflict chỗ khác
                        status: normalizedStatus,
                        deliveryStatus: normalizedStatus,
                        receiverName: order.receiverName,
                        receiverPhone: order.receiverPhone,
                        shippingAddress: order.shippingAddress,
                        deliveryDate: order.deliveryDate,
                        lines: order.lines || [],
                        cancelReason: (normalizedStatus === 'Cancelled' || normalizedStatus === 3) ? order.note : null,
                        deliveryProofImageUrl: order.deliveryProofImageUrl // Ảnh minh chứng giao hàng
                    };

                    // Log ra để debug nếu cần
                    console.log('Mapped assigned order:', order, '=>', mapped);
                    return mapped;
                });

                // Sort by orderDate descending (newest first)
                $scope.recentOrders.sort(function (a, b) {
                    var dateA = new Date(a.orderDate);
                    var dateB = new Date(b.orderDate);
                    return dateB - dateA;
                });

                console.log('Loaded assigned orders:', $scope.recentOrders);

                // Update stats based on real data
                $scope.updateStatsFromOrders();

                // Update filtered orders
                $scope.updateFilteredOrders();
            } else {
                console.log('No assigned orders found');
                $scope.recentOrders = [];
                $scope.stats = { pendingOrders: 0, todayOrders: 0, shippingOrders: 0 };
                $scope.updateFilteredOrders();
            }
        }).catch(function (error) {
            console.error('Error loading assigned orders:', error);
            $scope.recentOrders = [];
            $scope.stats = { pendingOrders: 0, todayOrders: 0, shippingOrders: 0 };
            $scope.updateFilteredOrders();
            showNotification('Không thể tải danh sách đơn hàng: ' + (error.data?.message || 'Lỗi không xác định'), 'danger');
        }).finally(function () {
            $scope.loading = false;
        });
    };


    // View order details
    $scope.viewOrderDetail = function (order) {
        // Load detailed order information from API
        BookstoreService.getOrderById(order.orderId).then(function (response) {
            if (response.data && response.data.success) {
                var orderData = response.data.data;

                // Map API data to expected format for modal
                var detailStatus = orderData.deliveryStatus;
                if (detailStatus === null || detailStatus === undefined) {
                    detailStatus = orderData.status;
                }
                if (detailStatus === null || detailStatus === undefined) {
                    detailStatus = orderData.statusId;
                }
                if (detailStatus === null || detailStatus === undefined) {
                    detailStatus = orderData.orderStatus;
                }

                $scope.selectedOrder = {
                    orderId: orderData.orderId,
                    customerName: orderData.customerName,
                    placedAt: orderData.placedAt,
                    totalAmount: orderData.totalAmount,
                    status: detailStatus,
                    // field riêng cho UI
                    deliveryStatus: detailStatus,
                    receiverName: orderData.receiverName,
                    receiverPhone: orderData.receiverPhone,
                    shippingAddress: orderData.shippingAddress,
                    deliveryDate: orderData.deliveryDate,
                    lines: orderData.lines || [],
                    invoice: orderData.invoice,
                    paymentUrl: orderData.paymentUrl,
                    cancelReason: (detailStatus === 'Cancelled' || detailStatus === 3) ? orderData.note : null,
                    deliveryProofImageUrl: orderData.deliveryProofImageUrl // Ảnh minh chứng giao hàng
                };

                console.log('Loaded order details:', $scope.selectedOrder);
            } else {
                // Fallback to basic order info
                $scope.selectedOrder = order;
                console.log('Using basic order info:', $scope.selectedOrder);
            }
        }).catch(function (error) {
            console.error('Error loading order details:', error);
            // Fallback to basic order info
            $scope.selectedOrder = order;
            showNotification('Không thể tải chi tiết đơn hàng, hiển thị thông tin cơ bản', 'warning');
        });
    };

    // View order details (legacy function)
    $scope.viewOrder = function (order) {
        $scope.viewOrderDetail(order);
        showNotification('Xem chi tiết đơn hàng: ' + order.orderId, 'info');
    };

    // Process order (Approve order) - Chuyển từ PendingConfirmation (0) → Confirmed (1)
    $scope.processOrder = function (order) {
        BookstoreService.approveOrder(order.orderId, {
            approved: true,
            note: 'Đơn hàng đã được duyệt bởi nhân viên giao hàng'
        }).then(function (response) {
            if (response.data && response.data.success) {
                showNotification('Đã duyệt đơn hàng: ' + order.orderId, 'success');

                // Reload orders to get updated data
                $scope.loadRecentOrders();
                $scope.updateFilteredOrders();
            } else {
                showNotification('Không thể duyệt đơn hàng: ' + (response.data.message || 'Lỗi không xác định'), 'danger');
            }
        }).catch(function (error) {
            console.error('Error approving order:', error);
            showNotification('Có lỗi xảy ra khi duyệt đơn hàng', 'danger');
        });
    };

    // Ship order (Assign delivery) - Chuyển từ PendingConfirmation (0) → Confirmed (1)
    $scope.shipOrder = function (order) {
        BookstoreService.assignOrderDelivery(order.orderId, {
            deliveryEmployeeId: AuthService.getCurrentUser().userId,
            deliveryDate: new Date().toISOString()
        }).then(function (response) {
            if (response.data && response.data.success) {
                showNotification('Đã phân công giao hàng: ' + order.orderId, 'success');

                // Reload orders to get updated data
                $scope.loadRecentOrders();
                $scope.updateFilteredOrders();
            } else {
                showNotification('Không thể phân công giao hàng: ' + (response.data.message || 'Lỗi không xác định'), 'danger');
            }
        }).catch(function (error) {
            console.error('Error assigning delivery:', error);
            showNotification('Có lỗi xảy ra khi phân công giao hàng', 'danger');
        });
    };

    // Confirm delivery - Chuyển từ Confirmed (1) → Delivered (2)
    $scope.confirmingOrder = null;
    $scope.deliveryNote = '';
    $scope.deliveryProofImageFile = null;
    $scope.deliveryProofImagePreview = null;
    $scope.submittingDelivery = false;

    $scope.confirmDelivery = function (order) {
        $scope.confirmingOrder = order;
        $scope.deliveryNote = 'Đã giao hàng thành công cho khách hàng';
        $scope.deliveryProofImageFile = null;
        $scope.deliveryProofImagePreview = null;

        // Show modal
        var modalEl = document.getElementById('confirmDeliveryModal');
        if (modalEl) {
            var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    };

    // Handle file selection
    $scope.onDeliveryProofFileSelected = function (files) {
        if (files && files.length > 0) {
            var file = files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Vui lòng chọn file ảnh', 'warning');
                return;
            }

            // Validate file size (max 10MB)
            var maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showNotification('Kích thước ảnh không được vượt quá 10MB', 'warning');
                return;
            }

            $scope.deliveryProofImageFile = file;

            // Create preview
            var reader = new FileReader();
            reader.onload = function (e) {
                $scope.$apply(function () {
                    $scope.deliveryProofImagePreview = e.target.result;
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove selected image
    $scope.removeDeliveryProofImage = function () {
        $scope.deliveryProofImageFile = null;
        $scope.deliveryProofImagePreview = null;

        // Clear file input
        var fileInput = document.getElementById('deliveryProofImageInput');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Submit confirm delivery with proof image
    $scope.submitConfirmDelivery = function () {
        if (!$scope.deliveryProofImageFile) {
            showNotification('Vui lòng chọn ảnh minh chứng giao hàng', 'warning');
            return;
        }

        if (!$scope.confirmingOrder) {
            showNotification('Không tìm thấy thông tin đơn hàng', 'danger');
            return;
        }

        $scope.submittingDelivery = true;

        // Create FormData
        var formData = new FormData();
        formData.append('success', 'true');
        formData.append('note', $scope.deliveryNote || 'Đã giao hàng thành công');
        formData.append('deliveryProofImageFile', $scope.deliveryProofImageFile);

        // Call service with FormData
        BookstoreService.confirmOrderDelivered($scope.confirmingOrder.orderId, formData)
            .then(function (response) {
                if (response.data && response.data.success) {
                    showNotification('Đã xác nhận giao hàng thành công!', 'success');

                    // Hide modal
                    var modalEl = document.getElementById('confirmDeliveryModal');
                    if (modalEl) {
                        var modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                    }

                    // Reset
                    $scope.confirmingOrder = null;
                    $scope.deliveryNote = '';
                    $scope.deliveryProofImageFile = null;
                    $scope.deliveryProofImagePreview = null;

                    // Reload orders
                    $scope.loadRecentOrders();
                    $scope.updateFilteredOrders();
                } else {
                    showNotification('Không thể xác nhận giao hàng: ' + (response.data.message || 'Lỗi không xác định'), 'danger');
                }
            })
            .catch(function (error) {
                console.error('Error confirming delivery:', error);
                showNotification('Có lỗi xảy ra khi xác nhận giao hàng', 'danger');
            })
            .finally(function () {
                $scope.submittingDelivery = false;
            });
    };


    // Cancel order - DISABLED as per requirement
    // $scope.cancelOrder = function (order) {
    //     // Show modal for cancel reason
    //     $scope.cancelOrderData = {
    //         orderId: order.orderId,
    //         reason: '',
    //         note: ''
    //     };

    //     // Show cancel modal
    //     var cancelModal = new bootstrap.Modal(document.getElementById('cancelOrderModal'));
    //     cancelModal.show();
    // };

    // Confirm cancel order - DISABLED as per requirement
    // $scope.confirmCancelOrder = function () {
    //     if (!$scope.cancelOrderData.reason.trim()) {
    //         showNotification('Vui lòng nhập lý do hủy đơn hàng', 'warning');
    //         return;
    //     }

    //     BookstoreService.cancelOrder($scope.cancelOrderData.orderId, {
    //         reason: $scope.cancelOrderData.reason,
    //         note: $scope.cancelOrderData.note || ''
    //     }).then(function (response) {
    //         if (response.data && response.data.success) {
    //             showNotification('Đã hủy đơn hàng thành công: ' + $scope.cancelOrderData.orderId, 'success');

    //             // Hide modal
    //             var cancelModal = bootstrap.Modal.getInstance(document.getElementById('cancelOrderModal'));
    //             cancelModal.hide();

    //             // Reload orders to get updated data
    //             $scope.loadRecentOrders();
    //             $scope.updateFilteredOrders();
    //         } else {
    //             showNotification('Không thể hủy đơn hàng: ' + (response.data.message || 'Lỗi không xác định'), 'danger');
    //         }
    //     }).catch(function (error) {
    //         console.error('Error cancelling order:', error);
    //         showNotification('Có lỗi xảy ra khi hủy đơn hàng', 'danger');
    //     });
    // };

    // Test API endpoints
    $scope.testStaffAPI = function () {
        AuthService.testStaffOnly()
            .then(function (response) {
                console.log('Staff API test:', response.data);
                showNotification('Staff API hoạt động bình thường!', 'success');
            })
            .catch(function (error) {
                console.error('Staff API test failed:', error);
                showNotification('Staff API không hoạt động!', 'danger');
            });
    };

    // Initialize when controller loads
    $scope.init();
}]);

