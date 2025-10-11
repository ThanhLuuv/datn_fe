// Admin Controller
app.controller('AdminController', ['$scope', 'AuthService', 'APP_CONFIG', '$location', 'BookstoreService', function($scope, AuthService, APP_CONFIG, $location, BookstoreService) {
    // Check if user has admin or teacher access
    if (!AuthService.isAdminOrTeacher()) {
        console.log('Access denied: User does not have admin or teacher role');
        $location.path('/home');
        return;
    }

    $scope.title = 'Admin Dashboard';
    $scope.stats = {
        totalUsers: 0,
        totalBooks: 0,
        todayOrders: 0,
        monthlyRevenue: 0,
        growthRate: 0,
        newUsers: 0,
        soldBooks: 0
    };
    
    $scope.recentActivities = [];
    $scope.latestBooks = [];
    $scope.toasts = [];
    $scope.addToast = function(variant, message) {
        var id = Date.now() + Math.random();
        $scope.toasts.push({ id: id, variant: variant, message: message });
        setTimeout(function(){
            $scope.$applyAsync(function(){
                $scope.toasts = $scope.toasts.filter(function(t){ return t.id !== id; });
            });
        }, 3000);
    };

    function formatYMD(date) {
        var y = date.getFullYear();
        var m = ('0' + (date.getMonth() + 1)).slice(-2);
        var d = ('0' + date.getDate()).slice(-2);
        return y + '-' + m + '-' + d;
    }

    function sumRevenueFromReportPayload(payload) {
        var items = payload && Array.isArray(payload.items) ? payload.items : [];
        var sum = 0;
        for (var i = 0; i < items.length; i++) {
            var val = Number(items[i].revenue || items[i].totalRevenue || 0);
            if (!isNaN(val)) sum += val;
        }
        return sum;
    }

    // Initialize controller
    $scope.init = function() {
        $scope.loadStats();
        $scope.loadLatestBooks();
    };

    // Load statistics
    $scope.loadStats = function() {
        BookstoreService.getAdminDashboardSummary()
            .then(function(res){
                var data = res && res.data && res.data.data;
                if (data) {
                    var src = (data && data.summary) ? data.summary : data;
                    var totalUsers = src.totalUsers != null ? src.totalUsers : (src.users != null ? src.users : 0);
                    var totalBooks = src.totalBooks != null ? src.totalBooks : (src.totalBook != null ? src.totalBook : (src.booksCount != null ? src.booksCount : (src.books != null ? src.books : 0)));
                    var todayOrders = src.todayOrders != null ? src.todayOrders : (src.ordersToday != null ? src.ordersToday : 0);
                    var monthlyRevenue = src.monthlyRevenue != null ? src.monthlyRevenue : (src.revenueThisMonth != null ? src.revenueThisMonth : (src.totalRevenueThisMonth != null ? src.totalRevenueThisMonth : (src.monthRevenue != null ? src.monthRevenue : 0)));
                    var growthRate = src.growthRate != null ? src.growthRate : (src.growth != null ? src.growth : 0);
                    var newUsers = src.newUsers != null ? src.newUsers : (src.newUsersThisMonth != null ? src.newUsersThisMonth : 0);
                    var soldBooks = src.soldBooks != null ? src.soldBooks : (src.soldBooksThisMonth != null ? src.soldBooksThisMonth : 0);
                    $scope.stats = {
                        totalUsers: Number(totalUsers) || 0,
                        totalBooks: Number(totalBooks) || 0,
                        todayOrders: Number(todayOrders) || 0,
                        monthlyRevenue: Number(monthlyRevenue) || 0,
                        growthRate: Number(growthRate) || 0,
                        newUsers: Number(newUsers) || 0,
                        soldBooks: Number(soldBooks) || 0
                    };
                    $scope.addToast('success', 'Đã tải thống kê tổng quan.');
                }
            })
            .catch(function(err){
                console.error('Summary error:', err);
                $scope.addToast('danger', (err && err.data && err.data.message) || 'Không thể tải thống kê.');
            })
            .finally(function(){
                // Always compute monthly revenue from report API to ensure accuracy
                try {
                    var now = new Date();
                    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    var prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    var prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

                    // Current month revenue
                    BookstoreService.getRevenueReport({ fromDate: formatYMD(monthStart), toDate: formatYMD(now) })
                        .then(function(r){
                            var payload = r && r.data && r.data.data;
                            var currentSum = sumRevenueFromReportPayload(payload);
                            $scope.stats.monthlyRevenue = currentSum;
                            return BookstoreService.getRevenueReport({ fromDate: formatYMD(prevMonthStart), toDate: formatYMD(prevMonthEnd) });
                        })
                        .then(function(prevRes){
                            var prevPayload = prevRes && prevRes.data && prevRes.data.data;
                            var prevSum = sumRevenueFromReportPayload(prevPayload);
                            var cur = Number($scope.stats.monthlyRevenue) || 0;
                            var growth = 0;
                            if (prevSum > 0) {
                                growth = ((cur - prevSum) / prevSum) * 100;
                            } else if (cur > 0) {
                                growth = 100; // from zero to positive => 100%+
                            } else {
                                growth = 0;
                            }
                            // Round to one decimal place
                            $scope.stats.growthRate = Math.round(growth * 10) / 10;
                            return BookstoreService.getAdminTotalUsers();
                        })
                        .then(function(usersRes){
                            var udata = usersRes && usersRes.data && usersRes.data.data;
                            if (udata && udata.totalUsers != null) {
                                $scope.stats.totalUsers = Number(udata.totalUsers) || $scope.stats.totalUsers;
                            }
                            return BookstoreService.getAdminOrdersToday();
                        })
                        .then(function(ordersRes){
                            var odata = ordersRes && ordersRes.data && ordersRes.data.data;
                            if (odata && (odata.totalOrdersToday != null)) {
                                $scope.stats.todayOrders = Number(odata.totalOrdersToday) || $scope.stats.todayOrders;
                            }
                        })
                        .catch(function(e){
                            console.warn('Monthly revenue via report failed', e);
                        });
                } catch(e) { console.warn(e); }
            });
    };

    // (Removed recent activities per request)

    // Load newest books via dedicated API
    $scope.loadLatestBooks = function() {
        BookstoreService.getLatestBooks(10)
            .then(function(response){
                var list = [];
                if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.books)) {
                    list = response.data.data.books;
                } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    list = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    list = response.data;
                }
                $scope.latestBooks = list || [];
            })
            .catch(function(error){
                console.error('Newest books error:', error);
                $scope.addToast('danger', 'Không thể tải sách mới nhất.');
            });
    };

    // Test API endpoints
    $scope.testPublicAPI = function() {
        AuthService.testPublic()
            .then(function(response) {
                console.log('Public API test:', response.data);
                showNotification('Public API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Public API test failed:', error);
                showNotification('Public API không hoạt động!', 'danger');
            });
    };

    $scope.testProtectedAPI = function() {
        AuthService.testProtected()
            .then(function(response) {
                console.log('Protected API test:', response.data);
                showNotification('Protected API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Protected API test failed:', error);
                showNotification('Protected API không hoạt động!', 'danger');
            });
    };

    $scope.testAdminAPI = function() {
        AuthService.testAdminOnly()
            .then(function(response) {
                console.log('Admin API test:', response.data);
                showNotification('Admin API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Admin API test failed:', error);
                showNotification('Admin API không hoạt động!', 'danger');
            });
    };

    $scope.testStaffAPI = function() {
        AuthService.testStaffOnly()
            .then(function(response) {
                console.log('Staff API test:', response.data);
                showNotification('Staff API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Staff API test failed:', error);
                showNotification('Staff API không hoạt động!', 'danger');
            });
    };

    // Initialize when controller loads
    $scope.init();
}]);

