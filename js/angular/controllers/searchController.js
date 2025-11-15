app.controller('SearchController', ['$scope', '$location', 'BookstoreService', 'CartService', 'AuthService', function($scope, $location, BookstoreService, CartService, AuthService) {
    $scope.results = [];
    $scope.filteredResults = [];
    $scope.total = 0;
    $scope.loaded = false;
    $scope.loading = false;
    $scope.Math = window.Math;

    // Clean and normalize search string
    $scope.cleanSearchString = function(str) {
        if (!str || typeof str !== 'string') return '';
        
        var cleaned = str
            .trim() // Remove leading/trailing whitespace
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .toLowerCase() // Convert to lowercase
            .normalize('NFD') // Decompose accented characters
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
            .replace(/[^\w\s]/g, '') // Remove special characters, keep only letters, numbers, spaces
            .trim(); // Trim again after cleaning
        
        console.log('String cleaning:', str, '→', cleaned);
        return cleaned;
    };

    // Clean and normalize category/publisher IDs
    $scope.cleanId = function(id) {
        if (!id || id === '' || id === 'null' || id === 'undefined') return '';
        return String(id).trim();
    };

    // Initialize with cleaned URL parameters
    $scope.query = $scope.cleanSearchString($location.search().q || '');
    $scope.page = parseInt($location.search().page || '1');
    $scope.pageSize = parseInt($location.search().pageSize || '12');
    $scope.categoryId = $scope.cleanId($location.search().categoryId || '');
    $scope.publisherId = $scope.cleanId($location.search().publisherId || '');

    $scope.getFinalPrice = function(book) {
        if (!book) return 0;
        
        // Use discountedPrice if available (from new API)
        if (book.discountedPrice != null) return Math.round(book.discountedPrice);
        
        // Use currentPrice as fallback
        if (book.currentPrice != null) return Math.round(book.currentPrice);
        
        // Legacy support for old API structure
        if (book.effectivePrice != null) return Math.round(book.effectivePrice);
        
        var base = book.unitPrice || book.averagePrice || 0;
        var percent = book.promoPercent || book.discountPercent || null;
        var amount = book.promoAmount || book.discountAmount || null;
        var priceByPercent = (percent && percent > 0) ? Math.round(base * (1 - percent / 100)) : null;
        var priceByAmount = (amount && amount > 0) ? Math.max(0, Math.round(base - amount)) : null;
        var candidates = [base];
        if (priceByPercent !== null) candidates.push(priceByPercent);
        if (priceByAmount !== null) candidates.push(priceByAmount);
        return Math.min.apply(null, candidates);
    };
    
    $scope.hasPromo = function(book) { 
        if (!book) return false;
        var finalPrice = $scope.getFinalPrice(book);
        var originalPrice = book.currentPrice || book.unitPrice || book.averagePrice || 0;
        return finalPrice < originalPrice || book.hasPromotion === true;
    };
    
    // Calculate discount percentage
    $scope.calculateDiscountPercent = function(book) {
        if (!book) return 0;
        var finalPrice = $scope.getFinalPrice(book);
        var originalPrice = book.currentPrice || book.unitPrice || book.averagePrice || 0;
        if (originalPrice > 0 && finalPrice < originalPrice) {
            return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
        }
        return 0;
    };

    // Filter results to only show books with status: true and stock > 1
    $scope.filterActiveBooks = function() {
        $scope.filteredResults = ($scope.results || []).filter(function(book) {
            return book.status === true && (book.stock || 0) > 1;
        });
    };

    $scope.addToCart = function(book) {
        if (!AuthService.isAuthenticated()) {
            $location.path('/login');
            if (window.showNotification) {
                window.showNotification('Vui lòng đăng nhập để thêm sách vào giỏ hàng', 'warning');
            }
            return;
        }

        if (!book || !book.isbn) {
            if (window.showNotification) {
                window.showNotification('Thông tin sách không hợp lệ', 'danger');
            }
            return;
        }

        CartService.addToCart(book.isbn, 1)
            .then(function(response) {
                if (response && response.data && response.data.success) {
                    if (window.showNotification) {
                        window.showNotification('Đã thêm "' + book.title + '" vào giỏ hàng', 'success');
                    }
                    // Update cart count
                    $scope.$emit('cart:changed');
                } else {
                    if (window.showNotification) {
                        window.showNotification('Không thể thêm vào giỏ hàng', 'warning');
                    }
                }
            })
            .catch(function(error) {
                console.error('Add to cart error:', error);
                if (window.showNotification) {
                    window.showNotification('Không thể thêm vào giỏ hàng', 'danger');
                }
            });
    };

    // Check authentication status
    $scope.isAuthenticated = function() {
        return AuthService.isAuthenticated();
    };

    $scope.doSearch = function() {
        $scope.loading = true;
        
        // Clean input data before sending
        var cleanQuery = $scope.cleanSearchString($scope.query);
        var cleanCategoryId = $scope.cleanId($scope.categoryId);
        var cleanPublisherId = $scope.cleanId($scope.publisherId);
        
        console.log('Search params:', {
            original: {
                query: $scope.query,
                categoryId: $scope.categoryId,
                publisherId: $scope.publisherId
            },
            cleaned: {
                query: cleanQuery,
                categoryId: cleanCategoryId,
                publisherId: cleanPublisherId
            }
        });
        
        // Use single API for all search scenarios
        BookstoreService.getBooks({
            pageNumber: $scope.page,
            pageSize: $scope.pageSize,
            searchTerm: cleanQuery,
            categoryId: cleanCategoryId,
            publisherId: cleanPublisherId
        })
        .then(function(res){
            var resp = res.data || {};
            if (resp.success && resp.data && Array.isArray(resp.data.books)) {
                $scope.results = resp.data.books;
                $scope.total = resp.data.totalCount || 0;
            } else if (Array.isArray(resp.data)) {
                $scope.results = resp.data;
                $scope.total = resp.totalCount || 0;
            } else {
                $scope.results = [];
                $scope.total = 0;
            }
            $scope.loaded = true;
            $scope.loading = false;
            $scope.filterActiveBooks();
            setTimeout(function() { if (typeof initializeTooltips === 'function') initializeTooltips(); }, 100);
        })
        .catch(function(){
            $scope.results = [];
            $scope.total = 0;
            $scope.loaded = true;
            $scope.loading = false;
            $scope.filterActiveBooks();
        });
    };

    $scope.goPage = function(p) {
        if (p < 1) return;
        $scope.page = p;
        $location.search({ 
            q: $scope.query, 
            page: $scope.page, 
            pageSize: $scope.pageSize,
            categoryId: $scope.categoryId,
            publisherId: $scope.publisherId
        });
        $scope.doSearch();
    };

    // Filter by category
    $scope.filterByCategory = function(categoryId) {
        $scope.categoryId = $scope.cleanId(categoryId);
        $scope.page = 1; // Reset to first page
        $location.search({ 
            q: $scope.query, 
            page: $scope.page, 
            pageSize: $scope.pageSize,
            categoryId: $scope.categoryId,
            publisherId: $scope.publisherId
        });
        $scope.doSearch();
    };

    // Filter by publisher
    $scope.filterByPublisher = function(publisherId) {
        $scope.publisherId = $scope.cleanId(publisherId);
        $scope.page = 1; // Reset to first page
        $location.search({ 
            q: $scope.query, 
            page: $scope.page, 
            pageSize: $scope.pageSize,
            categoryId: $scope.categoryId,
            publisherId: $scope.publisherId
        });
        $scope.doSearch();
    };

    // Clear all filters
    $scope.clearFilters = function() {
        $scope.query = '';
        $scope.categoryId = '';
        $scope.publisherId = '';
        $scope.page = 1;
        $location.search({ 
            q: '', 
            page: 1, 
            pageSize: $scope.pageSize,
            categoryId: '',
            publisherId: ''
        });
        $scope.doSearch();
    };

    // Search function with input cleaning
    $scope.search = function() {
        $scope.query = $scope.cleanSearchString($scope.query);
        $scope.page = 1; // Reset to first page
        $location.search({ 
            q: $scope.query, 
            page: $scope.page, 
            pageSize: $scope.pageSize,
            categoryId: $scope.categoryId,
            publisherId: $scope.publisherId
        });
        $scope.doSearch();
    };

    // Handle input change with debouncing
    $scope.onSearchInputChange = function() {
        // Clean the input in real-time
        $scope.query = $scope.cleanSearchString($scope.query);
    };

    // Handle Enter key press
    $scope.onSearchKeyPress = function(event) {
        if (event.keyCode === 13) { // Enter key
            $scope.search();
        }
    };

    // initial load
    $scope.doSearch();
}]);

