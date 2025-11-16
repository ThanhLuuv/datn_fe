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

    // Tìm kiếm & bộ lọc (NXB + ngày)
    $scope.searchTerm = '';
    $scope.filters = {
        publisherId: '',
        fromDate: '',
        toDate: ''
    };

    // Danh sách NXB dùng cho filter
    $scope.publishers = [];

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
        purchaseOrderId: '',
        receiptDate: new Date().toISOString().split('T')[0],
        receivedBy: '',
        notes: ''
    };
    $scope.editingReceipt = null;
    $scope.showForm = false;

    // Load danh sách NXB
    $scope.loadPublishers = function() {
        BookstoreService.getPublishers({})
            .then(function(response) {
                var payload = response && response.data ? response.data : null;
                var list = [];
                if (payload) {
                    if (payload.data && Array.isArray(payload.data.publishers)) {
                        list = payload.data.publishers;
                    } else if (Array.isArray(payload.data)) {
                        list = payload.data;
                    } else if (Array.isArray(payload)) {
                        list = payload;
                    }
                }
                $scope.publishers = list;
            })
            .catch(function(error) {
                console.error('Error loading publishers for goods receipts:', error);
                $scope.publishers = [];
            });
    };

    // Load goods receipts
    $scope.loadGoodsReceipts = function() {
        $scope.loading = true;
        $scope.error = null;
        
        BookstoreService.getGoodsReceipts({
            pageNumber: $scope.currentPage,
            pageSize: $scope.pageSize,
            searchTerm: $scope.searchTerm,
            publisherId: $scope.filters.publisherId,
            fromDate: $scope.filters.fromDate,
            toDate: $scope.filters.toDate
        })
            .then(function(response) {
                // Normalize API response: support { data: { goodsReceipts: [...] } }
                var payload = response && response.data ? response.data : null;
                var list = [];
                var totalPages = 0;
                if (payload) {
                    if (payload.data && Array.isArray(payload.data.goodsReceipts)) {
                        list = payload.data.goodsReceipts;
                        totalPages = payload.data.totalPages || 0;
                    } else if (Array.isArray(payload.data)) {
                        list = payload.data;
                        totalPages = payload.totalPages || 0;
                    } else if (Array.isArray(payload)) {
                        list = payload;
                        totalPages = 0;
                    }
                }
                // Normalize fields for display (publisherName may be inside purchaseOrderInfo)
                $scope.goodsReceipts = list.map(function(item) {
                    if (item && !item.publisherName) {
                        if (item.purchaseOrderInfo && typeof item.purchaseOrderInfo === 'string') {
                            var parts = item.purchaseOrderInfo.split(' - ');
                            if (parts.length > 1) {
                                item.publisherName = parts.slice(1).join(' - ');
                            }
                        }
                    }
                    return item;
                });
                $scope.totalPages = totalPages;
                $scope.loading = false;
            })
            .catch(function(error) {
                $scope.error = 'Không thể tải danh sách phiếu nhập hàng. Vui lòng thử lại.';
                $scope.loading = false;
                console.error('Error loading goods receipts:', error);
                $scope.addToast('danger', $scope.error);
            });
    };

    // Open create modal
    $scope.openCreateModal = function() {
        $scope.isEditMode = false;
        var currentUser = AuthService.getCurrentUser && AuthService.getCurrentUser();
        $scope.goodsReceiptData = {
            poId: '',
            receiptDate: new Date().toISOString().split('T')[0],
            receivedBy: (currentUser && (currentUser.fullName || currentUser.name || currentUser.email)) || '',
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
                var payload = response && response.data ? response.data : null;
                var list = [];
                if (payload) {
                    // New backend format: { success, message, data: [...] }
                    if (Array.isArray(payload.data)) {
                        list = payload.data;
                    } else if (Array.isArray(payload)) {
                        list = payload;
                    }
                }
                // Only include available POs:
                // - Approved (statusId === 3 or statusName === 'approved')
                // - Or backend already filtered and leaves status as null → accept as available
                $scope.availablePurchaseOrders = list.filter(function(po) {
                    if (!po) return false;
                    var name = po.statusName ? String(po.statusName).toLowerCase() : null;
                    return po.statusId === 3 || name === 'approved' || (po.statusId == null && name == null);
                });

                // If a PO was preselected (from navigation), populate details now
                if ($scope.goodsReceiptData && $scope.goodsReceiptData.poId) {
                    $scope.loadPurchaseOrderDetails();
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
        // Prefill from navigation if present
        var preselectedPoId = sessionStorage.getItem('selected_po_id');
        if (preselectedPoId) {
            $scope.formData.purchaseOrderId = preselectedPoId;
            $scope.goodsReceiptData = $scope.goodsReceiptData || {};
            $scope.goodsReceiptData.poId = preselectedPoId;
            sessionStorage.removeItem('selected_po_id');
        }
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
                $scope.error = error.data?.message || 'Có lỗi xảy ra khi lưu phiếu nhập hàng.';
                console.error('Error saving goods receipt:', error);
                $scope.addToast('danger', $scope.error);
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
                    $scope.error = error.data?.message || 'Có lỗi xảy ra khi xóa phiếu nhập hàng.';
                    console.error('Error deleting goods receipt:', error);
                    $scope.addToast('danger', $scope.error);
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

    // Load purchase order details and seed receipt lines from the selected PO
    $scope.loadPurchaseOrderDetails = function() {
        var poId = $scope.goodsReceiptData && $scope.goodsReceiptData.poId;
        if (!poId) {
            $scope.selectedPurchaseOrder = null;
            $scope.goodsReceiptData.lines = [];
            $scope.receiptValidation = { hasError: false, lineErrors: [] };
            return;
        }

        var po = $scope.availablePurchaseOrders.find(function(item) {
            return String(item.poId) === String(poId) || String(item.id) === String(poId);
        });
        $scope.selectedPurchaseOrder = po || null;

        // Initialize receipt lines from PO lines
        $scope.goodsReceiptData.lines = (po && Array.isArray(po.lines)) ? po.lines.map(function(line) {
            return {
                isbn: line.isbn,
                bookTitle: line.bookTitle,
                qtyOrdered: line.qtyOrdered,
                unitCost: line.unitPrice, // keep internally for total calc
                qtyReceived: line.qtyOrdered, // Tự động fill số lượng nhận bằng số lượng đặt
                lineTotal: (parseInt(line.qtyOrdered) || 0) * (parseFloat(line.unitPrice) || 0)
            };
        }) : [];

        $scope.validateReceiptLines();
    };

    // Fill all quantities with ordered quantities
    $scope.fillAllQuantities = function() {
        if (!$scope.selectedPurchaseOrder || !$scope.goodsReceiptData || !$scope.goodsReceiptData.lines) {
            return;
        }

        // Fill all quantities with ordered quantities
        $scope.goodsReceiptData.lines.forEach(function(line, index) {
            if (line && line.qtyOrdered) {
                line.qtyReceived = line.qtyOrdered;
                $scope.updateLineTotal(index);
            }
        });

        // Show success message
        $scope.addToast('success', 'Đã tự động điền số lượng nhận cho tất cả sách!');
    };

    // Fill single quantity with ordered quantity
    $scope.fillSingleQuantity = function(index) {
        if (!$scope.goodsReceiptData || !$scope.goodsReceiptData.lines || !$scope.goodsReceiptData.lines[index]) {
            return;
        }

        var line = $scope.goodsReceiptData.lines[index];
        if (line && line.qtyOrdered) {
            line.qtyReceived = line.qtyOrdered;
            $scope.updateLineTotal(index);
        }
    };

    // Recalculate a line total and overall totals
    $scope.updateLineTotal = function(index) {
        if (!$scope.goodsReceiptData || !$scope.goodsReceiptData.lines) return;
        var line = $scope.goodsReceiptData.lines[index];
        if (!line) return;
        var qty = parseInt(line.qtyReceived) || 0;
        // Use PO unitPrice as the base price since unit cost column is removed
        var poLine = ($scope.selectedPurchaseOrder && Array.isArray($scope.selectedPurchaseOrder.lines)) ? $scope.selectedPurchaseOrder.lines[index] : null;
        var price = poLine ? (parseFloat(poLine.unitPrice) || 0) : (parseFloat(line.unitCost) || 0);
        line.lineTotal = qty * price;
        $scope.validateReceiptLines();
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

    // Validate receipt lines versus selected purchase order (index-aligned with PO table)
    $scope.validateReceiptLines = function() {
        var result = { hasError: false, lineErrors: [] };
        var goodsMapByIsbn = {};
        if ($scope.goodsReceiptData && Array.isArray($scope.goodsReceiptData.lines)) {
            $scope.goodsReceiptData.lines.forEach(function(gl){
                if (gl && gl.isbn) goodsMapByIsbn[gl.isbn] = gl;
            });
        }

        if ($scope.selectedPurchaseOrder && Array.isArray($scope.selectedPurchaseOrder.lines)) {
            $scope.selectedPurchaseOrder.lines.forEach(function(poLine, idx){
                var errs = [];
                var productErrors = []; // Lỗi về sản phẩm (disable nút)
                var gl = (poLine && poLine.isbn) ? goodsMapByIsbn[poLine.isbn] : null;
                if (!gl) {
                    var errorMsg = 'Thiếu dòng từ Excel';
                    errs.push(errorMsg);
                    productErrors.push(errorMsg); // Lỗi sản phẩm
                } else {
                    // Validation số lượng nhận không vượt quá số lượng đặt (chỉ cảnh báo, không disable)
                    var qOrdered = parseInt(poLine.qtyOrdered) || 0;
                    var qReceived = parseInt(gl.qtyReceived) || 0;
                    if (qReceived > qOrdered) {
                        errs.push('SL nhận (' + qReceived + ') vượt quá SL đặt (' + qOrdered + ')');
                        // Không thêm vào productErrors - cho phép nhập
                    }
                    
                    var pricePo = parseFloat(poLine.unitPrice) || 0;
                    var priceRecv = (gl.unitCost != null) ? (parseFloat(gl.unitCost) || 0) : pricePo;
                    if (priceRecv !== pricePo) {
                        errs.push('Đơn giá khác đơn đặt');
                        productErrors.push('Đơn giá khác đơn đặt'); // Lỗi sản phẩm
                    }
                }
                result.lineErrors[idx] = { hasError: errs.length>0, errors: errs, productError: productErrors.length>0 };
                // Chỉ set hasError = true nếu có lỗi về sản phẩm
                if (productErrors.length>0) result.hasError = true;
            });
        }
        $scope.receiptValidation = result;
    };

    // Cancel purchase order (set status to 5) when validation errors exist
    $scope.cancelPurchaseOrderDueToMismatch = function() {
        if (!$scope.goodsReceiptData || !$scope.goodsReceiptData.poId) return;
        if (!$scope.receiptValidation || !$scope.receiptValidation.hasError) return;
        if (!confirm('Hủy đơn đặt hàng PO-' + $scope.goodsReceiptData.poId + ' do không khớp số lượng/đơn giá?')) return;
        $scope.loading = true;
        BookstoreService.changePurchaseOrderStatus($scope.goodsReceiptData.poId, 5, 'Cancel due to mismatch on goods receipt')
            .then(function(){
                $scope.loading = false;
                $scope.success = 'Đã hủy đơn đặt hàng.';
                $scope.addToast('warning', $scope.success);
                // Close create modal if open
                var grModal = bootstrap.Modal.getInstance(document.getElementById('goodsReceiptModal'));
                if (grModal) { grModal.hide(); }
                setTimeout(function(){ $scope.$apply(function(){ $scope.success = null; }); }, 3000);
            })
            .catch(function(err){
                $scope.loading = false;
                $scope.error = err.data?.message || 'Không thể hủy đơn đặt hàng.';
                $scope.addToast('danger', $scope.error);
            });
    };

    // Get total amount for display
    $scope.getTotalAmount = function() {
        var total = 0;
        if ($scope.goodsReceiptData && $scope.goodsReceiptData.lines) {
            $scope.goodsReceiptData.lines.forEach(function(line, idx) {
                if (line.qtyReceived) {
                    var poLine = ($scope.selectedPurchaseOrder && Array.isArray($scope.selectedPurchaseOrder.lines)) ? $scope.selectedPurchaseOrder.lines[idx] : null;
                    var price = poLine ? (parseFloat(poLine.unitPrice) || 0) : (parseFloat(line.unitCost) || 0);
                    total += (parseInt(line.qtyReceived) || 0) * price;
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

        // Build lines payload: require at least one line with qtyReceived > 0
        var linesPayload = [];
        if ($scope.goodsReceiptData && Array.isArray($scope.goodsReceiptData.lines)) {
            $scope.goodsReceiptData.lines.forEach(function(line, idx) {
                var qty = parseInt(line.qtyReceived) || 0;
                if (qty > 0) {
                    var poLine = ($scope.selectedPurchaseOrder && Array.isArray($scope.selectedPurchaseOrder.lines)) ? $scope.selectedPurchaseOrder.lines[idx] : null;
                    var price = poLine ? (parseFloat(poLine.unitPrice) || 0) : (parseFloat(line.unitCost) || 0);
                    linesPayload.push({
                        isbn: line.isbn,
                        qtyReceived: qty,
                        unitCost: price
                    });
                }
            });
        }

        if (linesPayload.length === 0) {
            $scope.error = 'Vui lòng nhập số lượng nhận cho ít nhất 1 sách.';
            return;
        }

        // Show warning if there are validation errors but still allow save (chỉ cảnh báo về đơn giá)
        var hasValidationWarnings = $scope.receiptValidation && $scope.receiptValidation.hasError;
        if (hasValidationWarnings) {
            var confirmSave = confirm('Có một số cảnh báo về đơn giá không khớp với đơn đặt hàng. Bạn có muốn tiếp tục tạo phiếu nhập không?');
            if (!confirmSave) {
                return;
            }
        }

        $scope.isSaving = true;
        $scope.error = null;

        // Prepare data for API
        var receiptData = {
            poId: $scope.goodsReceiptData.poId,
            receiptDate: $scope.goodsReceiptData.receiptDate,
            receivedBy: $scope.goodsReceiptData.receivedBy,
            note: $scope.goodsReceiptData.note,
            lines: linesPayload
        };

        BookstoreService.createGoodsReceipt(receiptData)
            .then(function(response) {
                $scope.isSaving = false;
                var successMessage = hasValidationWarnings ? 
                    'Tạo phiếu nhập hàng thành công! (Có một số cảnh báo đã được ghi nhận)' : 
                    'Tạo phiếu nhập hàng thành công!';
                $scope.success = successMessage;
                $scope.loadGoodsReceipts();
                $scope.addToast('success', successMessage);
                
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

    // Search goods receipts (từ search-box hoặc nút Lọc)
    $scope.searchGoodsReceipts = function() {
        $scope.currentPage = 1;
        $scope.loadGoodsReceipts();
    };

    // Clear chỉ ô tìm kiếm
    $scope.clearSearch = function() {
        $scope.searchTerm = '';
        $scope.currentPage = 1;
        $scope.loadGoodsReceipts();
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
        $scope.loadGoodsReceipts();
    };

    // View goods receipt detail
    $scope.viewGoodsReceipt = function(gr) {
        if (!gr) return;
        $scope.selectedGoodsReceipt = gr;
        var modalEl = document.getElementById('goodsReceiptDetailModal');
        if (modalEl) {
            var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    };

    // Initialize
    $scope.loadPublishers();
    $scope.loadGoodsReceipts();

    // ==================== Excel Import ====================
    $scope.openImportExcelModal = function() {
        $scope.excelWorkbook = null;
        $scope.excelSheets = [];
        $scope.selectedExcelSheet = null;
        $scope.excelPreview = [];
        var modal = new bootstrap.Modal(document.getElementById('importExcelModal'));
        modal.show();
    };

    $scope.onExcelFileSelected = function(files) {
        if (!files || !files.length) return;
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, { type: 'array' });
                $scope.$apply(function(){
                    $scope.excelWorkbook = workbook;
                    $scope.excelSheets = workbook.SheetNames || [];
                    $scope.selectedExcelSheet = $scope.excelSheets[0] || null;
                    $scope.previewExcelSheet();
                });
            } catch(err) {
                console.error('Read excel error', err);
                $scope.$apply(function(){
                    $scope.excelSheets = [];
                    $scope.excelPreview = [];
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    $scope.previewExcelSheet = function() {
        if (!$scope.excelWorkbook || !$scope.selectedExcelSheet) {
            $scope.excelPreview = [];
            return;
        }
        var ws = $scope.excelWorkbook.Sheets[$scope.selectedExcelSheet];
        if (!ws) { $scope.excelPreview = []; return; }

        // Convert sheet to JSON by rows
        var rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
        // Heuristic: find table header row by keywords (ISBN | Tên | Số lượng | Đơn giá | Thành tiền)
        var headerRowIndex = -1;
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i] || [];
            var joined = r.join(' ').toLowerCase();
            if (joined.includes('isbn') || (joined.includes('tên') && joined.includes('số lượng'))) {
                headerRowIndex = i;
                break;
            }
        }
        if (headerRowIndex === -1) { $scope.excelPreview = []; return; }

        var headers = rows[headerRowIndex];
        var dataRows = rows.slice(headerRowIndex + 1);

        function getIndexByKeywords(keys) {
            var idx = -1;
            if (!headers) return -1;
            for (var j=0;j<headers.length;j++) {
                var h = (headers[j] || '').toString().toLowerCase();
                if (keys.some(function(k){ return h.includes(k); })) { idx = j; break; }
            }
            return idx;
        }

        var idxIsbn = getIndexByKeywords(['isbn']);
        var idxTitle = getIndexByKeywords(['tên', 'ten', 'sản phẩm', 'san pham']);
        var idxQtyOrdered = getIndexByKeywords(['số lượng đặt', 'sl đặt', 'so luong dat']);
        var idxQtyReceived = getIndexByKeywords(['số lượng nhận', 'sl nhận', 'so luong nhan']);
        var idxUnitPrice = getIndexByKeywords(['đơn giá', 'don gia', 'giá']);
        var idxLineTotal = getIndexByKeywords(['thành tiền', 'thanh tien']);

        var preview = [];
        dataRows.forEach(function(r){
            if (!r || r.length === 0) return;
            var isbn = idxIsbn >=0 ? (r[idxIsbn] || '').toString().trim() : '';
            var bookTitle = idxTitle >=0 ? (r[idxTitle] || '').toString().trim() : '';
            var qo = idxQtyOrdered >=0 ? parseInt(r[idxQtyOrdered]) || 0 : 0;
            var qr = idxQtyReceived >=0 ? parseInt(r[idxQtyReceived]) || 0 : qo;
            var up = idxUnitPrice >=0 ? parseFloat(r[idxUnitPrice]) || 0 : 0;
            var lt = idxLineTotal >=0 ? parseFloat(r[idxLineTotal]) || (qr * up) : (qr * up);
            if (!isbn && !bookTitle) return; // skip blanks
            preview.push({ isbn: isbn, bookTitle: bookTitle, qtyOrdered: qo, qtyReceived: qr, unitPrice: up, lineTotal: lt });
        });
        // Try enrich ISBN from selected PO when missing in file (match by title and/or unit price)
        try {
            if ($scope.selectedPurchaseOrder && Array.isArray($scope.selectedPurchaseOrder.lines)) {
                var poLines = $scope.selectedPurchaseOrder.lines;
                preview = preview.map(function(row){
                    if (row.isbn) return row;
                    var titleNorm = (row.bookTitle || '').toString().trim().toLowerCase();
                    var candidates = poLines.filter(function(pl){
                        var plTitle = (pl.bookTitle || '').toString().trim().toLowerCase();
                        var priceEqual = (row.unitPrice ? (parseFloat(row.unitPrice)||0) : 0) === (parseFloat(pl.unitPrice)||0);
                        return plTitle === titleNorm || priceEqual;
                    });
                    if (candidates.length === 1) {
                        row.isbn = candidates[0].isbn;
                        // Prefer ordered quantities from PO if not present in file
                        if (!row.qtyOrdered) row.qtyOrdered = candidates[0].qtyOrdered || 0;
                    }
                    return row;
                });
            }
        } catch(e) { /* no-op enrich failure */ }
        $scope.excelPreview = preview;

        // Validate excel preview rows against selected PO immediately (title matching)
        $scope.excelPreviewValidation = { hasError: false, lineErrors: [] };
        try {
            var poMapByIsbn = {};
            var poMapByTitle = {};
            if ($scope.selectedPurchaseOrder && Array.isArray($scope.selectedPurchaseOrder.lines)) {
                $scope.selectedPurchaseOrder.lines.forEach(function(l){
                    if (!l) return;
                    var t = (l.bookTitle || '').toString().trim().toLowerCase();
                    poMapByTitle[t] = l;
                    if (l.isbn) poMapByIsbn[l.isbn] = l;
                });
            }
            preview.forEach(function(row){
                var errs = [];
                var poLine = null;
                if (row.isbn && poMapByIsbn[row.isbn]) {
                    poLine = poMapByIsbn[row.isbn];
                } else {
                    var t = (row.bookTitle || '').toString().trim().toLowerCase();
                    poLine = poMapByTitle[t] || null;
                }
                if (!poLine) {
                    errs.push('Không có trong đơn đặt');
                } else {
                    var tExcel = (row.bookTitle || '').toString().trim().toLowerCase();
                    var tPo = (poLine.bookTitle || '').toString().trim().toLowerCase();
                    if (tExcel !== tPo) {
                        errs.push('Tên sách không khớp');
                    }
                    
                    // Validation số lượng nhận không vượt quá số lượng đặt
                    var qOrdered = parseInt(poLine.qtyOrdered) || 0;
                    var qReceived = parseInt(row.qtyReceived) || 0;
                    if (qReceived > qOrdered) {
                        errs.push('SL nhận (' + qReceived + ') vượt quá SL đặt (' + qOrdered + ')');
                    }
                }
                $scope.excelPreviewValidation.lineErrors.push({ hasError: errs.length>0, errors: errs });
                if (errs.length>0) $scope.excelPreviewValidation.hasError = true;
            });
        } catch(err) { /* ignore */ }
    };

    $scope.applyExcelImport = function() {
        if (!$scope.excelPreview || !$scope.excelPreview.length) return;
        // Ensure modal create is open; seed goodsReceiptData and selectedPurchaseOrder minimal for totals
        $scope.goodsReceiptData = $scope.goodsReceiptData || { lines: [] };
        $scope.selectedPurchaseOrder = $scope.selectedPurchaseOrder || { lines: [] };

        $scope.goodsReceiptData.lines = $scope.excelPreview.map(function(row){
            return {
                isbn: row.isbn,
                bookTitle: row.bookTitle,
                qtyOrdered: row.qtyOrdered || 0,
                qtyReceived: row.qtyReceived || 0,
                unitCost: row.unitPrice || 0,
                lineTotal: (row.qtyReceived || 0) * (row.unitPrice || 0)
            };
        });
        // Keep selectedPurchaseOrder intact (used as the truth for validation)
        // Validate immediately after applying
        $scope.validateReceiptLines();

        // Close modal
        var modal = bootstrap.Modal.getInstance(document.getElementById('importExcelModal'));
        if (modal) modal.hide();
    };
}]);