// Customer Order Controllers

// Admin Orders Controller
app.controller('AdminOrdersController', ['$scope', '$rootScope', 'BookstoreService', 'AuthService', '$location', '$route', '$timeout', '$sce', '$compile', function($scope, $rootScope, BookstoreService, AuthService, $location, $route, $timeout, $sce, $compile) {
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
    $rootScope.selectedInvoice = null;
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
                if (cur && (cur.orderId || cur.id) && $scope.getOrderStatus(cur) === 'PendingConfirmation') {
                    // Only fetch suggestions for unassigned orders
                    console.log('Modal shown, loading candidates for:', cur.orderId || cur.id);
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
		paymentStatus: '',
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
		// Build params object, only include non-empty values
		var params = {
			pageNumber: $scope.currentPage,
			pageSize: $scope.pageSize
		};
		if ($scope.filters.keyword && $scope.filters.keyword.trim()) {
			params.keyword = $scope.filters.keyword.trim();
		}
		if ($scope.filters.customerId && $scope.filters.customerId.trim()) {
			params.customerId = $scope.filters.customerId.trim();
		}
		if ($scope.filters.status && $scope.filters.status.trim()) {
			params.status = $scope.filters.status.trim();
		}
		if ($scope.filters.paymentStatus && $scope.filters.paymentStatus.trim()) {
			params.paymentStatus = $scope.filters.paymentStatus.trim();
		}
		if ($scope.filters.fromDate && $scope.filters.fromDate.trim()) {
			params.fromDate = $scope.filters.fromDate.trim();
		}
		if ($scope.filters.toDate && $scope.filters.toDate.trim()) {
			params.toDate = $scope.filters.toDate.trim();
		}
		BookstoreService.getOrders(params).then(function(response){
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
    
    // Clean up any existing modals before opening new one
    document.querySelectorAll('.modal-backdrop').forEach(function (b) {
        try { b.parentNode.removeChild(b); } catch(e){}
    });
    
    // Move modal to body if needed
    var modalEl = document.getElementById('orderDetailModal');
    if (modalEl && modalEl.parentNode !== document.body) {
        document.body.appendChild(modalEl);
    }
    // Load candidates immediately on open
    var curId = ($scope.selectedOrder.orderId || $scope.selectedOrder.id);
    if (curId && $scope.getOrderStatus($scope.selectedOrder) === 'PendingConfirmation') {
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
    if (order && (order.orderId || order.id) && $scope.getOrderStatus(order) === 'PendingConfirmation') {
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
        // New mapping: 0/1/2/3
        switch(id){
            case 0: return 'PendingConfirmation';
            case 1: return 'Confirmed';
            case 2: return 'Delivered';
            case 3: return 'Cancelled';
            default: return '';
        }
    }
    return '';
};

$scope.canAssign = function(order){
    var s = $scope.getOrderStatus(order);
    return s === 'PendingConfirmation' || s === 'Confirmed';
};

// Helper function to get order status text
$scope.getOrderStatusText = function(status) {
    if (status === 'PendingConfirmation' || status === 0) return 'Chờ xác nhận';
    if (status === 'Confirmed' || status === 1) return 'Đã xác nhận';
    if (status === 'Delivered' || status === 2) return 'Đã giao';
    if (status === 'Cancelled' || status === 3) return 'Đã hủy';
    return status || 'Không xác định';
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

    // Modal confirmation state
    $scope.confirmModal = {
        show: false,
        title: '',
        message: '',
        type: 'info', // info, warning, danger
        onConfirm: null,
        order: null,
        cancelReason: '',
        cancelNote: ''
    };

    // Show confirmation modal
    $scope.showConfirmModal = function(title, message, type, onConfirm, order) {
        $scope.confirmModal = {
            show: true,
            title: title,
            message: $sce.trustAsHtml(message), // Trust HTML for rendering
            type: type || 'info',
            onConfirm: onConfirm,
            order: order,
            cancelReason: '',
            cancelNote: ''
        };
        var modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();
    };

    // Hide confirmation modal
    $scope.hideConfirmModal = function() {
        $scope.confirmModal.show = false;
        var modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        if (modal) {
            modal.hide();
        }
    };

    // Confirm action
    $scope.confirmAction = function() {
        if ($scope.confirmModal.onConfirm) {
            $scope.confirmModal.onConfirm($scope.confirmModal.order, $scope.confirmModal);
        }
        $scope.hideConfirmModal();
    };

$scope.cancelOrder = function(order){
    var orderStatus = $scope.getOrderStatus(order);
    if (orderStatus !== 'PendingConfirmation') {
        $scope.showConfirmModal(
            'Không thể hủy đơn',
            'Chỉ có thể hủy đơn hàng ở trạng thái <strong>Chờ xác nhận</strong>.',
            'warning',
            null,
            null
        );
        return;
    }

    $scope.showConfirmModal(
        'Xác nhận hủy đơn hàng',
        'Bạn có chắc chắn muốn hủy đơn hàng <strong>OD-' + (order.orderId || order.id) + '</strong>?<br><small class="text-muted">Hành động này không thể hoàn tác.</small>',
        'danger',
        function(selectedOrder, modalData) {
            var id = selectedOrder.orderId || selectedOrder.id;
            var payload = { 
                reason: modalData.cancelReason || 'Hủy đơn hàng', 
                note: modalData.cancelNote || 'Admin/Employee hủy' 
            };
            BookstoreService.cancelOrder(id, payload)
                .then(function(){
                    $scope.addToast('success', 'Đã hủy đơn hàng');
                    $scope.loadOrders();
                })
                .catch(function(){
                    $scope.addToast('danger', 'Không thể hủy đơn hàng');
                });
        },
        order
    );
};

$scope.assignDelivery = function(order){
    console.log('Assign delivery clicked for order:', order);
    console.log('Order status:', $scope.getOrderStatus(order));
    
    // Open detail modal first
    $scope.viewOrder(order);
    
    // Load candidates after modal is shown
    setTimeout(function() {
        var id = order && (order.orderId || order.id);
        if (id) {
            console.log('Assigning delivery for order:', id);
            // Sử dụng refreshDeliveryCandidates để có loading state
            $scope.refreshDeliveryCandidates(id);
        }
    }, 100); // Delay 100ms để đảm bảo modal đã mở
};

// Load delivery candidates
$scope.loadDeliveryCandidates = function(orderId){
    console.log('Loading delivery candidates for order:', orderId);
    if (!BookstoreService.getOrderDeliveryCandidates) {
        console.error('getOrderDeliveryCandidates API not available');
        return;
    }
    $scope.deliveryCandidates = [];
    return BookstoreService.getOrderDeliveryCandidates(orderId)
        .then(function(res){
            console.log('Delivery candidates response:', res);
            var payload = (res && res.data) ? res.data : null;
            var list = (payload && Array.isArray(payload.data)) ? payload.data : [];
            console.log('Delivery candidates list:', list);
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
            console.log('Sorted delivery candidates:', $scope.deliveryCandidates);
            try { $scope.$applyAsync(); } catch (e) {}
        })
        .catch(function(error){
            console.error('Error loading delivery candidates:', error);
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
    
    // Phân công giao hàng và tự động chuyển sang trạng thái "Đã xác nhận" (1)
    BookstoreService.assignOrderDelivery(order.orderId || order.id, { 
        deliveryEmployeeId: Number(candidate.employeeId || candidate.id), 
        deliveryDate: dateInput,
        approved: true, // Tự động xác nhận đơn hàng
        note: 'Đã phân công giao hàng và xác nhận đơn'
    })
        .then(function(){
            $scope.addToast('success', 'Đã phân công giao hàng và xác nhận đơn');
            try { $route.reload(); } catch(e) { $scope.loadOrders(); }
            $scope.closeOrderDetail();
        })
        .catch(function(){
            $scope.addToast('danger', 'Không thể phân công giao hàng');
        });
};

	$scope.confirmDelivered = function(order){
		console.log('confirmDelivered called with order:', order);
		
		// Store order data in scope BEFORE showing modal
		$scope.confirmingOrder = angular.copy(order); // Use copy to avoid reference issues
        // Also store a stable orderId on rootScope so we never lose it between scopes/modals
        $rootScope.confirmDeliveredOrderId = order && (order.orderId || order.id) ? (order.orderId || order.id) : null;
		$scope.deliveryNote = '';
		$scope.submittingDelivery = false;
		
		// Force scope update
		if (!$scope.$$phase && !$scope.$root.$$phase) {
			$scope.$apply();
		}
		
		// Small delay to ensure scope is updated
		$timeout(function() {
			// Get or create modal instance with proper options
			var modalEl = document.getElementById('adminOrderConfirmDeliveredModal');
			if (!modalEl) {
				console.error('Modal element adminOrderConfirmDeliveredModal not found');
				return;
			}
			
			// Clean up any existing backdrops
			document.querySelectorAll('.modal-backdrop').forEach(function(b) {
				try { b.remove(); } catch(e) {}
			});
			
			// Move modal to body for proper z-index, but compile Angular bindings first
			var originalParent = modalEl.parentNode;
			if (modalEl.parentNode !== document.body) {
				// Compile Angular bindings before moving
				if ($compile) {
					$compile(modalEl)($scope);
				}
				document.body.appendChild(modalEl);
			}
			
			try {
				var modal = bootstrap.Modal.getOrCreateInstance(modalEl, {
					backdrop: true,
					keyboard: true,
					focus: true
				});
				modal.show();
			} catch (e) {
				console.error('Error showing admin order confirm delivered modal:', e);
				// Fallback: try direct show
				modalEl.classList.add('show');
				modalEl.style.display = 'block';
				modalEl.setAttribute('aria-hidden', 'false');
				modalEl.setAttribute('aria-modal', 'true');
				var backdrop = document.createElement('div');
				backdrop.className = 'modal-backdrop fade show';
				document.body.appendChild(backdrop);
				document.body.classList.add('modal-open');
			}
		}, 100);
	};

	$scope.submitConfirmDelivered = function(){
		console.log('=== submitConfirmDelivered CALLED ===');
		console.log('confirmingOrder:', $scope.confirmingOrder);
		console.log('deliveryNote:', $scope.deliveryNote);
		console.log('submittingDelivery:', $scope.submittingDelivery);
		
		// Try to get order from scope or fallback to stored order / rootScope id
		var order = $scope.confirmingOrder;
		if (!order && $rootScope && $rootScope.selectedOrder) {
			// Try to get from rootScope or other sources
			console.warn('confirmingOrder is null, using selectedOrder from rootScope...');
			order = $rootScope.selectedOrder;
			console.log('Using selectedOrder from rootScope:', order);
		}
		
		var orderId = null;
		if (order && (order.orderId || order.id)) {
			orderId = order.orderId || order.id;
		} else if ($rootScope && $rootScope.confirmDeliveredOrderId) {
			console.warn('Using confirmDeliveredOrderId from rootScope as fallback');
			orderId = $rootScope.confirmDeliveredOrderId;
		}
		
		if (!orderId) {
			console.error('No orderId found for confirming delivery. order =', order, ', rootScope.confirmDeliveredOrderId =', $rootScope && $rootScope.confirmDeliveredOrderId);
			alert('Không tìm thấy thông tin đơn hàng. Vui lòng thử lại.');
			$scope.addToast('warning', 'Không tìm thấy thông tin đơn hàng');
			return;
		}
		
		var note = ($scope.deliveryNote && $scope.deliveryNote.trim()) || 'Đã giao';
		$scope.submittingDelivery = true;
		
		console.log('Calling confirmOrderDelivered API with:', {
			orderId: orderId,
			payload: { success: true, note: note }
		});
		
		// Ensure scope is updated
		if (!$scope.$$phase && !$scope.$root.$$phase) {
			$scope.$apply();
		}
		
		BookstoreService.confirmOrderDelivered(orderId, { success: true, note: note })
			.then(function(response){
				console.log('API response:', response);
				$scope.addToast('success', 'Đã xác nhận giao thành công');
				
				// Hide modal properly
				var modalEl = document.getElementById('adminOrderConfirmDeliveredModal');
				if (modalEl) {
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
						console.error('Error hiding admin order confirm delivered modal:', e);
					}
				}
				
				$scope.confirmingOrder = null;
				$scope.deliveryNote = '';
				$scope.loadOrders();
			})
			.catch(function(error){
				console.error('Error confirming delivery:', error);
				var errorMsg = 'Không thể xác nhận giao hàng';
				if (error && error.data && error.data.message) {
					errorMsg = error.data.message;
				} else if (error && error.message) {
					errorMsg = error.message;
				}
				alert('Lỗi: ' + errorMsg);
				$scope.addToast('danger', errorMsg);
			})
			.finally(function(){
				$scope.submittingDelivery = false;
				if (!$scope.$$phase && !$scope.$root.$$phase) {
					$scope.$apply();
				}
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

	$scope.resetFilters = function(){
		$scope.filters = {
			keyword: '',
			customerId: '',
			status: '',
			paymentStatus: '',
			fromDate: '',
			toDate: ''
		};
		$scope.currentPage = 1;
		$scope.loadOrders();
	};

	// Invoice functions
	$scope.viewInvoice = function(order) {
		// Kiểm tra điều kiện: phải có invoice và đã thanh toán
		if (!order || !order.invoice || order.invoice.paymentStatus !== 'PAID') {
			$scope.addToast('warning', 'Chỉ có thể xem hóa đơn của đơn hàng đã thanh toán');
			return;
		}
		
		$scope.selectedOrder = order;
		$rootScope.selectedOrder = order;
		$rootScope.selectedInvoice = order.invoice;

		// Đảm bảo chạy sau khi scope cập nhật
		$scope.$evalAsync(function () {
			$timeout(function () {
				var el = document.getElementById('invoiceModal');
				if (!el) return;

				try {
					// 1) Gỡ mọi backdrop cũ (nếu có)
					document.querySelectorAll('.modal-backdrop').forEach(function (b) {
						try { b.parentNode.removeChild(b); } catch(e){}
					});

					// 2) Đưa modal về trực tiếp dưới <body> để tránh stacking context
					if (el.parentNode !== document.body) {
						document.body.appendChild(el);
					}

					// 3) LẤY/TAO instance chuẩn Bootstrap và show
					if (window.bootstrap && window.bootstrap.Modal) {
						var modal = bootstrap.Modal.getOrCreateInstance(el, {
							backdrop: true,   // để Bootstrap tự quản lý backdrop
							keyboard: true,
							focus: true
						});
						modal.show();
					} else if (window.$) {
						// Fallback jQuery nếu cần
						$(el).modal('show');
					}
				} catch (e) {
					console.error('Error opening invoice modal:', e);
					// Fallback rất cuối
					el.classList.add('show');
					el.style.display = 'block';
				}
			}, 0);
		});
	};

	$scope.printInvoice = function() {
		var printContent = document.getElementById('invoiceContent');
		var originalContent = document.body.innerHTML;
		
		// Create a new window for printing
		var printWindow = window.open('', '_blank');
		printWindow.document.write(`
			<html>
				<head>
					<title>Hóa đơn - ${$rootScope.selectedOrder ? 'OD-' + ($rootScope.selectedOrder.orderId || $rootScope.selectedOrder.id) : 'N/A'}</title>
					<style>
						body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; }
						.invoice-container { background: white; padding: 30px; line-height: 1.4; }
						.invoice-header { border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
						.company-name { font-size: 20px; font-weight: bold; color: #2c3e50; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
						.company-info p { margin: 5px 0; font-size: 12px; color: #555; }
						.invoice-title { font-size: 24px; font-weight: bold; color: #e74c3c; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
						.invoice-meta p { margin: 8px 0; font-size: 12px; color: #333; }
						.invoice-body h4 { font-size: 16px; font-weight: bold; color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
						.customer-info p, .payment-info p { margin: 8px 0; font-size: 12px; color: #555; }
						.invoice-table { margin: 20px 0; border-collapse: collapse; width: 100%; }
						.invoice-table th { background-color: #34495e; color: white; font-weight: bold; padding: 8px; font-size: 12px; border: 1px solid #2c3e50; }
						.invoice-table td { padding: 8px; border: 1px solid #bdc3c7; font-size: 12px; }
						.invoice-table tbody tr:nth-child(even) { background-color: #f8f9fa; }
						.invoice-summary { margin-top: 30px; }
						.invoice-summary table { border-collapse: collapse; width: 100%; }
						.invoice-summary td { padding: 6px 12px; border: 1px solid #bdc3c7; font-size: 12px; }
						.total-row { background-color: #3498db !important; color: white !important; font-size: 14px !important; }
						.total-row td { border-color: #2980b9 !important; }
						.invoice-footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #bdc3c7; }
						.invoice-footer p { margin: 10px 0; font-size: 12px; color: #555; }
						.badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; }
						.bg-danger { background-color: #dc3545 !important; color: white !important; }
						.bg-success { background-color: #198754 !important; color: white !important; }
						.bg-warning { background-color: #ffc107 !important; color: #000 !important; }
						.bg-info { background-color: #0dcaf0 !important; color: #000 !important; }
					</style>
				</head>
				<body>
					${printContent.innerHTML}
				</body>
			</html>
		`);
		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
		printWindow.close();
	};

	$scope.downloadInvoice = function() {
		// For now, just trigger print - in a real app, you'd generate PDF server-side
		$scope.printInvoice();
		$scope.addToast('info', 'Chức năng tải PDF sẽ được phát triển trong phiên bản tiếp theo');
	};

	// Close modal and cleanup
	$scope.closeInvoiceModal = function () {
		var el = document.getElementById('invoiceModal');
		if (!el) return;
		try {
			var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
			if (modal) { modal.hide(); return; }
		} catch(e){}
		// fallback
		el.style.display = 'none';
		el.classList.remove('show');
		document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
	};


	$scope.onPageChange = function(page){
		$scope.currentPage = page;
		$scope.loadOrders();
	};

	// Init
	$scope.loadOrders();
}]);



