// Admin Returns Controller
app.controller('AdminReturnsController', ['$scope', 'BookstoreService', 'AuthService', '$location', function($scope, BookstoreService, AuthService, $location) {
    if (!AuthService.isAdminOrTeacher()) {
        $location.path('/home');
        return;
    }

    $scope.title = 'Quản lý phiếu trả';
    $scope.loading = false;
    $scope.error = null;
    $scope.success = null;
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.totalPages = 0;
    $scope.returns = [];
    $scope.filters = { invoiceId: '', fromDate: '', toDate: '' };
    $scope.selectedReturn = null;
    $scope.statusChangeData = { status: null, notes: '' };
    $scope.isChangingStatus = false;
    // Create Return state
    $scope.returnForm = {
        invoiceKeyword: '',
        selectedInvoice: null,
        reason: '',
        applyDeduction: false
    };
    $scope.invoiceSearching = false;
    $scope.invoiceSearched = false;
    $scope.invoiceResults = [];
    $scope.invoiceDetail = null;
    $scope.invoiceDetailLoading = false;
    $scope.invoicePage = 1;
    $scope.invoicePageSize = 10;
    $scope.invoiceTotalPages = 0;
    $scope.creatingReturn = false;
    $scope.refundSummary = { totalSelected: 0, deductionAmount: 0, refundAmount: 0 };

    $scope.openCreateReturn = function(){
        $scope.returnForm = { invoiceKeyword: '', selectedInvoice: null, reason: '', applyDeduction: false };
        $scope.invoiceSearching = false;
        $scope.invoiceSearched = false;
        $scope.invoiceResults = [];
        $scope.invoiceDetail = null;
        $scope.creatingReturn = false;
        $scope.refundSummary = { totalSelected: 0, deductionAmount: 0, refundAmount: 0 };
        $scope.invoicePage = 1;
        $scope.invoiceTotalPages = 0;

        // Open modal safely: remove stale backdrops, ensure correct stacking, close other modals
        $scope.$evalAsync(function(){
            setTimeout(function(){
                var el = document.getElementById('createReturnModal');
                if (!el) return;
                try {
                    // Close any other open modals (avoid two modals conflict)
                    var openModals = document.querySelectorAll('.modal.show');
                    openModals.forEach(function(m){
                        try { var inst = window.bootstrap && window.bootstrap.Modal ? window.bootstrap.Modal.getOrCreateInstance(m) : null; if (inst) inst.hide(); } catch(e){}
                    });

                    // Remove any leftover backdrops
                    document.querySelectorAll('.modal-backdrop').forEach(function(b){ try { b.parentNode.removeChild(b); } catch(e){} });

                    // Ensure modal is appended directly under <body> to avoid stacking context
                    if (el.parentNode !== document.body) {
                        document.body.appendChild(el);
                    }

                    // Show with Bootstrap API
                    var modal = window.bootstrap && window.bootstrap.Modal ? window.bootstrap.Modal.getOrCreateInstance(el, { backdrop: true, keyboard: true, focus: true }) : null;
                    if (modal) modal.show();
                    // Auto-load latest paid invoices
                    try { $scope.searchInvoices(); } catch(e) {}
                } catch (e) {
                    // Fallback
                    el.classList.add('show');
                    el.style.display = 'block';
                }
            }, 0);
        });
    };

    $scope.searchInvoices = function(){
        $scope.invoiceSearching = true;
        $scope.invoiceSearched = true;
        // Use invoice with-orders API to get invoices already paid and include order info
        BookstoreService.getInvoicesWithOrders({
            invoiceNumber: $scope.returnForm.invoiceKeyword || '',
            paymentStatus: 'PAID',
            pageNumber: $scope.invoicePage || 1,
            pageSize: $scope.invoicePageSize || 10
        }).then(function(res){
            var payload = res && res.data ? res.data : null;
            var list = [];
            if (payload) {
                if (payload.data && Array.isArray(payload.data.invoices)) {
                    list = payload.data.invoices;
                    $scope.invoiceTotalPages = payload.data.totalPages || 0;
                } else if (Array.isArray(payload.data)) {
                    list = payload.data;
                    $scope.invoiceTotalPages = payload.totalPages || 0;
                } else if (Array.isArray(payload)) {
                    list = payload;
                }
            }
            // Normalize fields we need: invoiceId, invoiceNumber, createdAt, totalAmount, orderId
            $scope.invoiceResults = (list || []).map(function(inv){
                return {
                    invoiceId: inv.invoiceId || inv.id,
                    invoiceNumber: inv.invoiceNumber || ('INV-' + (inv.invoiceId || inv.id)),
                    createdAt: inv.createdAt || inv.issuedAt || inv.paidAt,
                    totalAmount: inv.totalAmount || inv.amount || 0,
                    orderId: inv.orderId || (inv.order ? inv.order.orderId : undefined)
                };
            });
        }).finally(function(){ $scope.invoiceSearching = false; });
    };

    $scope.onInvoicePageChange = function(page){
        $scope.invoicePage = page || 1;
        $scope.searchInvoices();
    };

    $scope.loadInvoiceDetail = function(){
        $scope.invoiceDetail = null;
        $scope.invoiceDetailLoading = true;
        var inv = $scope.returnForm.selectedInvoice;
        if (!inv) return;
        // Fetch order detail to get lines
        BookstoreService.getOrderById(inv.orderId).then(function(res){
            var order = res && res.data && res.data.data ? res.data.data : null;
            if (!order) return;
            var lines = (order.lines || []).map(function(l){
                return {
                    isbn: l.isbn,
                    bookTitle: l.bookTitle,
                    qty: l.qty,
                    unitPrice: l.unitPrice,
                    _selected: false,
                    _qtyReturn: 1
                };
            });
            $scope.invoiceDetail = { orderId: order.orderId, invoiceId: inv.invoiceId, lines: lines };
            $scope.recomputeRefund();
        }).finally(function(){ $scope.invoiceDetailLoading = false; });
    };

    $scope.normalizeQty = function(line){
        if (!line) return;
        var q = parseInt(line._qtyReturn || 0, 10);
        if (isNaN(q) || q < 1) q = 1;
        if (q > line.qty) q = line.qty;
        line._qtyReturn = q;
    };

    $scope.selectAllReturn = function(){
        if (!$scope.invoiceDetail) return;
        ($scope.invoiceDetail.lines || []).forEach(function(l){ l._selected = true; l._qtyReturn = l.qty; });
        $scope.recomputeRefund();
    };

    $scope.clearSelections = function(){
        if (!$scope.invoiceDetail) return;
        ($scope.invoiceDetail.lines || []).forEach(function(l){ l._selected = false; l._qtyReturn = 1; });
        $scope.recomputeRefund();
    };

    $scope.recomputeRefund = function(){
        var total = 0;
        if ($scope.invoiceDetail && Array.isArray($scope.invoiceDetail.lines)) {
            $scope.invoiceDetail.lines.forEach(function(l){
                if (l._selected) {
                    total += (l._qtyReturn * l.unitPrice);
                }
            });
        }
        var deduction = $scope.returnForm.applyDeduction ? Math.round(total * 0.10) : 0;
        var refund = total - deduction;
        $scope.refundSummary = { totalSelected: total, deductionAmount: deduction, refundAmount: refund };
    };

    $scope.canSubmitReturn = function(){
        if (!$scope.returnForm.selectedInvoice || !$scope.invoiceDetail) return false;
        var anySelected = ($scope.invoiceDetail.lines || []).some(function(l){ return l._selected && l._qtyReturn > 0; });
        return anySelected && !$scope.creatingReturn;
    };

    $scope.submitCreateReturn = function(){
        if (!$scope.canSubmitReturn()) return;
        $scope.creatingReturn = true;
        var payload = {
            invoiceId: $scope.returnForm.selectedInvoice.invoiceId,
            orderId: $scope.invoiceDetail.orderId,
            reason: $scope.returnForm.reason || '',
            applyDeduction: !!$scope.returnForm.applyDeduction,
            deductionPercent: $scope.returnForm.applyDeduction ? 10 : 0,
            lines: ($scope.invoiceDetail.lines || []).filter(function(l){ return l._selected; }).map(function(l){
                return { isbn: l.isbn, qtyReturned: l._qtyReturn, unitPrice: l.unitPrice };
            })
        };
        BookstoreService.createReturn(payload)
            .then(function(){
                $scope.addToast('success', 'Tạo phiếu trả thành công');
                // Close modal
                var el = document.getElementById('createReturnModal');
                if (el) { try { var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null; if (modal) modal.hide(); } catch(e){} }
                $scope.loadReturns();
            })
            .catch(function(err){
                var msg = (err && err.data && err.data.message) ? err.data.message : 'Không thể tạo phiếu trả';
                $scope.addToast('danger', msg);
            })
            .finally(function(){ $scope.creatingReturn = false; });
    };

    $scope.toasts = [];
    $scope.addToast = function(variant, message) {
        var id = Date.now() + Math.random();
        $scope.toasts.push({ id: id, variant: variant, message: message });
        setTimeout(function(){
            $scope.$applyAsync(function(){
                $scope.toasts = $scope.toasts.filter(function(t){ return t.id !== id; });
            });
        }, 4000);
    };

    $scope.loadReturns = function() {
        $scope.loading = true;
        $scope.error = null;
        BookstoreService.getReturns({
            invoiceId: $scope.filters.invoiceId,
            fromDate: $scope.filters.fromDate,
            toDate: $scope.filters.toDate,
            pageNumber: $scope.currentPage,
            pageSize: $scope.pageSize
        }).then(function(res){
            var payload = res && res.data ? res.data : null;
            var list = [];
            var totalPages = 0;
            if (payload && payload.data) {
                if (Array.isArray(payload.data.returns)) {
                    list = payload.data.returns;
                    totalPages = payload.data.totalPages || 0;
                } else if (Array.isArray(payload.data)) {
                    list = payload.data;
                    totalPages = payload.totalPages || 0;
                }
            }
            $scope.returns = list;
            $scope.totalPages = totalPages;
            $scope.loading = false;
        }).catch(function(){
            $scope.loading = false;
            $scope.error = 'Không thể tải danh sách phiếu trả';
            $scope.addToast('danger', $scope.error);
        });
    };

    $scope.viewReturn = function(item){
        if (!item || !item.returnId) return;
        BookstoreService.getReturnById(item.returnId)
            .then(function(res){
                var detail = (res && res.data && res.data.data) ? res.data.data : (res && res.data ? res.data : null);
                $scope.selectedReturn = detail || item;
                setTimeout(function(){
                    var el = document.getElementById('returnDetailModal');
                    if (!el) return;
                    try { var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null; if (modal) modal.show(); } catch(e){}
                }, 0);
            })
            .catch(function(){ $scope.selectedReturn = item; });
    };

    $scope.onPageChange = function(page){
        $scope.currentPage = page;
        $scope.loadReturns();
    };

    $scope.search = function(){
        $scope.currentPage = 1;
        $scope.loadReturns();
    };

    // Status management functions
    $scope.getStatusClass = function(status) {
        switch(status) {
            case 0: return 'badge bg-warning'; // PENDING
            case 1: return 'badge bg-success'; // APPROVED
            case 2: return 'badge bg-danger';  // REJECTED
            case 3: return 'badge bg-info';    // PROCESSED
            default: return 'badge bg-secondary';
        }
    };

    $scope.getStatusText = function(status) {
        switch(status) {
            case 0: return 'CHỜ XỬ LÝ';
            case 1: return 'ĐÃ DUYỆT';
            case 2: return 'ĐÃ TỪ CHỐI';
            case 3: return 'ĐÃ XỬ LÝ';
            default: return 'KHÔNG XÁC ĐỊNH';
        }
    };

    $scope.canChangeStatus = function(returnItem) {
        return returnItem && returnItem.status === 0; // Only pending returns can be changed
    };

    $scope.showStatusChangeModal = function(returnItem, newStatus) {
        if (!returnItem || !$scope.canChangeStatus(returnItem)) return;
        
        $scope.selectedReturn = returnItem;
        $scope.statusChangeData = { 
            status: newStatus, 
            notes: '',
            returnId: returnItem.returnId
        };
        
        setTimeout(function(){
            var el = document.getElementById('statusChangeModal');
            if (!el) return;
            try { 
                var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null; 
                if (modal) modal.show(); 
            } catch(e){}
        }, 0);
    };

    $scope.changeReturnStatus = function() {
        if ($scope.isChangingStatus || !$scope.statusChangeData.status || !$scope.statusChangeData.returnId) return;
        
        $scope.isChangingStatus = true;
        
        BookstoreService.updateReturnStatus($scope.statusChangeData.returnId, {
            status: $scope.statusChangeData.status,
            notes: $scope.statusChangeData.notes
        }).then(function(res){
            $scope.isChangingStatus = false;
            $scope.addToast('success', 'Cập nhật trạng thái phiếu trả thành công');
            
            // Close modal
            var el = document.getElementById('statusChangeModal');
            if (el) {
                try { 
                    var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null; 
                    if (modal) modal.hide(); 
                } catch(e){}
            }
            
            // Reload data
            $scope.loadReturns();
        }).catch(function(err){
            $scope.isChangingStatus = false;
            var errorMsg = (err && err.data && err.data.message) ? err.data.message : 'Không thể cập nhật trạng thái phiếu trả';
            $scope.addToast('danger', errorMsg);
        });
    };

    $scope.loadReturns();
}]);



