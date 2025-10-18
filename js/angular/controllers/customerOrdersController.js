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
    $scope.returnModel = {
        reason: '',
        lines: []
    };
    $scope.returnLoading = false;
    $scope.toasts = [];
    $scope.reviewModel = { isbn: '', stars: 5, comment: '' };
    $scope.reviewLines = [];
    $scope.submittingReview = false;
    $scope.reviewHint = 'Mỗi đơn chỉ có thể đánh giá những sách đã mua và giao thành công.';

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
            $scope.addToast('danger', 'Không thể tải danh sách đơn hàng');
        });
    };

    // Add toast notification
    $scope.addToast = function(variant, message) {
        $scope.toasts.push({
            variant: variant,
            message: message
        });
        // Auto remove after 5 seconds
        setTimeout(function() {
            $scope.toasts.shift();
            $scope.$apply();
        }, 5000);
    };

    // Get payment status class for badge
    $scope.getPaymentStatusClass = function(invoice) {
        if (!invoice) {
            return 'bg-secondary'; // Chưa có hóa đơn
        }
        
        // Nếu có invoice nhưng không có paymentStatus, coi như chưa thanh toán
        if (!invoice.paymentStatus) {
            return 'bg-danger'; // Chưa thanh toán (có hóa đơn nhưng chưa có trạng thái thanh toán)
        }
        
        switch(invoice.paymentStatus) {
            case 'PENDING':
                return 'bg-danger'; // Chưa thanh toán
            case 'PAID':
                return 'bg-success'; // Đã thanh toán
            case 'FAILED':
                return 'bg-warning'; // Thất bại
            case 'REFUNDED':
                return 'bg-info'; // Hoàn tiền
            default:
                return 'bg-secondary';
        }
    };

    // Get status class for badge
    $scope.getStatusClass = function(status) {
        // Handle both string and numeric status
        var statusValue = typeof status === 'number' ? status : status;
        switch(statusValue) {
            case 0:
            case 'PendingConfirmation':
                return 'bg-warning';
            case 1:
            case 'Confirmed':
                return 'bg-primary';
            case 2:
            case 'Delivered':
                return 'bg-success';
            case 3:
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
            case 'PendingConfirmation':
                return 'Chờ xác nhận';
            case 1:
            case 'Confirmed':
                return 'Đã xác nhận';
            case 2:
            case 'Delivered':
                return 'Đã giao';
            case 3:
            case 'Cancelled':
                return 'Đã hủy';
            default:
                return status || 'Không xác định';
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

    // Resolve line title robustly
    $scope.getLineTitle = function(line) {
        if (!line) return '';
        return (
            line.bookTitle ||
            line.bookName ||
            line.title ||
            (line.book && (line.book.bookTitle || line.book.title)) ||
            ''
        );
    };

    // Open review modal for delivered order
    $scope.openReview = function(order) {
        if ($scope.getStatusText(order.status) !== 'Đã giao') {
            $scope.addToast('warning', 'Chỉ đánh giá đơn đã giao thành công');
            return;
        }
        $scope.selectedOrder = angular.copy(order);
        $scope.reviewLines = (order.lines || []).map(function(line){
            return {
                isbn: line.isbn,
                bookTitle: line.bookTitle || line.title || ('ISBN ' + line.isbn)
            };
        });
        if ($scope.reviewLines.length > 0) {
            $scope.reviewModel.isbn = $scope.reviewLines[0].isbn;
        }
        $scope.reviewModel.stars = 5;
        $scope.reviewModel.comment = '';
        setTimeout(function(){
            var el = document.getElementById('reviewModal');
            if (!el) return;
            try { var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null; if (modal) modal.show(); } catch(e) { if (el.showModal) el.showModal(); }
        },0);
    };

    $scope.setStars = function(s) { $scope.reviewModel.stars = s; };

    // Submit review
    $scope.submitReview = function() {
        if (!$scope.reviewModel.isbn || !$scope.reviewModel.stars) {
            $scope.addToast('warning', 'Vui lòng chọn sản phẩm và số sao');
            return;
        }
        var payload = {
            isbn: $scope.reviewModel.isbn,
            stars: $scope.reviewModel.stars,
            comment: ($scope.reviewModel.comment || '').trim()
        };
        $scope.submittingReview = true;
        BookstoreService.createOrUpdateRating(payload).then(function(){
            $scope.addToast('success', 'Đã gửi đánh giá thành công');
            setTimeout(function(){
                var el = document.getElementById('reviewModal');
                if (!el) return; try { var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getInstance(el) : null; if (modal) modal.hide(); } catch(e) { if (el.close) el.close(); }
            },0);
        }).catch(function(err){
            var msg = (err && err.data && err.data.message) || 'Không thể gửi đánh giá';
            $scope.addToast('danger', msg);
        }).finally(function(){ $scope.submittingReview = false; $scope.$applyAsync(); });
    };

    // Return order function
    $scope.returnOrder = function(order) {
        if (!order || !order.orderId) {
            $scope.addToast('danger', 'Không tìm thấy thông tin đơn hàng');
            return;
        }

        // Check if order is delivered
        if ($scope.getStatusText(order.status) !== 'Đã giao') {
            $scope.addToast('warning', 'Chỉ có thể trả hàng với đơn hàng đã giao');
            return;
        }

        // Set selected order for return
        $scope.selectedOrder = angular.copy(order);

        // Reset return model
        $scope.returnModel = {
            reason: '',
            lines: []
        };

        // Load order details for return
        $scope.returnLoading = true;
        BookstoreService.getOrderDetail(order.orderId).then(function(response) {
            var orderDetail = response.data;
            if (orderDetail && orderDetail.lines) {
                $scope.returnModel.lines = orderDetail.lines.map(function(line) {
                    return {
                        orderLineId: line.orderLineId,
                        bookTitle: line.bookTitle,
                        isbn: line.isbn,
                        bookImageUrl: line.bookImageUrl,
                        unitPrice: line.unitPrice,
                        maxQty: line.qty || line.quantity,
                        qtyReturned: 0
                    };
                });
            }
            $scope.returnLoading = false;
            
            // Show modal
            setTimeout(function() {
                var el = document.getElementById('returnModal');
                if (!el) return;
                try {
                    var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
                    if (modal) modal.show();
                } catch (e) {
                    if (el.showModal) el.showModal();
                }
            }, 0);
        }).catch(function(error) {
            $scope.returnLoading = false;
            console.error('Error loading order detail:', error);
            $scope.addToast('danger', 'Không thể tải thông tin đơn hàng');
        });
    };

    // Check if has return items
    $scope.hasReturnItems = function() {
        if (!$scope.returnModel.lines || $scope.returnModel.lines.length === 0) {
            return false;
        }
        return $scope.returnModel.lines.some(function(line) {
            return line.qtyReturned > 0;
        });
    };

    // Submit return request
    $scope.submitReturn = function() {
        if (!$scope.returnModel.reason || !$scope.hasReturnItems()) {
            $scope.addToast('warning', 'Vui lòng nhập lý do và chọn sản phẩm cần trả');
            return;
        }

        // Validate return quantities
        var returnLines = $scope.returnModel.lines.filter(function(line) {
            return line.qtyReturned > 0;
        });

        for (var i = 0; i < returnLines.length; i++) {
            var line = returnLines[i];
            if (line.qtyReturned > line.maxQty) {
                $scope.addToast('warning', 'Số lượng trả không được vượt quá số lượng đã mua');
                return;
            }
        }

        // Prepare payload for new API
        var payload = {
            orderId: $scope.selectedOrder ? $scope.selectedOrder.orderId : null,
            reason: $scope.returnModel.reason,
            returnLines: returnLines.map(function(line) {
                return {
                    isbn: line.isbn,
                    quantity: parseInt(line.qtyReturned),
                    reason: $scope.returnModel.reason // Use main reason for all items
                };
            })
        };

        // Submit return request using new customer API
        BookstoreService.createCustomerReturn(payload).then(function(response) {
            $scope.addToast('success', 'Yêu cầu trả hàng đã được gửi thành công');
            
            // Close modal
            setTimeout(function() {
                var el = document.getElementById('returnModal');
                if (!el) return;
                try {
                    var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getInstance(el) : null;
                    if (modal) modal.hide();
                } catch (e) {
                    if (el.close) el.close();
                }
            }, 0);
            
            // Reset form
            $scope.returnModel = {
                reason: '',
                lines: []
            };
            
            // Reload orders
            $scope.loadOrders();
        }).catch(function(error) {
            console.error('Error creating return:', error);
            var errorMsg = 'Không thể tạo yêu cầu trả hàng';
            if (error.data && error.data.message) {
                errorMsg = error.data.message;
            }
            $scope.addToast('danger', errorMsg);
        });
    };

    // Initialize
    $scope.loadOrders();
}]);
