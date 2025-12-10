app.controller('AdminPromotionsController', [
  '$scope', '$rootScope', 'BookstoreService', 'AuthService', '$location', '$timeout',
  function ($scope, $rootScope, BookstoreService, AuthService, $location, $timeout) {

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
    $scope.addToast = function (variant, message) {
      var id = Date.now() + Math.random();
      $scope.toasts.push({ id: id, variant: variant, message: message });
      setTimeout(function () {
        $scope.$applyAsync(function () {
          $scope.toasts = $scope.toasts.filter(function (t) { return t.id !== id; });
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
      discountPct: 1,  // Default to minimum valid integer value
      startDate: null,   // Date object for input type="date"
      endDate: null,     // Date object for input type="date"
      bookIsbns: []
    };

    $scope.editingPromotion = null;         // also used to preview selected books in Add mode

    // Expose toDateObject to template for ng-change
    $scope.toDateObject = toDateObject;

    // Real-time validation for discount percentage (integer 1..100)
    $scope.validateDiscountPct = function () {
      if (!$scope.formErrors) $scope.formErrors = {};
      var pctNum = Number($scope.formData.discountPct);
      var pctStr = String($scope.formData.discountPct || '').trim();
      var isInteger = /^\d+$/.test(pctStr);
      if (!isFinite(pctNum) || !isInteger) {
        $scope.formErrors.discountPct = 'Mức giảm phải là số nguyên từ 1 đến 100';
      } else if (pctNum < 1 || pctNum > 100) {
        $scope.formErrors.discountPct = 'Mức giảm phải trong khoảng 1% - 100%';
      } else {
        $scope.formErrors.discountPct = null;
      }
    };

    // "Canh gác" model: ép mọi thứ về UTC Date nếu ai đó lỡ gán string
    $scope.$watchGroup(['formData.startDate', 'formData.endDate'], function (vals) {
      ['startDate', 'endDate'].forEach(function (k) {
        var v = $scope.formData[k];
        if (v && Object.prototype.toString.call(v) !== '[object Date]') {
          var d = toUtcDate(v);
          // Nếu parse thất bại -> null để tránh datefmt
          $scope.formData[k] = d instanceof Date && !isNaN(d.getTime()) ? d : null;
          console.log('Guard: Converted', k, 'from', typeof v, 'to UTC Date:', $scope.formData[k]);
        }
      });
    });

    // Watch for discount percentage changes to update preview prices
    $scope.$watch('formData.discountPct', function (newVal, oldVal) {
      if (newVal !== oldVal && $scope.editingPromotion && $scope.editingPromotion.books) {
        $scope.editingPromotion.books.forEach(function (book) {
          if (book.unitPrice) {
            book.discountedPrice = Math.round(book.unitPrice * (1 - (newVal || 0) / 100));
          }
        });
      }
    });
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

      var s = String(input).trim();

      // 1) ISO dạng 2025-10-04 hoặc 2025-10-04T...
      var iso = s.indexOf('T') !== -1 ? s.split('T')[0] : s.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        var p1 = iso.split('-').map(Number);
        return new Date(p1[0], p1[1] - 1, p1[2]);
      }

      // 2) dd/MM/yyyy hoặc d/M/yyyy (VN)
      var m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m1) {
        var d = parseInt(m1[1], 10), m = parseInt(m1[2], 10), y = parseInt(m1[3], 10);
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(y, m - 1, d);
      }

      // 3) MM-dd-yyyy hoặc M-d-yyyy
      var m2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (m2) {
        var mm = parseInt(m2[1], 10), dd = parseInt(m2[2], 10), yy = parseInt(m2[3], 10);
        if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) return new Date(yy, mm - 1, dd);
      }

      // 4) Fallback: new Date(...) (cẩn thận theo locale trình duyệt)
      var guess = new Date(s);
      return isNaN(guess.getTime()) ? null : guess;
    }

    function toUtcDate(input) {
      // parse về Date local trước
      var d = toDateObject(input);
      if (!d || isNaN(d.getTime())) return null;
      // trả Date ở 00:00 UTC (English: normalize to UTC midnight)
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    function toDateOnlyStringUTC(input) {
      if (!input) return '';
      var d = (Object.prototype.toString.call(input) === '[object Date]') ? input : toUtcDate(input);
      if (!d || isNaN(d.getTime())) return '';
      var y = d.getUTCFullYear();
      var m = String(d.getUTCMonth() + 1).padStart(2, '0');
      var dd = String(d.getUTCDate()).padStart(2, '0');
      return y + '-' + m + '-' + dd; // yyyy-MM-dd
    }

    function strToUtcDate(s) {
      // s dạng yyyy-MM-dd
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null;
      var parts = s.split('-').map(Number);
      var y = parts[0], m = parts[1], d = parts[2];
      return new Date(Date.UTC(y, m - 1, d));
    }

    function formatDateForInput(input) {
      if (!input) return '';
      if (Object.prototype.toString.call(input) === '[object Date]') {
        return input.getFullYear() + '-' +
          String(input.getMonth() + 1).padStart(2, '0') + '-' +
          String(input.getDate()).padStart(2, '0');
      }
      // If it's already a string in YYYY-MM-DD format, return as is
      if (typeof input === 'string') {
        var s = input.indexOf('T') !== -1 ? input.split('T')[0] : input.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          return s;
        }
      }
      // Try to parse and format
      var d = new Date(input);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0');
      }
      return '';
    }
    function compareDateOnly(a, b) {
      if (!a || !b) return 0;
      var ad = toDateObject(a), bd = toDateObject(b);
      if (!ad || !bd) return 0;
      return ad.setHours(0, 0, 0, 0) - bd.setHours(0, 0, 0, 0);
    }
    function validateForm() {
      var errs = {};
      if (!$scope.formData.name || !$scope.formData.name.trim()) errs.name = 'Vui lòng nhập tên khuyến mãi';
      var pct = Number($scope.formData.discountPct);
      var pctStr = String($scope.formData.discountPct || '').trim();
      if (!isFinite(pct) || !/^\d+$/.test(pctStr)) errs.discountPct = 'Mức giảm phải là số nguyên từ 1 đến 100';
      else if (pct < 1 || pct > 100) errs.discountPct = 'Mức giảm phải trong khoảng 1% - 100%';
      var s = toDateOnlyStringUTC($scope.formData.startDate);
      var e = toDateOnlyStringUTC($scope.formData.endDate);
      if (!s) errs.startDate = 'Vui lòng chọn ngày bắt đầu';
      if (!e) errs.endDate = 'Vui lòng chọn ngày kết thúc';
      if (s && e && compareDateOnly(e, s) < 0) errs.dateRange = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
      if (!$scope.formData.bookIsbns || $scope.formData.bookIsbns.length === 0) errs.bookIsbns = 'Vui lòng chọn ít nhất một sách áp dụng';
      $scope.formErrors = errs;
      return Object.keys(errs).length === 0;
    }
    function getPromotionModal() {
      var el = document.getElementById('promotionModal');
      try { return bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null; } catch (e) { return null; }
    }
    function getBookPickerModal() {
      var el = document.getElementById('bookPickerModal');
      try { return bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null; } catch (e) { return null; }
    }
    function hydratePromotionBooks(promo) {
      promo = promo || {};
      promo.books = Array.isArray(promo.books) ? promo.books : [];
      var pct = Number(promo.discountPct) || 0;
      promo.books = promo.books.map(function (b) {
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
    $scope.loadPromotions = function () {
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
      }).then(function (res) {
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
      }).catch(function (err) {
        $scope.error = 'Không thể tải danh sách khuyến mãi';
        $scope.addToast('danger', $scope.error);
        console.error(err);
      }).finally(function () {
        $scope.loading = false;
      });
    };

    $scope.loadStats = function () {
      BookstoreService.getPromotionStats()
        .then(function (res) {
          $scope.stats = (res && res.data && res.data.data) ? res.data.data : (res && res.data ? res.data : null);
        })
        .catch(function () { $scope.stats = null; });
    };

    $scope.search = function () {
      $scope.currentPage = 1;
      $scope.loadPromotions();
    };
    $scope.onPageChange = function (page) {
      $scope.currentPage = page;
      $scope.loadPromotions();
    };

    // ---- Form actions ----
    $scope.showAddForm = function () {
      $scope.formErrors = {};
      $scope.formData = { name: '', description: '', discountPct: 1, startDate: null, endDate: null, bookIsbns: [] };
      // Clear any previous edit context to ensure CREATE flow
      $scope._originalPromotion = null;
      $scope.editingPromotion = { books: [] }; // allow preview table in Add mode và để ng-if="editingPromotion" hoạt động
      $timeout(function () { var m = getPromotionModal(); if (m) m.show(); }, 0);
      $scope.bookPicker.searchTerm = '';
      $scope.bookPicker.currentPage = 1;
      $scope.loadBooksForPicker();
    };

    $scope.showEditForm = function (promo) {
      if (!promo) return;
      var hydrated = hydratePromotionBooks(promo);

      var bookIsbns = Array.isArray(hydrated.books)
        ? hydrated.books.map(function (b) { return b.isbn || b.bookIsbn || b; })
        : [];

      $scope.formErrors = {};

      function robustParseDate(val) {
        if (!val) return null;
        if (val instanceof Date) return val;
        var s = String(val);
        // Match YYYY-MM-DD
        var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
          return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
        }
        var d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      }

      $scope.formData = {
        name: hydrated.name || '',
        description: hydrated.description || '',
        discountPct: hydrated.discountPct || 0,
        startDate: robustParseDate(hydrated.startDate),
        endDate: robustParseDate(hydrated.endDate),
        bookIsbns: bookIsbns
      };

      // Debug log
      console.log('showEditForm - Original dates:', hydrated.startDate, hydrated.endDate);
      console.log('showEditForm - Parsed UTC dates:', $scope.formData.startDate, $scope.formData.endDate);
      console.log('showEditForm - Date types:', typeof $scope.formData.startDate, typeof $scope.formData.endDate);
      console.log('showEditForm - UTC strings:', toDateOnlyStringUTC($scope.formData.startDate), toDateOnlyStringUTC($scope.formData.endDate));

      $scope.editingPromotion = JSON.parse(JSON.stringify(hydrated));
      $scope._originalPromotion = JSON.parse(JSON.stringify(hydrated));

      $timeout(function () {
        $scope.$applyAsync(); // đảm bảo 1 vòng digest trước khi show
        var m = getPromotionModal();
        if (m) m.show();
      }, 0);

      // Debug script để kiểm tra DOM values
      $timeout(function () {
        var s = document.querySelector('#promotionModal input[ng-model="formData.startDate"]');
        var e = document.querySelector('#promotionModal input[ng-model="formData.endDate"]');
        console.log('DOM values after open:', s && s.value, e && e.value);
        console.log('Model types after digest:', typeof $scope.formData.startDate, typeof $scope.formData.endDate,
          $scope.formData.startDate, $scope.formData.endDate);
      }, 50);

      $scope.bookPicker.searchTerm = '';
      $scope.bookPicker.currentPage = 1;
      $scope.loadBooksForPicker();
    };

    $scope.closeForm = function () {
      var m = getPromotionModal();
      if (m) m.hide();
      // Reset form data
      $scope.formData = { name: '', description: '', discountPct: 0, startDate: null, endDate: null, bookIsbns: [] };
      $scope.editingPromotion = null;
      $scope._originalPromotion = null;
      $scope.formErrors = {};
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

    $scope.openBookPicker = function () {
      $scope.bookPicker.searchTerm = '';
      $scope.bookPicker.currentPage = 1;
      $scope.bookPicker.selected = {};
      $scope.loadBooksForPicker();
      $timeout(function () { var m = getBookPickerModal(); if (m) m.show(); }, 0);
    };

    $scope.loadBooksForPicker = function () {
      $scope.bookPicker.loading = true;
      $scope.bookPicker.error = null;
      BookstoreService.getBooks({
        pageNumber: $scope.bookPicker.currentPage,
        pageSize: $scope.bookPicker.pageSize,
        searchTerm: $scope.bookPicker.searchTerm
      }).then(function (res) {
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
        list.forEach(function (b) {
          if (b && b.isbn) $scope.bookPicker.selected[b.isbn] = chosen.has(b.isbn);
        });
      }).catch(function () {
        $scope.bookPicker.error = 'Không thể tải danh sách sách';
      }).finally(function () {
        $scope.bookPicker.loading = false;
      });
    };

    $scope.togglePickBook = function (isbn) {
      if (!$scope.bookPicker.selected) $scope.bookPicker.selected = {};
      $scope.bookPicker.selected[isbn] = !$scope.bookPicker.selected[isbn];
    };

    $scope.selectAllBooksInPicker = function () {
      if (!$scope.bookPicker) return;
      if (!$scope.bookPicker.selected) $scope.bookPicker.selected = {};
      ($scope.bookPicker.books || []).forEach(function (b) {
        if (b && b.isbn) {
          $scope.bookPicker.selected[b.isbn] = true;
        }
      });
      // ensure UI updates immediately
      try { $scope.$applyAsync(); } catch (e) { }
    };

    $scope.clearAllBooksInPicker = function () {
      if (!$scope.bookPicker || !$scope.bookPicker.selected) return;
      ($scope.bookPicker.books || []).forEach(function (b) {
        if (b && b.isbn) {
          $scope.bookPicker.selected[b.isbn] = false;
        }
      });
      try { $scope.$applyAsync(); } catch (e) { }
    };

    $scope.isAllBooksSelectedInPicker = function () {
      var books = ($scope.bookPicker && $scope.bookPicker.books) ? $scope.bookPicker.books : [];
      if (!books.length) return false;
      var sel = $scope.bookPicker.selected || {};
      for (var i = 0; i < books.length; i++) {
        var b = books[i];
        if (!b || !b.isbn) continue;
        if (!sel[b.isbn]) return false;
      }
      return true;
    };

    // Try to resolve full book details for preview
    function syncPreviewBooksFromIsbns() {
      var isbns = ($scope.formData.bookIsbns || []).slice();
      if (!$scope.editingPromotion) $scope.editingPromotion = { books: [] };

      // Use existing getBooks API and filter by ISBNs
      if (isbns.length > 0) {
        BookstoreService.getBooks({ pageNumber: 1, pageSize: 1000, searchTerm: '' })
          .then(function (res) {
            var resp = res.data || {};
            var allBooks = [];

            if (resp.success && resp.data && Array.isArray(resp.data.books)) {
              allBooks = resp.data.books;
            } else if (Array.isArray(resp.data)) {
              allBooks = resp.data;
            }

            // Filter books by selected ISBNs
            var selectedBooks = allBooks.filter(function (book) {
              return isbns.indexOf(book.isbn) !== -1;
            });

            var promoLike = {
              discountPct: $scope.formData.discountPct,
              books: selectedBooks.map(function (b) {
                return {
                  isbn: b.isbn,
                  title: b.title,
                  unitPrice: b.currentPrice || b.unitPrice || 0,
                  publisherName: b.publisherName || '',
                  categoryName: b.categoryName || '',
                  discountedPrice: Math.round((b.currentPrice || b.unitPrice || 0) * (1 - ($scope.formData.discountPct || 0) / 100))
                };
              })
            };

            $scope.editingPromotion = hydratePromotionBooks(promoLike);
          })
          .catch(function (error) {
            console.error('Error loading books for preview:', error);
            // fallback minimal rows
            $scope.editingPromotion.books = isbns.map(function (i) {
              return {
                isbn: i,
                title: '(đang tải...)',
                unitPrice: 0,
                publisherName: '',
                categoryName: '',
                discountedPrice: 0
              };
            });
          });
        return;
      }

      // Fallback: build from currently loaded picker books (may be partial)
      var map = {};
      ($scope.bookPicker.books || []).forEach(function (b) { if (b && b.isbn) map[b.isbn] = b; });
      $scope.editingPromotion.books = isbns.map(function (i) {
        var b = map[i];
        return b ? {
          isbn: b.isbn,
          title: b.title,
          unitPrice: b.currentPrice || b.unitPrice || 0,
          publisherName: b.publisherName || '',
          categoryName: b.categoryName || '',
          discountedPrice: Math.round((b.currentPrice || b.unitPrice || 0) * (1 - ($scope.formData.discountPct || 0) / 100))
        } : {
          isbn: i,
          title: '(đã chọn)',
          unitPrice: 0,
          publisherName: '',
          categoryName: '',
          discountedPrice: 0
        };
      });
      $scope.editingPromotion = hydratePromotionBooks({ discountPct: $scope.formData.discountPct, books: $scope.editingPromotion.books });
    }

    $scope.confirmAddPickedBooks = function () {
      var picked = Object.keys($scope.bookPicker.selected || {}).filter(function (k) { return $scope.bookPicker.selected[k]; });
      if (!Array.isArray($scope.formData.bookIsbns)) $scope.formData.bookIsbns = [];
      // merge unique
      picked.forEach(function (isbn) {
        if ($scope.formData.bookIsbns.indexOf(isbn) === -1) $scope.formData.bookIsbns.push(isbn);
      });

      // keep preview table in sync (both Add & Edit)
      syncPreviewBooksFromIsbns();

      var m = getBookPickerModal();
      if (m) m.hide();
    };

    $scope.onBookPickerPageChange = function (page) {
      $scope.bookPicker.currentPage = page;
      $scope.loadBooksForPicker();
    };

    $scope.removeBookFromPromotion = function (isbn) {
      if (!isbn) return;
      if ($scope.formData.bookIsbns) {
        $scope.formData.bookIsbns = $scope.formData.bookIsbns.filter(function (i) { return i !== isbn; });
      }
      if ($scope.editingPromotion && $scope.editingPromotion.books) {
        $scope.editingPromotion.books = $scope.editingPromotion.books.filter(function (b) { return b.isbn !== isbn; });
      }
    };

    // ---- View books of a promotion ----
    $scope.viewPromotionBooks = function (promo) {
      $rootScope.selectedPromotion = hydratePromotionBooks(promo);
      $timeout(function () {
        var el = document.getElementById('promotionBooksModal');
        if (!el) return;
        try {
          var modal = bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(el) : null;
          if (modal) modal.show();
        } catch (e) { }
      }, 0);
    };

    // ---- Submit ----
    $scope.submitForm = function () {
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
        startDate: toDateOnlyStringUTC($scope.formData.startDate), // backend expects string
        endDate: toDateOnlyStringUTC($scope.formData.endDate),
        bookIsbns: ($scope.formData.bookIsbns || []).slice()
      };

      var req = $scope.editingPromotion && $scope._originalPromotion
        ? BookstoreService.updatePromotion($scope._originalPromotion.promotionId || $scope._originalPromotion.id, payload)
        : BookstoreService.createPromotion(payload);

      req.then(function () {
        $scope.isSubmitting = false;
        $scope.addToast('success', ($scope._originalPromotion ? 'Cập nhật khuyến mãi thành công' : 'Tạo khuyến mãi thành công'));
        var m = getPromotionModal(); if (m) m.hide();
        $scope.loadPromotions();
      }).catch(function (err) {
        $scope.isSubmitting = false;
        $scope.error = (err && err.data && err.data.message) ? err.data.message : 'Lỗi khi lưu khuyến mãi';
        $scope.addToast('danger', $scope.error);
      });
    };

    // ---- Delete promotion ----
    // ---- Delete promotion ----
    $scope.showDeleteConfirm = false;
    $scope.promotionToDelete = null;
    $scope.deleteMessage = '';

    $scope.deletePromotion = function (promo) {
      if (!promo) return;
      $scope.promotionToDelete = promo;
      $scope.deleteMessage = 'Bạn có chắc chắn muốn xóa khuyến mãi <strong>' + promo.name + '</strong>?';
      $scope.showDeleteConfirm = true;
    };

    $scope.confirmDeletePromotion = function () {
      if (!$scope.promotionToDelete) return;

      var id = $scope.promotionToDelete.promotionId || $scope.promotionToDelete.id;
      BookstoreService.deletePromotion(id)
        .then(function () {
          $scope.addToast('success', 'Đã xóa khuyến mãi');
          $scope.loadPromotions();
        })
        .catch(function (err) {
          var errorMsg = (err && err.data && err.data.message) ? err.data.message : 'Không thể xóa khuyến mãi';
          $scope.addToast('danger', errorMsg);
        })
        .finally(function () {
          $scope.showDeleteConfirm = false;
          $scope.promotionToDelete = null;
        });
    };

    // ---- Init ----
    $scope.loadPromotions();
    $scope.loadStats();
  }
]);
