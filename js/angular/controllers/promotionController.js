// Promotion Controllers

// Admin Promotions Controller
app.controller('AdminPromotionsController', ['$scope', '$rootScope', 'BookstoreService', 'AuthService', '$location', function($scope, $rootScope, BookstoreService, AuthService, $location) {
	// Check access
	if (!AuthService.isAdminOrTeacher()) {
		$location.path('/home');
		return;
	}

	$scope.title = 'Quản lý khuyến mãi';
	$scope.loading = false;
	$scope.error = null;
	$scope.success = null;
	$scope.currentPage = 1;
	$scope.pageSize = 10;
	$scope.totalPages = 0;
	$scope.promotions = [];
	$scope.stats = null;

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

	$scope.filters = {
		Name: '',
		Status: 'all',
		MinDiscountPct: '',
		MaxDiscountPct: '',
		StartDate: '',
		EndDate: ''
	};

    $scope.formData = {
		name: '',
		description: '',
		discountPct: 0,
		startDate: '',
		endDate: '',
		bookIsbns: []
	};
    // Single model for selected book ISBNs is formData.bookIsbns
	$scope.editingPromotion = null;
    $scope.showForm = false;
    $scope.isSubmitting = false;
    $scope.selectedPromotion = null;
    $rootScope.selectedPromotion = null;
    $scope.formErrors = {};

    // Helper: format Date/ISO/string to DateOnly (YYYY-MM-DD)
    function toDateOnlyString(input) {
        if (!input) return '';
        // If Date object
        if (Object.prototype.toString.call(input) === '[object Date]') {
            if (isNaN(input.getTime())) return '';
            var y = input.getFullYear();
            var m = (input.getMonth() + 1).toString().padStart(2, '0');
            var d = input.getDate().toString().padStart(2, '0');
            return y + '-' + m + '-' + d;
        }
        // If string like ISO or includes 'T'
        if (typeof input === 'string') {
            if (input.indexOf('T') !== -1) {
                return input.split('T')[0];
            }
            // Already YYYY-MM-DD or other; best effort extract first 10 chars
            if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
            return (input + '').slice(0, 10);
        }
        try {
            var dt = new Date(input);
            if (!isNaN(dt.getTime())) {
                var yy = dt.getFullYear();
                var mm = (dt.getMonth() + 1).toString().padStart(2, '0');
                var dd = dt.getDate().toString().padStart(2, '0');
                return yy + '-' + mm + '-' + dd;
            }
        } catch (e) {}
        return '';
    }

    function compareDateOnly(a, b){
        // return negative if a<b, 0 if equal, positive if a>b
        if (!a || !b) return 0;
        try {
            var ap = toDateOnlyString(a).split('-').map(Number);
            var bp = toDateOnlyString(b).split('-').map(Number);
            var ad = new Date(ap[0], ap[1]-1, ap[2]);
            var bd = new Date(bp[0], bp[1]-1, bp[2]);
            return ad.getTime() - bd.getTime();
        } catch(e) { return 0; }
    }

    function validateForm() {
        var errs = {};
        if (!$scope.formData.name || !$scope.formData.name.trim()) {
            errs.name = 'Vui lòng nhập tên khuyến mãi';
        }
        var pct = Number($scope.formData.discountPct);
        if (!isFinite(pct)) {
            errs.discountPct = 'Mức giảm phải là số';
        } else if (pct < 0 || pct > 100) {
            errs.discountPct = 'Mức giảm phải trong khoảng 0 - 100%';
        }
        var s = toDateOnlyString($scope.formData.startDate);
        var e = toDateOnlyString($scope.formData.endDate);
        if (!s) {
            errs.startDate = 'Vui lòng chọn ngày bắt đầu';
        }
        if (!e) {
            errs.endDate = 'Vui lòng chọn ngày kết thúc';
        }
        if (s && e && compareDateOnly(e, s) < 0) {
            errs.dateRange = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
        }
        if (!$scope.formData.bookIsbns || $scope.formData.bookIsbns.length === 0) {
            errs.bookIsbns = 'Vui lòng chọn ít nhất một sách áp dụng';
        }
        $scope.formErrors = errs;
        return Object.keys(errs).length === 0;
    }

    function getPromotionModal() {
        var el = document.getElementById('promotionModal');
        if (!el) return null;
        try {
            return bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
        } catch (e) {
            return null;
        }
    }

	$scope.loadPromotions = function() {
		$scope.loading = true;
		$scope.error = null;
		BookstoreService.getPromotions({
			Name: $scope.filters.Name,
			Status: $scope.filters.Status,
			MinDiscountPct: $scope.filters.MinDiscountPct,
			MaxDiscountPct: $scope.filters.MaxDiscountPct,
			StartDate: $scope.filters.StartDate,
			EndDate: $scope.filters.EndDate,
			Page: $scope.currentPage,
			PageSize: $scope.pageSize
		}).then(function(response){
			var payload = response && response.data ? response.data : null;
			var list = [];
			var totalPages = 0;
			if (payload) {
				if (payload.data && Array.isArray(payload.data.promotions)) {
					list = payload.data.promotions;
					totalPages = payload.data.totalPages || 0;
				} else if (Array.isArray(payload.data)) {
					list = payload.data;
					totalPages = payload.totalPages || 0;
				} else if (Array.isArray(payload)) {
					list = payload;
					totalPages = 0;
				}
			}
			$scope.promotions = list;
			$scope.totalPages = totalPages;
			$scope.loading = false;
		}).catch(function(err){
			$scope.loading = false;
			$scope.error = 'Không thể tải danh sách khuyến mãi';
			$scope.addToast('danger', $scope.error);
		});
	};

	$scope.loadStats = function() {
		BookstoreService.getPromotionStats()
			.then(function(response){
				$scope.stats = (response && response.data && response.data.data) ? response.data.data : (response && response.data ? response.data : null);
			})
			.catch(function(){
				$scope.stats = null;
			});
	};

	$scope.search = function(){
		$scope.currentPage = 1;
		$scope.loadPromotions();
	};

	$scope.onPageChange = function(page){
		$scope.currentPage = page;
		$scope.loadPromotions();
	};

    $scope.showAddForm = function(){
		$scope.editingPromotion = null;
        $scope.formData = { name: '', description: '', discountPct: 0, startDate: '', endDate: '', bookIsbns: [] };
        $scope.showForm = true;
        setTimeout(function(){
            var modal = getPromotionModal();
            if (modal) modal.show();
        }, 0);
        // preload book options for select
        $scope.bookPicker.searchTerm = '';
        $scope.bookPicker.currentPage = 1;
        $scope.loadBooksForPicker();
	};

    $scope.showEditForm = function(promo){
		$scope.editingPromotion = promo;
		$scope.formData = {
			name: promo.name || '',
			description: promo.description || '',
			discountPct: promo.discountPct || 0,
			startDate: (promo.startDate || '').split('T')[0] || '',
			endDate: (promo.endDate || '').split('T')[0] || '',
            bookIsbns: (promo.books || []).map(function(b){ return b.isbn || b.bookIsbn || b; })
		};
        $scope.showForm = true;
        setTimeout(function(){
            var modal = getPromotionModal();
            if (modal) modal.show();
        }, 0);
        // preload book options for select
        $scope.bookPicker.searchTerm = '';
        $scope.bookPicker.currentPage = 1;
        $scope.loadBooksForPicker();
	};

    $scope.closeForm = function(){
		$scope.showForm = false;
        var modal = getPromotionModal();
        if (modal) modal.hide();
	};

    // Manage book ISBNs for the promotion form
    $scope._isbnInputSingle = '';
    $scope.addIsbnToForm = function(){
        var val = ($scope._isbnInputSingle || '').trim();
        if (!val) return;
        if (!$scope.formData.bookIsbns) $scope.formData.bookIsbns = [];
        if ($scope.formData.bookIsbns.indexOf(val) === -1) {
            $scope.formData.bookIsbns.push(val);
        }
        $scope._isbnInputSingle = '';
    };
    $scope.removeIsbnFromForm = function(isbn){
        if (!$scope.formData.bookIsbns) return;
        $scope.formData.bookIsbns = $scope.formData.bookIsbns.filter(function(x){ return x !== isbn; });
    };

    // Book picker for adding books from system
    $scope.bookPicker = {
        loading: false,
        error: null,
        searchTerm: '',
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        books: [],
        selected: {}
    };

    function getBookPickerModal(){
        var el = document.getElementById('bookPickerModal');
        if (!el) return null;
        try {
            return bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
        } catch(e) { return null; }
    }

    $scope.openBookPicker = function(){
        $scope.bookPicker.searchTerm = '';
        $scope.bookPicker.currentPage = 1;
        $scope.bookPicker.selected = {};
        $scope.loadBooksForPicker();
        setTimeout(function(){
            var m = getBookPickerModal();
            if (m) m.show();
        }, 0);
    };

    $scope.loadBooksForPicker = function(){
        $scope.bookPicker.loading = true;
        $scope.bookPicker.error = null;
        BookstoreService.getBooks({
            pageNumber: $scope.bookPicker.currentPage,
            pageSize: $scope.bookPicker.pageSize,
            searchTerm: $scope.bookPicker.searchTerm
        }).then(function(res){
            var payload = res && res.data ? res.data : null;
            var list = [];
            var totalPages = 0;
            if (payload) {
                if (payload.data && Array.isArray(payload.data.books)) {
                    list = payload.data.books;
                    totalPages = payload.data.totalPages || 0;
                } else if (Array.isArray(payload.data)) {
                    list = payload.data;
                    totalPages = payload.totalPages || 0;
                } else if (Array.isArray(payload)) {
                    list = payload;
                    totalPages = 0;
                }
            }
            $scope.bookPicker.books = list;
            $scope.bookPicker.totalPages = totalPages;
        }).catch(function(){
            $scope.bookPicker.error = 'Không thể tải danh sách sách';
        }).finally(function(){
            $scope.bookPicker.loading = false;
        });
    };

    $scope.togglePickBook = function(isbn){
        if (!$scope.bookPicker.selected) $scope.bookPicker.selected = {};
        $scope.bookPicker.selected[isbn] = !$scope.bookPicker.selected[isbn];
    };

    $scope.confirmAddPickedBooks = function(){
        var picked = Object.keys($scope.bookPicker.selected || {}).filter(function(k){ return $scope.bookPicker.selected[k]; });
        if (!Array.isArray($scope.formData.bookIsbns)) $scope.formData.bookIsbns = [];
        picked.forEach(function(isbn){ if ($scope.formData.bookIsbns.indexOf(isbn) === -1) $scope.formData.bookIsbns.push(isbn); });
        var m = getBookPickerModal();
        if (m) m.hide();
    };

    $scope.onBookPickerPageChange = function(page){
        $scope.bookPicker.currentPage = page;
        $scope.loadBooksForPicker();
    };

    // View books within a promotion from list payload
    $scope.viewPromotionBooks = function(promo){
        $scope.selectedPromotion = promo;
        $rootScope.selectedPromotion = $scope.selectedPromotion;
        setTimeout(function(){
            var el = document.getElementById('promotionBooksModal');
            if (!el) return;
            try {
                var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
                if (modal) modal.show();
            } catch(e) {}
        }, 0);
    };

    $scope.submitForm = function(){
        if ($scope.isSubmitting) return;
        $scope.error = null;

        if (!validateForm()) {
            $scope.addToast('danger', Object.values($scope.formErrors)[0] || 'Form chưa hợp lệ');
            return;
        }

        $scope.isSubmitting = true;

        // Use formData.bookIsbns as the single source of truth
        var list = Array.isArray($scope.formData.bookIsbns) ? $scope.formData.bookIsbns.slice() : [];
        $scope.formData.bookIsbns = list;

        var payload = {
            name: $scope.formData.name,
            description: $scope.formData.description,
            discountPct: Number($scope.formData.discountPct) || 0,
            startDate: toDateOnlyString($scope.formData.startDate),
            endDate: toDateOnlyString($scope.formData.endDate),
            bookIsbns: $scope.formData.bookIsbns || []
        };
		var req = $scope.editingPromotion ? BookstoreService.updatePromotion($scope.editingPromotion.promotionId || $scope.editingPromotion.id, payload) : BookstoreService.createPromotion(payload);
		req.then(function(){
			$scope.isSubmitting = false;
			$scope.addToast('success', $scope.editingPromotion ? 'Cập nhật khuyến mãi thành công' : 'Tạo khuyến mãi thành công');
			$scope.closeForm();
			$scope.loadPromotions();
		}).catch(function(err){
			$scope.isSubmitting = false;
			$scope.error = (err && err.data && err.data.message) ? err.data.message : 'Lỗi khi lưu khuyến mãi';
			$scope.addToast('danger', $scope.error);
		});
	};

	$scope.deletePromotion = function(promo){
		if (!promo) return;
		if (!confirm('Xóa khuyến mãi này?')) return;
		var id = promo.promotionId || promo.id;
		BookstoreService.deletePromotion(id)
			.then(function(){
				$scope.addToast('success', 'Đã xóa khuyến mãi');
				$scope.loadPromotions();
			})
			.catch(function(){
				$scope.addToast('danger', 'Không thể xóa khuyến mãi');
			});
	};

	// Init
	$scope.loadPromotions();
	$scope.loadStats();
}]);



