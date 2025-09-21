// Goods Receipt Controllers

// Admin Goods Receipts Controller
app.controller('AdminGoodsReceiptsController', ['$scope', 'BookstoreService', 'AuthService', '$location', function($scope, BookstoreService, AuthService, $location) {
    // Check if user has admin or teacher access
    if (!AuthService.isAdminOrTeacher()) {
        console.log('Access denied: User does not have admin or teacher role');
        $location.path('/home');
        return;
    }
    $scope.title = 'Quản lý phiếu nhập hàng';
    $scope.goodsReceipts = [];
    $scope.availablePurchaseOrders = [];
    $scope.loading = false;
    $scope.error = null;
    $scope.success = null;
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.totalPages = 0;

    // Form data
    $scope.formData = {
        purchaseOrderId: '',
        receiptDate: new Date().toISOString().split('T')[0],
        receivedBy: '',
        notes: ''
    };
    $scope.editingReceipt = null;
    $scope.showForm = false;

    // Load goods receipts
    $scope.loadGoodsReceipts = function() {
        $scope.loading = true;
        $scope.error = null;
        
        BookstoreService.getGoodsReceipts({
            pageNumber: $scope.currentPage,
            pageSize: $scope.pageSize
        })
            .then(function(response) {
                // Ensure goodsReceipts is always an array
                if (response.data && Array.isArray(response.data.data)) {
                    $scope.goodsReceipts = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    $scope.goodsReceipts = response.data;
                } else {
                    $scope.goodsReceipts = [];
                }
                $scope.totalPages = (response.data && response.data.totalPages) || 0;
                $scope.loading = false;
            })
            .catch(function(error) {
                $scope.error = 'Không thể tải danh sách phiếu nhập hàng. Vui lòng thử lại.';
                $scope.loading = false;
                console.error('Error loading goods receipts:', error);
            });
    };

    // Open create modal
    $scope.openCreateModal = function() {
        $scope.isEditMode = false;
        $scope.goodsReceiptData = {
            poId: '',
            receiptDate: new Date().toISOString().split('T')[0],
            receivedBy: '',
            note: ''
        };
        $scope.loadAvailablePurchaseOrders();
        
        // Show modal
        var modal = new bootstrap.Modal(document.getElementById('goodsReceiptModal'));
        modal.show();
    };

    // Load available purchase orders
    $scope.loadAvailablePurchaseOrders = function() {
        BookstoreService.getAvailablePurchaseOrders()
            .then(function(response) {
                if (response.data && Array.isArray(response.data)) {
                    $scope.availablePurchaseOrders = response.data;
                } else {
                    $scope.availablePurchaseOrders = [];
                }
            })
            .catch(function(error) {
                console.error('Error loading available purchase orders:', error);
                $scope.availablePurchaseOrders = [];
            });
    };

    // Page change
    $scope.onPageChange = function(page) {
        $scope.currentPage = page;
        $scope.loadGoodsReceipts();
    };

    // Show add form
    $scope.showAddForm = function() {
        $scope.editingReceipt = null;
        $scope.formData = {
            purchaseOrderId: '',
            receiptDate: new Date().toISOString().split('T')[0],
            receivedBy: '',
            notes: ''
        };
        $scope.showForm = true;
        $scope.loadAvailablePurchaseOrders();
    };

    // Show edit form
    $scope.showEditForm = function(receipt) {
        $scope.editingReceipt = receipt;
        $scope.formData = {
            purchaseOrderId: receipt.purchaseOrderId,
            receiptDate: receipt.receiptDate ? new Date(receipt.receiptDate).toISOString().split('T')[0] : '',
            receivedBy: receipt.receivedBy,
            notes: receipt.notes || ''
        };
        $scope.showForm = true;
        $scope.loadAvailablePurchaseOrders();
    };

    // Hide form
    $scope.hideForm = function() {
        $scope.showForm = false;
        $scope.editingReceipt = null;
        $scope.formData = {
            purchaseOrderId: '',
            receiptDate: new Date().toISOString().split('T')[0],
            receivedBy: '',
            notes: ''
        };
    };

    // Save goods receipt
    $scope.saveGoodsReceipt = function() {
        if (!$scope.formData.purchaseOrderId) {
            $scope.error = 'Vui lòng chọn đơn đặt hàng.';
            return;
        }

        if (!$scope.formData.receivedBy.trim()) {
            $scope.error = 'Tên người nhận không được để trống.';
            return;
        }

        $scope.loading = true;
        $scope.error = null;

        var promise;
        if ($scope.editingReceipt) {
            // Update existing receipt
            promise = BookstoreService.updateGoodsReceipt($scope.editingReceipt.id, $scope.formData);
        } else {
            // Create new receipt
            promise = BookstoreService.createGoodsReceipt($scope.formData);
        }

        promise
            .then(function(response) {
                $scope.loading = false;
                $scope.success = $scope.editingReceipt ? 'Cập nhật phiếu nhập hàng thành công!' : 'Tạo phiếu nhập hàng thành công!';
                $scope.hideForm();
                $scope.loadGoodsReceipts();
                
                // Hide success message after 3 seconds
                setTimeout(function() {
                    $scope.$apply(function() {
                        $scope.success = null;
                    });
                }, 3000);
            })
            .catch(function(error) {
                $scope.loading = false;
                $scope.error = error.data?.message || 'Có lỗi xảy ra khi lưu phiếu nhập hàng.';
                console.error('Error saving goods receipt:', error);
            });
    };

    // Delete goods receipt
    $scope.deleteGoodsReceipt = function(receipt) {
        if (confirm('Bạn có chắc chắn muốn xóa phiếu nhập hàng này?')) {
            $scope.loading = true;
            $scope.error = null;

            BookstoreService.deleteGoodsReceipt(receipt.id)
                .then(function(response) {
                    $scope.loading = false;
                    $scope.success = 'Xóa phiếu nhập hàng thành công!';
                    $scope.loadGoodsReceipts();
                    
                    // Hide success message after 3 seconds
                    setTimeout(function() {
                        $scope.$apply(function() {
                            $scope.success = null;
                        });
                    }, 3000);
                })
                .catch(function(error) {
                    $scope.loading = false;
                    $scope.error = error.data?.message || 'Có lỗi xảy ra khi xóa phiếu nhập hàng.';
                    console.error('Error deleting goods receipt:', error);
                });
        }
    };

    // Get purchase order info
    $scope.getPurchaseOrderInfo = function(purchaseOrderId) {
        var order = $scope.availablePurchaseOrders.find(function(po) {
            return po.id == purchaseOrderId;
        });
        return order ? order.publisher : 'Không xác định';
    };

    // Load purchase order details
    $scope.loadPurchaseOrderDetails = function() {
        // This function can be used to load additional details when a purchase order is selected
        console.log('Purchase order selected:', $scope.goodsReceiptData.poId);
    };

    // Get total quantity for display
    $scope.getTotalQuantity = function() {
        var total = 0;
        if ($scope.goodsReceiptData && $scope.goodsReceiptData.lines) {
            $scope.goodsReceiptData.lines.forEach(function(line) {
                if (line.qtyReceived) {
                    total += parseInt(line.qtyReceived) || 0;
                }
            });
        }
        return total;
    };

    // Get total amount for display
    $scope.getTotalAmount = function() {
        var total = 0;
        if ($scope.goodsReceiptData && $scope.goodsReceiptData.lines) {
            $scope.goodsReceiptData.lines.forEach(function(line) {
                if (line.qtyReceived && line.unitPrice) {
                    total += (parseInt(line.qtyReceived) || 0) * (parseFloat(line.unitPrice) || 0);
                }
            });
        }
        return total;
    };

    // Save goods receipt
    $scope.saveGoodsReceipt = function() {
        if (!$scope.goodsReceiptData.poId) {
            alert('Vui lòng chọn đơn đặt hàng');
            return;
        }

        if (!$scope.goodsReceiptData.receivedBy.trim()) {
            alert('Vui lòng nhập tên người nhận');
            return;
        }

        $scope.isSaving = true;
        $scope.error = null;
        
        // Prepare data for API
        var receiptData = {
            poId: $scope.goodsReceiptData.poId,
            receiptDate: $scope.goodsReceiptData.receiptDate,
            receivedBy: $scope.goodsReceiptData.receivedBy,
            note: $scope.goodsReceiptData.note
        };

        BookstoreService.createGoodsReceipt(receiptData)
            .then(function(response) {
                $scope.isSaving = false;
                $scope.success = 'Tạo phiếu nhập hàng thành công!';
                $scope.loadGoodsReceipts();
                
                // Hide modal
                var modal = bootstrap.Modal.getInstance(document.getElementById('goodsReceiptModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Clear success message after 3 seconds
                setTimeout(function() {
                    $scope.$apply(function() {
                        $scope.success = null;
                    });
                }, 3000);
            })
            .catch(function(error) {
                $scope.isSaving = false;
                $scope.error = error.data?.message || 'Có lỗi xảy ra khi tạo phiếu nhập hàng.';
                console.error('Error creating goods receipt:', error);
            });
    };

    // Search goods receipts
    $scope.searchGoodsReceipts = function() {
        $scope.currentPage = 1;
        $scope.loadGoodsReceipts();
    };

    // Clear search
    $scope.clearSearch = function() {
        $scope.searchTerm = '';
        $scope.currentPage = 1;
        $scope.loadGoodsReceipts();
    };

    // Initialize
    $scope.loadGoodsReceipts();
}]);