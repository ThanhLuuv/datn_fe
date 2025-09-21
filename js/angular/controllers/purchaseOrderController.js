// Purchase Order Controllers

// Admin Purchase Orders Controller
app.controller('AdminPurchaseOrdersController', ['$scope', 'BookstoreService', 'AuthService', '$location', function($scope, BookstoreService, AuthService, $location) {
    // Check if user has admin or teacher access
    if (!AuthService.isAdminOrTeacher()) {
        console.log('Access denied: User does not have admin or teacher role');
        $location.path('/home');
        return;
    }
    $scope.title = 'Quản lý đơn đặt hàng';
    $scope.purchaseOrders = [];
    $scope.loading = false;
    $scope.error = null;
    $scope.success = null;
    $scope.searchTerm = '';
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.totalPages = 0;

    // Form data
    $scope.formData = {
        publisher: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        totalAmount: 0,
        status: 'PENDING',
        notes: ''
    };
    $scope.editingOrder = null;
    $scope.showForm = false;
    
    // Publishers data
    $scope.publishers = [];

    // Load publishers
    $scope.loadPublishers = function() {
        BookstoreService.getPublishers({})
            .then(function(response) {
                if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.publishers)) {
                    $scope.publishers = response.data.data.publishers;
                } else if (response.data && Array.isArray(response.data.data)) {
                    $scope.publishers = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    $scope.publishers = response.data;
                } else {
                    $scope.publishers = [];
                }
            })
            .catch(function(error) {
                console.error('Error loading publishers:', error);
                $scope.publishers = [];
            });
    };

    // Load purchase orders
    $scope.loadPurchaseOrders = function() {
        $scope.loading = true;
        $scope.error = null;
        
        BookstoreService.getPurchaseOrders({
            pageNumber: $scope.currentPage,
            pageSize: $scope.pageSize,
            searchTerm: $scope.searchTerm
        })
            .then(function(response) {
                // Ensure purchaseOrders is always an array
                if (response.data && Array.isArray(response.data.data)) {
                    $scope.purchaseOrders = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    $scope.purchaseOrders = response.data;
                } else {
                    $scope.purchaseOrders = [];
                }
                $scope.totalPages = (response.data && response.data.totalPages) || 0;
                $scope.loading = false;
            })
            .catch(function(error) {
                $scope.error = 'Không thể tải danh sách đơn đặt hàng. Vui lòng thử lại.';
                $scope.loading = false;
                console.error('Error loading purchase orders:', error);
            });
    };

    // Search purchase orders
    $scope.search = function() {
        $scope.currentPage = 1;
        $scope.loadPurchaseOrders();
    };

    // Page change
    $scope.onPageChange = function(page) {
        $scope.currentPage = page;
        $scope.loadPurchaseOrders();
    };

    // Open create modal
    $scope.openCreateModal = function() {
        $scope.isEditMode = false;
        $scope.purchaseOrderData = {
            poId: '',
            publisherId: '',
            publisherName: '',
            orderedAt: new Date().toISOString().split('T')[0],
            createdByName: '',
            totalQuantity: 0,
            totalAmount: 0,
            note: '',
            lines: []
        };
        $scope.availableBooks = [];
        $scope.loadAvailableBooks();
        $scope.loadPublishers();
        
        // Show modal
        var modal = new bootstrap.Modal(document.getElementById('purchaseOrderModal'));
        modal.show();
    };

    // Show add form
    $scope.showAddForm = function() {
        $scope.editingOrder = null;
        $scope.formData = {
            publisher: '',
            orderDate: new Date().toISOString().split('T')[0],
            expectedDeliveryDate: '',
            totalAmount: 0,
            status: 'PENDING',
            notes: ''
        };
        $scope.showForm = true;
    };

    // Show edit form
    $scope.showEditForm = function(order) {
        $scope.editingOrder = order;
        $scope.formData = {
            publisher: order.publisher,
            orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : '',
            expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
            totalAmount: order.totalAmount,
            status: order.status,
            notes: order.notes || ''
        };
        $scope.showForm = true;
    };

    // Hide form
    $scope.hideForm = function() {
        $scope.showForm = false;
        $scope.editingOrder = null;
        $scope.formData = {
            publisher: '',
            orderDate: new Date().toISOString().split('T')[0],
            expectedDeliveryDate: '',
            totalAmount: 0,
            status: 'PENDING',
            notes: ''
        };
    };

    // Save purchase order
    $scope.savePurchaseOrder = function() {
        if (!$scope.formData.publisher.trim()) {
            $scope.error = 'Tên nhà xuất bản không được để trống.';
            return;
        }

        $scope.loading = true;
        $scope.error = null;

        var promise;
        if ($scope.editingOrder) {
            // Update existing order
            promise = BookstoreService.updatePurchaseOrder($scope.editingOrder.id, $scope.formData);
        } else {
            // Create new order
            promise = BookstoreService.createPurchaseOrder($scope.formData);
        }

        promise
            .then(function(response) {
                $scope.loading = false;
                $scope.success = $scope.editingOrder ? 'Cập nhật đơn đặt hàng thành công!' : 'Tạo đơn đặt hàng thành công!';
                $scope.hideForm();
                $scope.loadPurchaseOrders();
                
                // Hide success message after 3 seconds
                setTimeout(function() {
                    $scope.$apply(function() {
                        $scope.success = null;
                    });
                }, 3000);
            })
            .catch(function(error) {
                $scope.loading = false;
                $scope.error = error.data?.message || 'Có lỗi xảy ra khi lưu đơn đặt hàng.';
                console.error('Error saving purchase order:', error);
            });
    };

    // Delete purchase order
    $scope.deletePurchaseOrder = function(order) {
        if (confirm('Bạn có chắc chắn muốn xóa đơn đặt hàng này?')) {
            $scope.loading = true;
            $scope.error = null;

            BookstoreService.deletePurchaseOrder(order.id)
                .then(function(response) {
                    $scope.loading = false;
                    $scope.success = 'Xóa đơn đặt hàng thành công!';
                    $scope.loadPurchaseOrders();
                    
                    // Hide success message after 3 seconds
                    setTimeout(function() {
                        $scope.$apply(function() {
                            $scope.success = null;
                        });
                    }, 3000);
                })
                .catch(function(error) {
                    $scope.loading = false;
                    $scope.error = error.data?.message || 'Có lỗi xảy ra khi xóa đơn đặt hàng.';
                    console.error('Error deleting purchase order:', error);
                });
        }
    };

    // Get status display name
    $scope.getStatusDisplayName = function(status) {
        switch(status) {
            case 'PENDING': return 'Chờ xử lý';
            case 'APPROVED': return 'Đã duyệt';
            case 'REJECTED': return 'Từ chối';
            case 'DELIVERED': return 'Đã giao';
            default: return status;
        }
    };

    // Get status class
    $scope.getStatusClass = function(status) {
        switch(status) {
            case 'PENDING': return 'warning';
            case 'APPROVED': return 'info';
            case 'REJECTED': return 'danger';
            case 'DELIVERED': return 'success';
            default: return 'secondary';
        }
    };

    // Load available books for modal
    $scope.loadAvailableBooks = function() {
        // If publisher is selected, load books by publisher
        if ($scope.purchaseOrderData.publisherId) {
            $scope.loadBooksByPublisher($scope.purchaseOrderData.publisherId);
        } else {
            // Load all books if no publisher selected
            BookstoreService.getBooks(1, 1000, '', '', '')
                .then(function(response) {
                    if (response.data && Array.isArray(response.data.data)) {
                        $scope.availableBooks = response.data.data;
                    } else if (response.data && Array.isArray(response.data)) {
                        $scope.availableBooks = response.data;
                    } else {
                        $scope.availableBooks = [];
                    }
                })
                .catch(function(error) {
                    console.error('Error loading books:', error);
                    $scope.availableBooks = [];
                });
        }
    };

    // Load books by publisher
    $scope.loadBooksByPublisher = function(publisherId) {
        if (!publisherId) {
            $scope.availableBooks = [];
            return;
        }
        
        BookstoreService.getBooksByPublisher(publisherId, {})
            .then(function(response) {
                if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.books)) {
                    $scope.availableBooks = response.data.data.books;
                } else if (response.data && Array.isArray(response.data.data)) {
                    $scope.availableBooks = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    $scope.availableBooks = response.data;
                } else {
                    $scope.availableBooks = [];
                }
            })
            .catch(function(error) {
                console.error('Error loading books by publisher:', error);
                $scope.availableBooks = [];
            });
    };

    // Add line to purchase order
    $scope.addLine = function() {
        $scope.purchaseOrderData.lines.push({
            isbn: '',
            qtyOrdered: 1,
            unitPrice: 0,
            lineTotal: 0
        });
    };

    // Remove line from purchase order
    $scope.removeLine = function(index) {
        $scope.purchaseOrderData.lines.splice(index, 1);
        $scope.updateTotal();
    };

    // Update line total
    $scope.updateLineTotal = function(index) {
        var line = $scope.purchaseOrderData.lines[index];
        line.lineTotal = line.qtyOrdered * line.unitPrice;
        $scope.updateTotal();
    };

    // Update book details when ISBN changes
    $scope.updateLineBook = function(index) {
        var line = $scope.purchaseOrderData.lines[index];
        var book = $scope.availableBooks.find(function(b) {
            return b.isbn === line.isbn;
        });
        if (book) {
            line.unitPrice = book.unitPrice || book.price || 0;
            $scope.updateLineTotal(index);
        }
    };

    // Load books when publisher changes
    $scope.onPublisherChange = function() {
        $scope.loadBooksByPublisher($scope.purchaseOrderData.publisherId);
        // Clear all existing lines when publisher changes
        $scope.purchaseOrderData.lines = [];
        $scope.addLine(); // Add one empty line
    };

    // Update total
    $scope.updateTotal = function() {
        $scope.purchaseOrderData.totalQuantity = 0;
        $scope.purchaseOrderData.totalAmount = 0;
        
        $scope.purchaseOrderData.lines.forEach(function(line) {
            $scope.purchaseOrderData.totalQuantity += line.qtyOrdered || 0;
            $scope.purchaseOrderData.totalAmount += line.lineTotal || 0;
        });
    };

    // Get total quantity for display
    $scope.getTotalQuantity = function() {
        var total = 0;
        if ($scope.purchaseOrderData && $scope.purchaseOrderData.lines) {
            $scope.purchaseOrderData.lines.forEach(function(line) {
                if (line.qtyOrdered) {
                    total += parseInt(line.qtyOrdered) || 0;
                }
            });
        }
        return total;
    };

    // Get total amount for display
    $scope.getTotalAmount = function() {
        var total = 0;
        if ($scope.purchaseOrderData && $scope.purchaseOrderData.lines) {
            $scope.purchaseOrderData.lines.forEach(function(line) {
                if (line.qtyOrdered && line.unitPrice) {
                    total += (parseInt(line.qtyOrdered) || 0) * (parseFloat(line.unitPrice) || 0);
                }
            });
        }
        return total;
    };

    // Save purchase order
    $scope.savePurchaseOrder = function() {
        if ($scope.purchaseOrderData.lines.length === 0) {
            alert('Vui lòng thêm ít nhất một dòng sản phẩm');
            return;
        }

        if (!$scope.purchaseOrderData.publisherName.trim()) {
            alert('Vui lòng nhập tên nhà xuất bản');
            return;
        }

        $scope.isSaving = true;
        $scope.error = null;
        
        // Prepare data for API
        var orderData = {
            publisherName: $scope.purchaseOrderData.publisherName,
            orderedAt: $scope.purchaseOrderData.orderedAt,
            createdByName: $scope.purchaseOrderData.createdByName || 'Current User',
            totalQuantity: $scope.purchaseOrderData.totalQuantity,
            totalAmount: $scope.purchaseOrderData.totalAmount,
            note: $scope.purchaseOrderData.note,
            lines: $scope.purchaseOrderData.lines
        };

        BookstoreService.createPurchaseOrder(orderData)
            .then(function(response) {
                $scope.isSaving = false;
                $scope.success = 'Tạo đơn đặt hàng thành công!';
                $scope.loadPurchaseOrders();
                
                // Hide modal
                var modal = bootstrap.Modal.getInstance(document.getElementById('purchaseOrderModal'));
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
                $scope.error = error.data?.message || 'Có lỗi xảy ra khi tạo đơn đặt hàng.';
                console.error('Error creating purchase order:', error);
            });
    };

    // Search purchase orders
    $scope.searchPurchaseOrders = function() {
        $scope.currentPage = 1;
        $scope.loadPurchaseOrders();
    };

    // Clear search
    $scope.clearSearch = function() {
        $scope.searchTerm = '';
        $scope.currentPage = 1;
        $scope.loadPurchaseOrders();
    };

    // Initialize
    $scope.loadPurchaseOrders();
}]);