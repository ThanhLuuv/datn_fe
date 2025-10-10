app.controller('AdminPromotionsController', [
    '$scope', '$rootScope', 'BookstoreService', 'AuthService', '$location', '$timeout',
    function($scope, $rootScope, BookstoreService, AuthService, $location, $timeout) {
  
      if (!AuthService.isAdminOrTeacher()) {
        $location.path('/home');
        return;
      }
  
      $scope.title = 'Quản lý khuyến mãi';
      $scope.loading = false;
      $scope.error = null;
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
  
      // IMPORTANT: for <input type="date">, keep model as Date objects
      $scope.formData = {
        name: '',
        description: '',
        discountPct: 0,
        startDate: null,   // Date
        endDate: null,     // Date
        bookIsbns: []
      };
  
      $scope.editingPromotion = null;         // also used to preview selected books in Add mode
      $scope.isSubmitting = false;
      $rootScope.selectedPromotion = null;
      $scope.formErrors = {};
      $scope._originalPromotion = null;
  
      // ---- Utils ----
      function toDateOnlyString(input) {
        if (!input) return '';
        var d = (Object.prototype.toString.call(input) === '[object Date]') ? input : new Date(input);
        if (isNaN(d.getTime())) return '';
        var y = d.getFullYear();
        var m = (d.getMonth() + 1).toString().padStart(2, '0');
        var dd = d.getDate().toString().padStart(2, '0');
        return y + '-' + m + '-' + dd;
      }
      function toDateObject(input) {
        if (!input) return null;
        if (Object.prototype.toString.call(input) === '[object Date]') return input;
        // normalize "YYYY-MM-DD" or ISO "YYYY-MM-DDTHH:mm:ss"
        var s = (typeof input === 'string' && input.indexOf('T') !== -1) ? input.split('T')[0] : ('' + input).slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          var p = s.split('-').map(Number);
          return new Date(p[0], p[1]-1, p[2]);
        }
        var d = new Date(input);
        return isNaN(d.getTime()) ? null : d;
      }
      function compareDateOnly(a, b) {
        if (!a || !b) return 0;
        var ad = toDateObject(a), bd = toDateObject(b);
        if (!ad || !bd) return 0;
        return ad.setHours(0,0,0,0) - bd.setHours(0,0,0,0);
      }
      function validateForm() {
        var errs = {};
        if (!$scope.formData.name || !$scope.formData.name.trim()) errs.name = 'Vui lòng nhập tên khuyến mãi';
        var pct = Number($scope.formData.discountPct);
        if (!isFinite(pct)) errs.discountPct = 'Mức giảm phải là số';
        else if (pct < 0 || pct > 100) errs.discountPct = 'Mức giảm phải trong khoảng 0 - 100%';
        var s = toDateOnlyString($scope.formData.startDate);
        var e = toDateOnlyString($scope.formData.endDate);
        if (!s) errs.startDate = 'Vui lòng chọn ngày bắt đầu';
        if (!e) errs.endDate = 'Vui lòng chọn ngày kết thúc';
        if (s && e && compareDateOnly(e, s) < 0) errs.dateRange = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
        if (!$scope.formData.bookIsbns || $scope.formData.bookIsbns.length === 0) errs.bookIsbns = 'Vui lòng chọn ít nhất một sách áp dụng';
        $scope.formErrors = errs;
        return Object.keys(errs).length === 0;
      }
      function getPromotionModal() {
        var el = document.getElementById('promotionModal');
        try { return bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null; } catch(e){ return null; }
      }
      function getBookPickerModal() {
        var el = document.getElementById('bookPickerModal');
        try { return bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null; } catch(e){ return null; }
      }
      function hydratePromotionBooks(promo) {
        promo = promo || {};
        promo.books = Array.isArray(promo.books) ? promo.books : [];
        var pct = Number(promo.discountPct) || 0;
        promo.books = promo.books.map(function(b){
          var price = Number(b.unitPrice) || 0;
          return Object.assign({}, b, {
            discountedPrice: (b.discountedPrice != null && !isNaN(Number(b.discountedPrice)))
              ? Number(b.discountedPrice)
              : Math.round(price * (100 - pct)) / 100
          });
        });
        return promo;
      }
  
      // ---- Data loaders ----
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
        }).then(function(res){
          var payload = res && res.data ? res.data : null;
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
            }
          }
          $scope.promotions = list.map(hydratePromotionBooks);
          $scope.totalPages = totalPages;
        }).catch(function(err){
          $scope.error = 'Không thể tải danh sách khuyến mãi';
          $scope.addToast('danger', $scope.error);
          console.error(err);
        }).finally(function(){
          $scope.loading = false;
        });
      };
  
      $scope.loadStats = function() {
        BookstoreService.getPromotionStats()
          .then(function(res){
            $scope.stats = (res && res.data && res.data.data) ? res.data.data : (res && res.data ? res.data : null);
          })
          .catch(function(){ $scope.stats = null; });
      };
  
      $scope.search = function(){
        $scope.currentPage = 1;
        $scope.loadPromotions();
      };
      $scope.onPageChange = function(page){
        $scope.currentPage = page;
        $scope.loadPromotions();
      };
  
      // ---- Form actions ----
      $scope.showAddForm = function(){
        $scope.formErrors = {};
        $scope.formData = { name:'', description:'', discountPct:0, startDate:null, endDate:null, bookIsbns:[] };
        $scope.editingPromotion = { books: [] }; // allow preview table in Add mode
        $timeout(function(){ var m=getPromotionModal(); if (m) m.show(); }, 0);
        $scope.bookPicker.searchTerm = '';
        $scope.bookPicker.currentPage = 1;
        $scope.loadBooksForPicker();
      };
  
      $scope.showEditForm = function(promo){
        if (!promo) return;
        var hydrated = hydratePromotionBooks(promo);
  
        var bookIsbns = Array.isArray(hydrated.books)
          ? hydrated.books.map(function(b){ return b.isbn || b.bookIsbn || b; })
          : [];
  
        $scope.formErrors = {};
        $scope.formData = {
          name: hydrated.name || '',
          description: hydrated.description || '',
          discountPct: hydrated.discountPct || 0,
          startDate: toDateObject(hydrated.startDate), // Date object (fix ngModel:datefmt)
          endDate: toDateObject(hydrated.endDate),     // Date object (fix ngModel:datefmt)
          bookIsbns: bookIsbns
        };
  
        $scope.editingPromotion = JSON.parse(JSON.stringify(hydrated));
        $scope._originalPromotion = JSON.parse(JSON.stringify(hydrated));
  
        $timeout(function(){ var m=getPromotionModal(); if (m) m.show(); }, 0);
  
        $scope.bookPicker.searchTerm = '';
        $scope.bookPicker.currentPage = 1;
        $scope.loadBooksForPicker();
      };
  
      $scope.closeForm = function(){
        var m = getPromotionModal();
        if (m) m.hide();
      };
  
      // ---- Book picker ----
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
  
      $scope.openBookPicker = function(){
        $scope.bookPicker.searchTerm = '';
        $scope.bookPicker.currentPage = 1;
        $scope.bookPicker.selected = {};
        $scope.loadBooksForPicker();
        $timeout(function(){ var m=getBookPickerModal(); if (m) m.show(); }, 0);
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
            }
          }
          $scope.bookPicker.books = list;
          $scope.bookPicker.totalPages = totalPages;
  
          // reflect already chosen ISBNs
          var chosen = new Set($scope.formData.bookIsbns || []);
          $scope.bookPicker.selected = $scope.bookPicker.selected || {};
          list.forEach(function(b){
            if (b && b.isbn) $scope.bookPicker.selected[b.isbn] = chosen.has(b.isbn);
          });
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
  
      // Try to resolve full book details for preview
      function syncPreviewBooksFromIsbns() {
        var isbns = ($scope.formData.bookIsbns || []).slice();
        if (!$scope.editingPromotion) $scope.editingPromotion = { books: [] };
  
        // If API exists, use it
        if (BookstoreService.getBooksByIsbns && typeof BookstoreService.getBooksByIsbns === 'function') {
          BookstoreService.getBooksByIsbns({ isbns: isbns }).then(function(res){
            var items = (res && res.data && res.data.data) ? res.data.data : (res && res.data ? res.data : []);
            var promoLike = {
              discountPct: $scope.formData.discountPct,
              books: (Array.isArray(items) ? items : []).map(function(b){
                return {
                  isbn: b.isbn,
                  title: b.title,
                  unitPrice: b.unitPrice,
                  discountedPrice: b.discountedPrice,
                  categoryName: b.categoryName,
                  publisherName: b.publisherName
                };
              })
            };
            $scope.editingPromotion = hydratePromotionBooks(promoLike);
          }).catch(function(){
            // fallback minimal rows
            $scope.editingPromotion.books = isbns.map(function(i){ return { isbn: i, title: '(đang tải...)' }; });
          });
          return;
        }
  
        // Fallback: build from currently loaded picker books (may be partial)
        var map = {};
        ($scope.bookPicker.books || []).forEach(function(b){ if (b && b.isbn) map[b.isbn] = b; });
        $scope.editingPromotion.books = isbns.map(function(i){
          var b = map[i];
          return b ? { isbn:b.isbn, title:b.title, unitPrice:b.unitPrice } : { isbn:i, title:'(đã chọn)' };
        });
        $scope.editingPromotion = hydratePromotionBooks({ discountPct:$scope.formData.discountPct, books: $scope.editingPromotion.books });
      }
  
      $scope.confirmAddPickedBooks = function(){
        var picked = Object.keys($scope.bookPicker.selected || {}).filter(function(k){ return $scope.bookPicker.selected[k]; });
        if (!Array.isArray($scope.formData.bookIsbns)) $scope.formData.bookIsbns = [];
        // merge unique
        picked.forEach(function(isbn){
          if ($scope.formData.bookIsbns.indexOf(isbn) === -1) $scope.formData.bookIsbns.push(isbn);
        });
  
        // keep preview table in sync (both Add & Edit)
        syncPreviewBooksFromIsbns();
  
        var m = getBookPickerModal();
        if (m) m.hide();
      };
  
      $scope.onBookPickerPageChange = function(page){
        $scope.bookPicker.currentPage = page;
        $scope.loadBooksForPicker();
      };
  
      $scope.removeBookFromPromotion = function(isbn) {
        if (!isbn) return;
        if ($scope.formData.bookIsbns) {
          $scope.formData.bookIsbns = $scope.formData.bookIsbns.filter(function(i){ return i !== isbn; });
        }
        if ($scope.editingPromotion && $scope.editingPromotion.books) {
          $scope.editingPromotion.books = $scope.editingPromotion.books.filter(function(b){ return b.isbn !== isbn; });
        }
      };
  
      // ---- View books of a promotion ----
      $scope.viewPromotionBooks = function(promo){
        $rootScope.selectedPromotion = hydratePromotionBooks(promo);
        $timeout(function(){
          var el = document.getElementById('promotionBooksModal');
          if (!el) return;
          try {
            var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
            if (modal) modal.show();
          } catch(e) {}
        }, 0);
      };
  
      // ---- Submit ----
      $scope.submitForm = function(){
        if ($scope.isSubmitting) return;
        $scope.error = null;
  
        if (!validateForm()) {
          $scope.addToast('danger', Object.values($scope.formErrors)[0] || 'Form chưa hợp lệ');
          return;
        }
  
        $scope.isSubmitting = true;
  
        var payload = {
          name: $scope.formData.name,
          description: $scope.formData.description,
          discountPct: Number($scope.formData.discountPct) || 0,
          startDate: toDateOnlyString($scope.formData.startDate), // backend expects string
          endDate: toDateOnlyString($scope.formData.endDate),
          bookIsbns: ($scope.formData.bookIsbns || []).slice()
        };
  
        var req = $scope.editingPromotion && $scope._originalPromotion
          ? BookstoreService.updatePromotion($scope._originalPromotion.promotionId || $scope._originalPromotion.id, payload)
          : BookstoreService.createPromotion(payload);
  
        req.then(function(){
          $scope.isSubmitting = false;
          $scope.addToast('success', ($scope._originalPromotion ? 'Cập nhật khuyến mãi thành công' : 'Tạo khuyến mãi thành công'));
          var m = getPromotionModal(); if (m) m.hide();
          $scope.loadPromotions();
        }).catch(function(err){
          $scope.isSubmitting = false;
          $scope.error = (err && err.data && err.data.message) ? err.data.message : 'Lỗi khi lưu khuyến mãi';
          $scope.addToast('danger', $scope.error);
        });
      };

      // ---- Delete promotion ----
      $scope.deletePromotion = function(promo){
        if (!promo) return;
        if (!confirm('Xóa khuyến mãi này?')) return;
        
        var id = promo.promotionId || promo.id;
        BookstoreService.deletePromotion(id)
          .then(function(){
            $scope.addToast('success', 'Đã xóa khuyến mãi');
            $scope.loadPromotions();
          })
          .catch(function(err){
            var errorMsg = (err && err.data && err.data.message) ? err.data.message : 'Không thể xóa khuyến mãi';
            $scope.addToast('danger', errorMsg);
          });
      };
  
      // ---- Init ----
      $scope.loadPromotions();
      $scope.loadStats();
    }
  ]);
  