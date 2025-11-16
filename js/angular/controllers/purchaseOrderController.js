// Purchase Order Controllers

// Admin Purchase Orders Controller
app.controller('AdminPurchaseOrdersController', ['$scope', 'BookstoreService', 'AuthService', '$location', '$sce', function($scope, BookstoreService, AuthService, $location, $sce) {
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

    // Bộ lọc danh sách (NXB + ngày)
    $scope.filters = {
        publisherId: '',
        fromDate: '',
        toDate: ''
    };

    // Toasts
    $scope.toasts = [];
    $scope.addToast = function(variant, message) {
        var id = Date.now() + Math.random();
        $scope.toasts.push({ id: id, variant: variant, message: message });
        setTimeout(function(){
            $scope.$apply(function(){
                $scope.toasts = $scope.toasts.filter(function(t){ return t.id !== id; });
            });
        }, 4000);
    };

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

    // Điều hướng sang trang Phiếu nhập, kèm theo chọn sẵn PO
    $scope.goToGoodsReceipt = function(order) {
        if (!order) return;
        var isApproved = (order.statusId === 3) || (order.statusName && String(order.statusName).toLowerCase() === 'approved');
        if (!isApproved) {
            $scope.showPoConfirmModal(
                'Không thể tạo phiếu nhập',
                'Chỉ tạo phiếu nhập cho đơn đã Approved.',
                'warning',
                null,
                null
            );
            return;
        }
        // Chuyển trang; có thể truyền qua query/hash hoặc localStorage
        sessionStorage.setItem('selected_po_id', order.poId || order.id);
        window.location.href = '#!/admin/goods-receipts';
    };
    // View purchase order details in modal
    $scope.viewPurchaseOrder = function(order) {
        if (!order) return;
        $scope.selectedPurchaseOrder = order;
        var modalEl = document.getElementById('purchaseOrderDetailModal');
        if (modalEl) {
            var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    };

    // Load purchase orders
    $scope.loadPurchaseOrders = function() {
        $scope.loading = true;
        $scope.error = null;
        
        BookstoreService.getPurchaseOrders({
            pageNumber: $scope.currentPage,
            pageSize: $scope.pageSize,
            searchTerm: $scope.searchTerm,
            publisherId: $scope.filters.publisherId,
            fromDate: $scope.filters.fromDate,
            toDate: $scope.filters.toDate
        })
            .then(function(response) {
                // Normalize API response to expected shape
                var payload = response && response.data ? response.data : null;
                var list = [];
                var totalPages = 0;

                if (payload) {
                    // New backend format: { success, message, data: { purchaseOrders: [...], totalPages, ... } }
                    if (payload.data && Array.isArray(payload.data.purchaseOrders)) {
                        list = payload.data.purchaseOrders;
                        totalPages = payload.data.totalPages || 0;
                    // Legacy formats
                    } else if (Array.isArray(payload.data)) {
                        list = payload.data;
                        totalPages = payload.totalPages || 0;
                    } else if (Array.isArray(payload)) {
                        list = payload;
                        totalPages = 0;
                    }
                }

                $scope.purchaseOrders = list;
                $scope.totalPages = totalPages;
                $scope.loading = false;
            })
            .catch(function(error) {
                $scope.error = 'Không thể tải danh sách đơn đặt hàng. Vui lòng thử lại.';
                $scope.loading = false;
                console.error('Error loading purchase orders:', error);
                $scope.addToast('danger', $scope.error);
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
                $scope.addToast('success', $scope.success);
                
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
                $scope.addToast('danger', $scope.error);
            });
    };

    // Delete purchase order
    $scope.deletePurchaseOrder = function(order) {
        // Chỉ cho phép xóa nếu trạng thái là Pending (1)
        var isPending = order && ((order.statusId === 1) || (order.statusName && String(order.statusName).toLowerCase() === 'pending'));
        if (!isPending) {
            $scope.showPoConfirmModal(
                'Không thể xóa đơn',
                'Chỉ được xóa đơn hàng ở trạng thái Pending.',
                'warning',
                null,
                null
            );
            return;
        }
        
        $scope.showPoConfirmModal(
            'Xác nhận xóa đơn',
            'Bạn có chắc chắn muốn xóa đơn đặt hàng <strong>PO-' + (order.poId || order.id) + '</strong>?<br><small class="text-muted">Hành động này không thể hoàn tác.</small>',
            'danger',
            function(selectedOrder) {
                $scope.loading = true;
                $scope.error = null;

                BookstoreService.deletePurchaseOrder(selectedOrder.id)
                    .then(function(response) {
                        $scope.loading = false;
                        $scope.success = 'Xóa đơn đặt hàng thành công!';
                        $scope.loadPurchaseOrders();
                        $scope.addToast('success', $scope.success);
                        
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
                        $scope.addToast('danger', $scope.error);
                    });
            },
            order
        );
    };

    // Purchase Order Modal confirmation state
    $scope.poConfirmModal = {
        show: false,
        title: '',
        message: '',
        type: 'info', // info, warning, danger
        onConfirm: null,
        order: null
    };

    // Show purchase order confirmation modal
    $scope.showPoConfirmModal = function(title, message, type, onConfirm, order) {
        $scope.poConfirmModal = {
            show: true,
            title: title,
            message: $sce.trustAsHtml(message), // Trust HTML for rendering
            type: type || 'info',
            onConfirm: onConfirm,
            order: order
        };
        
        // Get or create modal instance with proper options
        var modalEl = document.getElementById('poConfirmModal');
        if (!modalEl) {
            console.error('Modal element poConfirmModal not found');
            return;
        }
        
        try {
            var modal = bootstrap.Modal.getOrCreateInstance(modalEl, {
                backdrop: true,
                keyboard: true,
                focus: true
            });
            modal.show();
        } catch (e) {
            console.error('Error showing PO confirm modal:', e);
            // Fallback: try direct show
            modalEl.classList.add('show');
            modalEl.style.display = 'block';
            var backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        }
    };

    // Hide purchase order confirmation modal
    $scope.hidePoConfirmModal = function() {
        $scope.poConfirmModal.show = false;
        var modalEl = document.getElementById('poConfirmModal');
        if (!modalEl) return;
        
        try {
            var modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            } else {
                // Fallback: manual hide
                modalEl.classList.remove('show');
                modalEl.style.display = 'none';
                document.querySelectorAll('.modal-backdrop').forEach(function(b) {
                    try { b.remove(); } catch(e) {}
                });
            }
        } catch (e) {
            console.error('Error hiding PO confirm modal:', e);
        }
    };

    // Confirm purchase order action
    $scope.confirmPoAction = function() {
        if ($scope.poConfirmModal.onConfirm) {
            $scope.poConfirmModal.onConfirm($scope.poConfirmModal.order);
        }
        $scope.hidePoConfirmModal();
    };

    // Gửi đơn đặt hàng: chuyển từ Pending (1) → Shipped (2)
    $scope.sendPurchaseOrder = function(order) {
        if (!order) return;
        var isPending = (order.statusId === 1) || (order.statusName && String(order.statusName).toLowerCase() === 'pending');
        if (!isPending) {
            $scope.showPoConfirmModal(
                'Không thể gửi đơn',
                'Chỉ có thể gửi đơn ở trạng thái Pending.',
                'warning',
                null,
                null
            );
            return;
        }

        $scope.showPoConfirmModal(
            'Xác nhận gửi đơn',
            'Bạn có chắc chắn muốn gửi đơn đặt hàng <strong>PO-' + (order.poId || order.id) + '</strong> cho nhà xuất bản?',
            'info',
            function(selectedOrder) {
                $scope.loading = true;
                BookstoreService.changePurchaseOrderStatus(selectedOrder.poId || selectedOrder.id, 2, 'Send to publisher')
                    .then(function() {
                        $scope.loading = false;
                        $scope.success = 'Đã gửi đơn đặt hàng thành công!';
                        $scope.loadPurchaseOrders();
                        $scope.addToast('success', $scope.success);
                        // Close detail modal if open
                        var detailModal = bootstrap.Modal.getInstance(document.getElementById('purchaseOrderDetailModal'));
                        if (detailModal) { detailModal.hide(); }
                        setTimeout(function() {
                            $scope.$apply(function() { $scope.success = null; });
                        }, 3000);
                    })
                    .catch(function(error) {
                        $scope.loading = false;
                        $scope.error = error.data?.message || 'Gửi đơn thất bại.';
                        console.error('Error sending PO:', error);
                        $scope.addToast('danger', $scope.error);
                    });
            },
            order
        );
    };

    // Xác nhận đơn: chuyển từ Shipped (2) → Approved (3)
    $scope.approvePurchaseOrder = function(order) {
        if (!order) return;
        var isShipped = (order.statusId === 2) || (order.statusName && String(order.statusName).toLowerCase() === 'shipped');
        if (!isShipped) {
            $scope.showPoConfirmModal(
                'Không thể xác nhận đơn',
                'Chỉ có thể xác nhận đơn ở trạng thái Shipped.',
                'warning',
                null,
                null
            );
            return;
        }

        $scope.showPoConfirmModal(
            'Xác nhận đơn đặt hàng',
            'Bạn có chắc chắn muốn xác nhận đơn đặt hàng <strong>PO-' + (order.poId || order.id) + '</strong>?',
            'info',
            function(selectedOrder) {
                $scope.loading = true;
                BookstoreService.changePurchaseOrderStatus(selectedOrder.poId || selectedOrder.id, 3, 'Approve order')
                    .then(function() {
                        $scope.loading = false;
                        $scope.success = 'Đã xác nhận đơn đặt hàng!';
                        $scope.loadPurchaseOrders();
                        $scope.addToast('success', $scope.success);
                        setTimeout(function() {
                            $scope.$apply(function() { $scope.success = null; });
                        }, 3000);
                    })
                    .catch(function(error) {
                        $scope.loading = false;
                        $scope.error = error.data?.message || 'Xác nhận đơn thất bại.';
                        console.error('Error approve PO:', error);
                        $scope.addToast('danger', $scope.error);
                    });
            },
            order
        );
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
        if (!line) return;
        
        // Đảm bảo qtyOrdered và unitPrice là số hợp lệ
        var qty = parseFloat(line.qtyOrdered) || 0;
        // Parse unitPrice - remove dots (thousands separator) if present
        var priceStr = String(line.unitPrice || '').replace(/\./g, '').replace(',', '.');
        var price = parseFloat(priceStr) || 0;
        
        line.lineTotal = qty * price;
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

    // Check if a book (ISBN) is already selected in another line
    $scope.isBookSelected = function(isbn, currentIndex) {
        if (!isbn || !$scope.purchaseOrderData || !$scope.purchaseOrderData.lines) {
            return false;
        }
        return $scope.purchaseOrderData.lines.some(function(l, idx) {
            return idx !== currentIndex && l && l.isbn === isbn;
        });
    };

    // Get available books for a specific line (hide books already selected on other lines, but keep current selection visible)
    $scope.getAvailableBooksForLine = function(lineIndex) {
        if (!$scope.availableBooks || !$scope.purchaseOrderData || !$scope.purchaseOrderData.lines) {
            return $scope.availableBooks || [];
        }
        var currentLine = $scope.purchaseOrderData.lines[lineIndex] || {};
        var selectedOtherIsbns = $scope.purchaseOrderData.lines
            .map(function(l, idx) { return idx !== lineIndex ? (l && l.isbn) : null; })
            .filter(function(isbn) { return !!isbn; });
        return $scope.availableBooks.filter(function(book) {
            return selectedOtherIsbns.indexOf(book.isbn) === -1 || book.isbn === currentLine.isbn;
        });
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
        if (!$scope.purchaseOrderData || !$scope.purchaseOrderData.lines) return;
        
        $scope.purchaseOrderData.totalQuantity = 0;
        $scope.purchaseOrderData.totalAmount = 0;
        
        $scope.purchaseOrderData.lines.forEach(function(line) {
            var qty = parseFloat(line.qtyOrdered) || 0;
            // Parse lineTotal - remove dots (thousands separator) if present
            var lineTotalStr = String(line.lineTotal || '').replace(/\./g, '').replace(',', '.');
            var lineTotal = parseFloat(lineTotalStr) || 0;
            
            $scope.purchaseOrderData.totalQuantity += qty;
            $scope.purchaseOrderData.totalAmount += lineTotal;
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
                    var qty = parseInt(line.qtyOrdered) || 0;
                    // Parse unitPrice - remove dots (thousands separator) if present
                    var priceStr = String(line.unitPrice || '').replace(/\./g, '').replace(',', '.');
                    var price = parseFloat(priceStr) || 0;
                    total += qty * price;
                }
            });
        }
        return total;
    };

    // Save purchase order (modal)
    $scope.savePurchaseOrder = function() {
        if ($scope.purchaseOrderData.lines.length === 0) {
            $scope.showPoConfirmModal(
                'Thiếu thông tin',
                'Vui lòng thêm ít nhất một dòng sản phẩm.',
                'warning',
                null,
                null
            );
            return;
        }

        if (!$scope.purchaseOrderData.publisherId) {
            $scope.showPoConfirmModal(
                'Thiếu thông tin',
                'Vui lòng chọn nhà xuất bản.',
                'warning',
                null,
                null
            );
            return;
        }

        // Resolve publisherName from selected publisherId if available
        var selectedPublisher = null;
        if (Array.isArray($scope.publishers) && $scope.publishers.length > 0) {
            selectedPublisher = $scope.publishers.find(function(p) { return String(p.publisherId) === String($scope.purchaseOrderData.publisherId); });
        }
        var publisherName = selectedPublisher ? (selectedPublisher.name || selectedPublisher.publisherName) : ($scope.purchaseOrderData.publisherName || '');

        $scope.isSaving = true;
        $scope.error = null;
        
        // Prepare data for API
        var orderData = {
            publisherId: $scope.purchaseOrderData.publisherId,
            publisherName: publisherName,
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
                $scope.addToast('success', $scope.success);
                
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
                $scope.addToast('danger', $scope.error);
            });
    };

    // Search purchase orders (từ search-box hoặc nút Lọc)
    $scope.searchPurchaseOrders = function() {
        $scope.currentPage = 1;
        $scope.loadPurchaseOrders();
    };

    // Clear chỉ ô tìm kiếm
    $scope.clearSearch = function() {
        $scope.searchTerm = '';
        $scope.currentPage = 1;
        $scope.loadPurchaseOrders();
    };

    // Reset toàn bộ bộ lọc (từ khóa + NXB + ngày)
    $scope.resetFilters = function() {
        $scope.searchTerm = '';
        $scope.filters = {
            publisherId: '',
            fromDate: '',
            toDate: ''
        };
        $scope.currentPage = 1;
        $scope.loadPurchaseOrders();
    };

    // Initialize
    $scope.loadPublishers();
    $scope.loadPurchaseOrders();
}]);