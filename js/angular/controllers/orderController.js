// Customer Order Controllers

// Admin Orders Controller
app.controller('AdminOrdersController', ['$scope', '$rootScope', 'BookstoreService', 'AuthService', '$location', function($scope, $rootScope, BookstoreService, AuthService, $location) {
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
    if (order && (order.orderId || order.id)) {
        $scope.loadDeliveryCandidates(order.orderId || order.id);
    }
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
    var deliveryEmployeeId = prompt('Nhập ID nhân viên giao hàng');
    if (!deliveryEmployeeId) return;
    var deliveryDate = prompt('Nhập ngày giao hàng (YYYY-MM-DD)') || new Date().toISOString();
    BookstoreService.assignOrderDelivery(order.orderId || order.id, { deliveryEmployeeId: Number(deliveryEmployeeId), deliveryDate: deliveryDate })
			.then(function(){
				$scope.addToast('success', 'Đã phân công giao hàng');
				$scope.loadOrders();
			})
			.catch(function(){
				$scope.addToast('danger', 'Không thể phân công giao hàng');
			});
	};

// Load delivery candidates
$scope.loadDeliveryCandidates = function(orderId){
    if (!BookstoreService.getOrderDeliveryCandidates) return;
    $scope.deliveryCandidates = [];
    BookstoreService.getOrderDeliveryCandidates(orderId)
        .then(function(res){
            var payload = res && res.data ? res.data : null;
            var list = [];
            if (payload) {
                if (Array.isArray(payload.data)) list = payload.data;
                else if (Array.isArray(payload)) list = payload;
            }
            // sort by finalScore asc
            list.sort(function(a,b){
                var fa = (a.finalScore != null) ? Number(a.finalScore) : 999999;
                var fb = (b.finalScore != null) ? Number(b.finalScore) : 999999;
                return fa - fb;
            });
            $scope.deliveryCandidates = list;
            $scope.$applyAsync();
        })
        .catch(function(){
            $scope.deliveryCandidates = [];
        });
};

// Assign delivery from candidate row
$scope.assignDeliveryCandidate = function(order, candidate){
    var dateInput = $scope.deliveryDateInput || new Date().toISOString();
    BookstoreService.assignOrderDelivery(order.orderId || order.id, { deliveryEmployeeId: Number(candidate.employeeId || candidate.id), deliveryDate: dateInput })
        .then(function(){
            $scope.addToast('success', 'Đã phân công giao hàng');
            $scope.loadOrders();
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
    if (!confirm('Xác nhận trả hàng cho đơn này?')) return;
    var reason = prompt('Lý do trả hàng (tuỳ chọn)') || '';
    BookstoreService.returnOrder(order.orderId || order.id, { reason: reason })
        .then(function(){
            $scope.addToast('success', 'Đã tạo yêu cầu trả hàng/hoàn trả');
            $scope.loadOrders();
        })
        .catch(function(){
            $scope.addToast('danger', 'Không thể thực hiện trả hàng');
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



