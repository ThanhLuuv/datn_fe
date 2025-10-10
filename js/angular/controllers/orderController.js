// Customer Order Controllers

// Admin Orders Controller
app.controller('AdminOrdersController', ['$scope', '$rootScope', 'BookstoreService', 'AuthService', '$location', '$route', function($scope, $rootScope, BookstoreService, AuthService, $location, $route) {
	if (!AuthService.isAdminOrTeacher()) {
		$location.path('/home');
		return;
	}

	$scope.title = 'Quản lý đơn hàng khách hàng';
	$scope.loading = false;
	$scope.error = null;
	$scope.success = null;
	$scope.currentPage = 1;
	$scope.pageSize = 10;
	$scope.totalPages = 0;
	$scope.orders = [];
    $scope.selectedOrder = null;
    $rootScope.selectedOrder = null;
    $scope.deliveryCandidates = [];
    $scope.deliveryDateInput = '';
    $scope.candidatesLoading = false;
    $scope.deliveryDateMin = '';
    $scope.dateInvalid = false;

    function formatNowForDatetimeLocal(date) {
        var d = date || new Date();
        var pad = function(n){ return (n<10?'0':'') + n; };
        var yyyy = d.getFullYear();
        var MM = pad(d.getMonth()+1);
        var dd = pad(d.getDate());
        var hh = pad(d.getHours());
        var mm = pad(d.getMinutes());
        return yyyy + '-' + MM + '-' + dd + 'T' + hh + ':' + mm;
    }

    $scope.updateDeliveryDateValidity = function(){
        if (!$scope.deliveryDateInput) { 
            $scope.dateInvalid = true; 
            return; 
        }
        
        var t = Date.parse($scope.deliveryDateInput);
        if (isNaN(t)) { 
            $scope.dateInvalid = true; 
            return; 
        }
        
        var now = Date.now();
        // Allow slight clock skew (5 minutes) and be more lenient
        // Also check if the date is reasonable (not too far in the past)
        var fiveMinutesAgo = now - 300000;
        var oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        // Invalid if more than 1 day in the past, but allow 5 minutes clock skew
        $scope.dateInvalid = (t < oneDayAgo);
        
        // Debug log to help troubleshoot
        console.log('Date validation:', {
            input: $scope.deliveryDateInput,
            parsed: new Date(t),
            now: new Date(now),
            invalid: $scope.dateInvalid,
            timeDiff: t - now
        });
    };

    // Initialize default delivery date to now so input auto-fills on first open
    (function initDefaultDeliveryDate(){
        try {
            $scope.deliveryDateMin = formatNowForDatetimeLocal();
            if (!$scope.deliveryDateInput) {
                // Set to current time + 1 hour to ensure it's in the future
                var futureDate = new Date();
                futureDate.setHours(futureDate.getHours() + 1);
                $scope.deliveryDateInput = formatNowForDatetimeLocal(futureDate);
            }
            $scope.updateDeliveryDateValidity();
        } catch(e) {
            console.error('Error initializing delivery date:', e);
        }
    })();

    // Reset delivery date when modal opens
    $scope.resetDeliveryDate = function() {
        var futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + 1);
        $scope.deliveryDateInput = formatNowForDatetimeLocal(futureDate);
        $scope.updateDeliveryDateValidity();
    };

    // Ensure candidates load when modal is shown
    setTimeout(function(){
        var el = document.getElementById('orderDetailModal');
        if (!el) return;
        el.addEventListener('shown.bs.modal', function(){
            try {
                var cur = $rootScope.selectedOrder || $scope.selectedOrder;
                if (cur && (cur.orderId || cur.id) && $scope.getOrderStatus(cur) === 'Pending') {
                    // Only fetch suggestions for unassigned orders
                    $scope.refreshDeliveryCandidates(cur.orderId || cur.id);
                }
                // Reset delivery date to ensure it's valid
                $scope.resetDeliveryDate();
                $scope.$applyAsync();
            } catch (e) {
                console.error('Error in modal shown handler:', e);
            }
        });
    }, 0);

	$scope.filters = {
		keyword: '',
		customerId: '',
		status: '',
		fromDate: '',
		toDate: ''
	};

	// Toasts
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

	$scope.loadOrders = function() {
		$scope.loading = true;
		$scope.error = null;
		BookstoreService.getOrders({
			keyword: $scope.filters.keyword,
			customerId: $scope.filters.customerId,
			status: $scope.filters.status,
			fromDate: $scope.filters.fromDate,
			toDate: $scope.filters.toDate,
			pageNumber: $scope.currentPage,
			pageSize: $scope.pageSize
		}).then(function(response){
			var payload = response && response.data ? response.data : null;
			var list = [];
			var totalPages = 0;
			if (payload) {
				if (payload.data && Array.isArray(payload.data.orders)) {
					list = payload.data.orders;
					totalPages = payload.data.totalPages || 0;
				} else if (Array.isArray(payload.data)) {
					list = payload.data;
					totalPages = payload.totalPages || 0;
				} else if (Array.isArray(payload)) {
					list = payload;
					totalPages = 0;
				}
			}
			$scope.orders = list;
			$scope.totalPages = totalPages;
			$scope.loading = false;
		}).catch(function(){
			$scope.loading = false;
			$scope.error = 'Không thể tải danh sách đơn hàng';
			$scope.addToast('danger', $scope.error);
		});
	};

$scope.viewOrder = function(order){
	console.log(order);
    // Show immediately with list data
    $scope.selectedOrder = angular.copy(order || {});
    $rootScope.selectedOrder = $scope.selectedOrder;
    // Load candidates immediately on open
    var curId = ($scope.selectedOrder.orderId || $scope.selectedOrder.id);
    if (curId && $scope.getOrderStatus($scope.selectedOrder) === 'Pending') {
        $scope.deliveryDateMin = formatNowForDatetimeLocal();
        if (!$scope.deliveryDateInput) {
            $scope.deliveryDateInput = $scope.deliveryDateMin;
        }
        $scope.updateDeliveryDateValidity();
        $scope.refreshDeliveryCandidates(curId);
    }

    if (!$scope.selectedOrder.lines || !Array.isArray($scope.selectedOrder.lines)) {
        $scope.selectedOrder.lines = [];
    }
    $scope.selectedOrder.lines = $scope.selectedOrder.lines.map(function(l){
        if (l && l.qty != null && l.quantity == null) l.quantity = l.qty;
        if (l && l.lineTotal == null && l.quantity != null && l.unitPrice != null) l.lineTotal = Number(l.quantity) * Number(l.unitPrice);
        return l;
    });
    $rootScope.selectedOrder = $scope.selectedOrder;

    setTimeout(function(){
        var el = document.getElementById('orderDetailModal');
        if (!el) return;
        try {
            var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
            if (modal) modal.show();
        } catch (e) {
            if (el.showModal) el.showModal();
        }
    }, 0);

    // Optional: try to refresh with detail API if available
    if (order && (order.orderId || order.id) && BookstoreService.getOrderById) {
        BookstoreService.getOrderById(order.orderId || order.id)
            .then(function(res){
                var detail = (res && res.data && res.data.data) ? res.data.data : (res && res.data ? res.data : null);
                if (!detail) return;
                $scope.$applyAsync(function(){
                    $scope.selectedOrder = detail;
                    $rootScope.selectedOrder = $scope.selectedOrder;
                    if (!$scope.selectedOrder.lines || !Array.isArray($scope.selectedOrder.lines)) $scope.selectedOrder.lines = [];
                    $scope.selectedOrder.lines = $scope.selectedOrder.lines.map(function(l){
                        if (l && l.qty != null && l.quantity == null) l.quantity = l.qty;
                        if (l && l.lineTotal == null && l.quantity != null && l.unitPrice != null) l.lineTotal = Number(l.quantity) * Number(l.unitPrice);
                        return l;
                    });
                    // After detail loaded, fetch delivery candidates
                    $scope.loadDeliveryCandidates($scope.selectedOrder.orderId || $scope.selectedOrder.id);
                });
            })
            .catch(function(){ /* ignore; list data already shown */ });
    }
    // also try to load candidates from list data
    if (order && (order.orderId || order.id) && $scope.getOrderStatus(order) === 'Pending') {
        $scope.refreshDeliveryCandidates(order.orderId || order.id);
    }
};

// Normalize order status to string values used by UI
$scope.getOrderStatus = function(order){
    if (!order) return '';
    var s = order.status;
    // Prefer explicit text if available
    if (typeof s === 'string' && s.length > 0) return s;
    var id = order.statusId != null ? order.statusId : s;
    if (typeof id === 'number') {
        // Common mapping: 0/1/2/3 or 1/2/3
        switch(id){
            case 0: return 'Pending';
            case 1: return 'Assigned';
            case 2: return 'Delivered';
            case 3: return 'Delivered';
            default: return '';
        }
    }
    return '';
};

$scope.canAssign = function(order){
    var s = $scope.getOrderStatus(order);
    return s === 'Pending' || s === 'Approved';
};

$scope.closeOrderDetail = function(){
    var el = document.getElementById('orderDetailModal');
    if (!el) return;
    try {
        var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
        if (modal) return modal.hide();
    } catch (e) {}
    if (el.close) el.close();
    $scope.selectedOrder = null;
    $rootScope.selectedOrder = null;
};

	$scope.approveOrder = function(order, approved){
		var id = order.orderId || order.id;
		BookstoreService.approveOrder(id, { approved: approved, note: approved ? 'Đồng ý' : 'Không đồng ý' })
			.then(function(){
				$scope.addToast('success', approved ? 'Đã duyệt đơn' : 'Đã từ chối đơn');
				$scope.loadOrders();
			})
			.catch(function(){
				$scope.addToast('danger', 'Không thể cập nhật trạng thái duyệt');
			});
	};

$scope.assignDelivery = function(order){
    // Open detail modal and load candidates immediately
    $scope.viewOrder(order);
    var id = order && (order.orderId || order.id);
    if (id) $scope.loadDeliveryCandidates(id);
};

// Load delivery candidates
$scope.loadDeliveryCandidates = function(orderId){
    if (!BookstoreService.getOrderDeliveryCandidates) return;
    $scope.deliveryCandidates = [];
    return BookstoreService.getOrderDeliveryCandidates(orderId)
        .then(function(res){
            var payload = (res && res.data) ? res.data : null;
            var list = (payload && Array.isArray(payload.data)) ? payload.data : [];
            // simple ranking: area matched first, then fewer active assigned, then more delivered
            list.sort(function(a, b){
                var amA = !!a.isAreaMatched ? 1 : 0;
                var amB = !!b.isAreaMatched ? 1 : 0;
                if (amB !== amA) return amB - amA; // true first
                var aaA = Number(a.activeAssignedOrders || a.activeAssigned || 0);
                var aaB = Number(b.activeAssignedOrders || b.activeAssigned || 0);
                if (aaA !== aaB) return aaA - aaB; // fewer first
                var dvA = Number(a.totalDeliveredOrders || a.delivered || 0);
                var dvB = Number(b.totalDeliveredOrders || b.delivered || 0);
                return dvB - dvA; // more delivered first
            });
            $scope.deliveryCandidates = list;
            try { $scope.$applyAsync(); } catch (e) {}
        })
        .catch(function(){
            $scope.deliveryCandidates = [];
        });
};

// Wrapper to toggle loading state when fetching candidates
$scope.refreshDeliveryCandidates = function(orderId){
    $scope.candidatesLoading = true;
    return $scope.loadDeliveryCandidates(orderId).finally(function(){
        $scope.candidatesLoading = false;
    });
};

// Assign delivery from candidate row
$scope.assignDeliveryCandidate = function(order, candidate){
    // Validate date
    $scope.updateDeliveryDateValidity();
    if ($scope.dateInvalid) {
        $scope.addToast('warning', 'Vui lòng chọn ngày giao hợp lệ (không ở quá khứ)');
        return;
    }
    var localValue = $scope.deliveryDateInput;
    var dateInput = new Date(localValue).toISOString();
    BookstoreService.assignOrderDelivery(order.orderId || order.id, { deliveryEmployeeId: Number(candidate.employeeId || candidate.id), deliveryDate: dateInput })
        .then(function(){
            $scope.addToast('success', 'Đã phân công giao hàng');
            try { $route.reload(); } catch(e) { $scope.loadOrders(); }
            $scope.closeOrderDetail();
        })
        .catch(function(){
            $scope.addToast('danger', 'Không thể phân công giao hàng');
        });
};

	$scope.confirmDelivered = function(order){
		var note = prompt('Ghi chú giao hàng') || 'Đã giao';
		BookstoreService.confirmOrderDelivered(order.orderId || order.id, { success: true, note: note })
			.then(function(){
				$scope.addToast('success', 'Đã xác nhận giao thành công');
				$scope.loadOrders();
			})
			.catch(function(){
				$scope.addToast('danger', 'Không thể xác nhận giao hàng');
			});
	};

// Return order
$scope.returnOrder = function(order){
    console.log('[Return] open for order:', order && (order.orderId || order.id));
    console.log('[Return] order.lines exists:', Array.isArray(order && order.lines), 'len:', (order && order.lines && order.lines.length) || 0);
    // Open return modal with lines and qty inputs
    $scope.returnLoading = true;
    $scope.returnModel = {
        invoiceId: (order && order.invoice && order.invoice.invoiceId) ? order.invoice.invoiceId : (order.orderId || order.id),
        reason: '',
        lines: []
    };
    $rootScope.returnModel = $scope.returnModel;
    $scope.$applyAsync(function(){
        var el = document.getElementById('returnModal');
        console.log('[Return] modal element found:', !!el);
        if (!el) return;
        try {
            // Ensure no lingering backdrops
            var bds = document.querySelectorAll('.modal-backdrop');
            bds.forEach(function(b){ try { b.parentNode.removeChild(b); } catch(e){} });
            // Move modal under body to avoid stacking context issues (bindings remain on the same node)
            if (el.parentNode && el.parentNode !== document.body) {
                document.body.appendChild(el);
            }
            var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el, { backdrop: true, keyboard: true }) : null;
            console.log('[Return] bootstrap modal instance:', !!modal);
            if (modal) modal.show();
            else { el.classList.add('show'); el.style.display = 'block'; }
        } catch (e) {
            console.error('[Return] error opening modal', e);
            if (el.showModal) el.showModal();
        }
    });

    // Populate from list data immediately, then refresh from detail API
    var sourceLines = Array.isArray(order && order.lines) ? order.lines : [];
    if ((!sourceLines || sourceLines.length === 0) && $rootScope.selectedOrder && ($rootScope.selectedOrder.orderId === (order.orderId||order.id))) {
        sourceLines = Array.isArray($rootScope.selectedOrder.lines) ? $rootScope.selectedOrder.lines : [];
        console.log('[Return] fallback to selectedOrder lines, len:', sourceLines.length);
    }
    var buildLines = function(lines){
        return (lines || []).map(function(l){
            var maxQty = l.quantity != null ? l.quantity : (l.qty != null ? l.qty : (l.qtyOrdered != null ? l.qtyOrdered : 0));
            return {
                orderLineId: l.orderLineId || l.id,
                bookTitle: l.bookTitle || l.title || l.bookName || ('#' + (l.orderLineId || l.id || '?')),
                unitPrice: l.unitPrice != null ? l.unitPrice : l.price,
                maxQty: maxQty,
                qtyReturned: 0
            };
        });
    };
    // Prefill with current lines if any
    if (sourceLines && sourceLines.length > 0) {
        $scope.returnModel.lines = buildLines(sourceLines);
        $rootScope.returnModel = $scope.returnModel;
        console.log('[Return] prefilled from list, len:', $scope.returnModel.lines.length);
        $scope.returnLoading = false;
        $scope.$applyAsync();
    }
    // Always fetch detail to ensure fresh lines
    $scope.returnLoading = true;
    BookstoreService.getOrderById(order.orderId || order.id)
        .then(function(res){
            var detail = (res && res.data && res.data.data) ? res.data.data : (res && res.data ? res.data : null);
            var lines = (detail && Array.isArray(detail.lines)) ? detail.lines : [];
            $scope.returnModel.lines = buildLines(lines);
            $rootScope.returnModel = $scope.returnModel;
            console.log('[Return] refreshed from detail, len:', $scope.returnModel.lines.length);
            if ((!lines || lines.length === 0) && detail) {
                console.warn('[Return] detail has no lines array or empty. detail keys:', Object.keys(detail));
            }
            if (detail && detail.invoice && detail.invoice.invoiceId) {
                $scope.returnModel.invoiceId = detail.invoice.invoiceId;
                $rootScope.returnModel = $scope.returnModel;
            }
            $scope.returnLoading = false;
            try { $scope.$applyAsync(); } catch(e) {}
        })
        .catch(function(){ /* keep prefilled if any */ })
        .finally(function(){ $scope.returnLoading = false; $scope.$applyAsync(); });
};

$scope.submitReturn = function(){
    // Validate lines
    var lines = ($scope.returnModel.lines || []).filter(function(x){ return Number(x.qtyReturned) > 0; });
    if (lines.length === 0) {
        $scope.addToast('warning', 'Chọn ít nhất 1 dòng có số lượng trả > 0');
        return;
    }
    for (var i=0;i<lines.length;i++){
        var it = lines[i];
        var q = Number(it.qtyReturned || 0);
        if (q <= 0 || q > Number(it.maxQty || 0)) {
            $scope.addToast('warning', 'Số lượng trả không hợp lệ ở dòng: ' + (it.bookTitle || it.orderLineId));
            return;
        }
    }
    var model = $rootScope.returnModel || $scope.returnModel;
    var payload = {
        invoiceId: model.invoiceId,
        reason: model.reason || 'Trả hàng',
        lines: lines.map(function(x){ return { orderLineId: x.orderLineId, qtyReturned: Number(x.qtyReturned) }; })
    };
    BookstoreService.createReturn(payload)
        .then(function(res){
            $scope.addToast('success', 'Tạo phiếu trả thành công');
            try { $route.reload(); } catch(e) { $scope.loadOrders(); }
            // close modal
            var el = document.getElementById('returnModal');
            try {
                var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
                if (modal) modal.hide();
            } catch (e) {}
        })
        .catch(function(){
            $scope.addToast('danger', 'Không thể tạo phiếu trả');
        });
};

	$scope.search = function(){
		$scope.currentPage = 1;
		$scope.loadOrders();
	};

	$scope.onPageChange = function(page){
		$scope.currentPage = page;
		$scope.loadOrders();
	};

	// Init
	$scope.loadOrders();
}]);



