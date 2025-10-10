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



