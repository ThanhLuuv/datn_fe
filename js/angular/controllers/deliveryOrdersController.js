app.controller('DeliveryOrdersController', ['$scope', 'BookstoreService', 'AuthService', function($scope, BookstoreService, AuthService) {
    if (!AuthService.isDeliveryEmployee() && !AuthService.isAdmin()) {
        return; // routed guard also prevents access
    }
    $scope.loading = false;
    $scope.orders = [];
    $scope.confirming = {};
    $scope.toasts = [];
    function addToast(variant, message){ $scope.toasts.push({variant:variant,message:message}); setTimeout(function(){ $scope.$applyAsync(function(){ $scope.toasts.shift(); }); }, 4000); }

    $scope.load = function(){
        $scope.loading = true;
        BookstoreService.getMyAssignedOrders({ pageNumber: 1, pageSize: 50 })
            .then(function(res){
                var payload = res && res.data ? res.data : null;
                var list = [];
                if (payload && payload.data && Array.isArray(payload.data.orders)) list = payload.data.orders;
                else if (Array.isArray(payload.data)) list = payload.data;
                $scope.orders = list;
            })
            .catch(function(){ addToast('danger','Không tải được danh sách đơn được phân công'); })
            .finally(function(){ $scope.loading = false; });
    };

    $scope.confirmDelivered = function(order){
        if (!order || !order.orderId) return;
        $scope.confirming[order.orderId] = true;
        BookstoreService.confirmOrderDelivered(order.orderId, { note: '' })
            .then(function(){ addToast('success','Đã xác nhận giao đơn #' + order.orderId); $scope.load(); })
            .catch(function(err){ var msg=(err&&err.data&&err.data.message)||'Không thể xác nhận giao hàng'; addToast('danger',msg); })
            .finally(function(){ $scope.confirming[order.orderId] = false; });
    };

    $scope.load();
}]);



