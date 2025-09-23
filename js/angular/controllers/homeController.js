// Home Controller
app.controller('HomeController', ['$scope', '$http', 'DataService', 'BookstoreService', function($scope, $http, DataService, BookstoreService) {
    $scope.title = 'BookStore - Khám phá thế giới qua những trang sách';
    $scope.message = 'Hệ thống quản lý hiệu sách hiện đại';
    $scope.features = [];
    $scope.categories = [];
    $scope.stats = {};
    $scope.loading = true;
    $scope.bestSellers = [];
    $scope.newBooks = [];
    $scope.error = '';

    // Initialize controller
    $scope.init = function() {
        $scope.loadFeatures();
        $scope.loadCategories();
        $scope.loadStats();
        $scope.loadBestSellers();
        $scope.loadNewBooks();
    };

    // Load features data
    $scope.loadFeatures = function() {
        // Default features for bookstore
        $scope.features = [
            {
                id: 1,
                title: 'Kho sách đa dạng',
                description: 'Hàng nghìn đầu sách từ văn học kinh điển đến sách khoa học công nghệ mới nhất',
                icon: 'bi-book'
            },
            {
                id: 2,
                title: 'Tìm kiếm thông minh',
                description: 'Hệ thống tìm kiếm nâng cao giúp bạn dễ dàng tìm được cuốn sách yêu thích',
                icon: 'bi-search'
            },
            {
                id: 3,
                title: 'Giao hàng nhanh chóng',
                description: 'Dịch vụ giao hàng tận nơi nhanh chóng và an toàn trên toàn quốc',
                icon: 'bi-truck'
            },
            {
                id: 4,
                title: 'Giá cả hợp lý',
                description: 'Giá sách cạnh tranh với nhiều chương trình khuyến mãi hấp dẫn',
                icon: 'bi-tag'
            },
            {
                id: 5,
                title: 'Đánh giá uy tín',
                description: 'Hệ thống đánh giá và review sách từ cộng đồng người đọc',
                icon: 'bi-star'
            },
            {
                id: 6,
                title: 'Hỗ trợ 24/7',
                description: 'Đội ngũ chăm sóc khách hàng chuyên nghiệp, hỗ trợ 24/7',
                icon: 'bi-headset'
            }
        ];
        $scope.loading = false;
    };

    // Load bestsellers (last 30 days, top 10)
    $scope.loadBestSellers = function() {
        BookstoreService.getBestSellers(30, 10)
            .then(function(res) {
                $scope.bestSellers = (res.data && res.data.data) ? res.data.data : [];
                // Initialize tooltips after data is loaded
                setTimeout(function() {
                    if (typeof initializeTooltips === 'function') {
                        initializeTooltips();
                    }
                }, 100);
            })
            .catch(function() {
                $scope.bestSellers = [];
                $scope.error = 'Không tải được danh sách bán chạy';
            });
    };

    // Load new books (last 30 days, top 10)
    $scope.loadNewBooks = function() {
        BookstoreService.getNewBooks(30, 10)
            .then(function(res) {
                $scope.newBooks = (res.data && res.data.data) ? res.data.data : [];
                // Initialize tooltips after data is loaded
                setTimeout(function() {
                    if (typeof initializeTooltips === 'function') {
                        initializeTooltips();
                    }
                }, 100);
            })
            .catch(function() {
                $scope.newBooks = [];
                $scope.error = 'Không tải được sách mới';
            })
            .finally(function() { $scope.loading = false; });
    };

    // Load categories data
    $scope.loadCategories = function() {
        $scope.categories = [
            {
                id: 1,
                name: 'Văn học',
                icon: 'bi-book-half',
                bookCount: 450
            },
            {
                id: 2,
                name: 'Khoa học',
                icon: 'bi-cpu',
                bookCount: 320
            },
            {
                id: 3,
                name: 'Kinh tế',
                icon: 'bi-graph-up',
                bookCount: 280
            },
            {
                id: 4,
                name: 'Lịch sử',
                icon: 'bi-clock-history',
                bookCount: 200
            },
            {
                id: 5,
                name: 'Nghệ thuật',
                icon: 'bi-palette',
                bookCount: 150
            },
            {
                id: 6,
                name: 'Thiếu nhi',
                icon: 'bi-heart',
                bookCount: 300
            }
        ];
    };

    // Load stats data
    $scope.loadStats = function() {
        $scope.stats = {
            totalBooks: '3,500+',
            totalUsers: '1,250+',
            totalOrders: '500+',
            growthRate: 15.5
        };
    };

    // Initialize when controller loads
    $scope.init();
}]);
