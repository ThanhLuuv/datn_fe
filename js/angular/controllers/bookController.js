// Book Controllers

// Books Controller (for viewing books)
app.controller('BooksController', ['$scope', 'BookstoreService', 'AuthService', function($scope, BookstoreService, AuthService) {
	$scope.title = 'Danh sách sách';
	$scope.books = [];
	$scope.categories = [];
	$scope.loading = false;
	$scope.error = null;
	$scope.searchTerm = '';
	$scope.selectedCategoryId = '';
	$scope.selectedPublisherId = '';
	$scope.currentPage = 1;
	$scope.pageSize = 12;
	$scope.totalPages = 0;

	// Toasts for admin books
	$scope.toasts = [];
	$scope.addToast = function(variant, message) {
		var id = Date.now() + Math.random();
		$scope.toasts.push({ id: id, variant: variant, message: message });
		setTimeout(function(){
			$scope.$apply(function(){
				$scope.toasts = $scope.toasts.filter(function(t){ return t.id !== id; });
			});
		}, 3500);
	};

	// Load books
	$scope.loadBooks = function() {
		$scope.loading = true;
		$scope.error = null;
		
		BookstoreService.getBooks({
			pageNumber: $scope.currentPage,
			pageSize: $scope.pageSize,
			searchTerm: $scope.searchTerm,
			categoryId: $scope.selectedCategoryId,
			publisherId: $scope.selectedPublisherId
		})
			.then(function(response) {
				// Parse API response according to actual structure
				if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.books)) {
					$scope.books = response.data.data.books;
					$scope.totalPages = response.data.data.totalPages || 0;
				} else if (response.data && Array.isArray(response.data.data)) {
					$scope.books = response.data.data;
					$scope.totalPages = response.data.totalPages || 0;
				} else if (response.data && Array.isArray(response.data)) {
					$scope.books = response.data;
					$scope.totalPages = 0;
				} else {
					$scope.books = [];
					$scope.totalPages = 0;
				}
				$scope.loading = false;
			})
			.catch(function(error) {
				$scope.error = 'Không thể tải danh sách sách. Vui lòng thử lại.';
				$scope.loading = false;
				console.error('Error loading books:', error);
				$scope.addToast('danger', $scope.error);
			});
	};

	// Load categories for filter
	$scope.loadCategories = function() {
		BookstoreService.getCategories({
			pageNumber: 1,
			pageSize: 100,
			searchTerm: ''
		})
			.then(function(response) {
				// Support both { data: { categories: [...] } } and { data: [...] }
				if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.categories)) {
					$scope.categories = response.data.data.categories.map(function(c){
						c.categoryId = (c.categoryId != null) ? Number(c.categoryId) : c.categoryId;
						return c;
					});
				} else if (response.data && Array.isArray(response.data.data)) {
					$scope.categories = response.data.data.map(function(c){
						if (c && c.categoryId != null) c.categoryId = Number(c.categoryId);
						return c;
					});
				} else if (response.data && Array.isArray(response.data)) {
					$scope.categories = response.data.map(function(c){
						if (c && c.categoryId != null) c.categoryId = Number(c.categoryId);
						return c;
					});
				} else {
					$scope.categories = [];
				}
			})
			.catch(function(error) {
				console.error('Error loading categories:', error);
			});
	};

	// Search books
	$scope.search = function() {
		$scope.currentPage = 1;
		$scope.loadBooks();
	};

	// Filter by category
	$scope.filterByCategory = function() {
		$scope.currentPage = 1;
		$scope.loadBooks();
	};

	// Page change
	$scope.onPageChange = function(page) {
		$scope.currentPage = page;
		$scope.loadBooks();
	};

	// Initialize
	$scope.loadCategories();
	$scope.loadBooks();
}]);

// Admin Books Controller (for managing books)
app.controller('AdminBooksController', ['$scope', 'BookstoreService', 'AuthService', '$location', '$q', '$timeout', function($scope, BookstoreService, AuthService, $location, $q, $timeout) {
	// Check if user has admin or teacher access
	if (!AuthService.isAdminOrTeacher()) {
		console.log('Access denied: User does not have admin or teacher role');
		$location.path('/home');
		return;
	}
	$scope.title = 'Quản lý sách';
	$scope.books = [];
	$scope.categories = [];
	$scope.authors = [];
	$scope.publishers = [];
	$scope.loading = false;
	$scope.error = null;
	$scope.success = null;
	$scope.searchTerm = '';
	$scope.selectedCategoryId = '';
	$scope.currentPage = 1;
	$scope.pageSize = 10;
	$scope.totalPages = 0;
	$scope.currentYear = new Date().getFullYear();

	// Toasts
	$scope.toasts = [];
	$scope.addToast = function(variant, message) {
		var id = Date.now() + Math.random();
		$scope.toasts.push({ id: id, variant: variant, message: message });
		setTimeout(function(){
			$scope.$apply(function(){
				$scope.toasts = $scope.toasts.filter(function(t){ return t.id !== id; });
			});
		}, 3500);
	};

	// Modal form data (admin)
	$scope.bookData = {
		isbn: '',
		title: '',
		categoryId: null,
		publisherId: null,
		unitPrice: 0,
		publishYear: new Date().getFullYear(),
		pageCount: 1,
		imageUrl: '',
		stock: 0,
		authors: []
	};
	$scope.editingBook = null;
	$scope.showForm = false;

	// Load books
	$scope.loadBooks = function() {
		$scope.loading = true;
		$scope.error = null;
		
		BookstoreService.getBooks({
			pageNumber: $scope.currentPage,
			pageSize: $scope.pageSize,
			searchTerm: $scope.searchTerm,
			categoryId: $scope.selectedCategoryId,
			publisherId: ''
		})
			.then(function(response) {
				// Parse API response according to actual structure
				if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.books)) {
					$scope.books = response.data.data.books;
					$scope.totalPages = response.data.data.totalPages || 0;
				} else if (response.data && Array.isArray(response.data.data)) {
					$scope.books = response.data.data;
					$scope.totalPages = response.data.totalPages || 0;
				} else if (response.data && Array.isArray(response.data)) {
					$scope.books = response.data;
					$scope.totalPages = 0;
				} else {
					$scope.books = [];
					$scope.totalPages = 0;
				}
				$scope.loading = false;
			})
			.catch(function(error) {
				$scope.error = 'Không thể tải danh sách sách. Vui lòng thử lại.';
				$scope.loading = false;
				console.error('Error loading books:', error);
			});
	};

	// Load categories
    $scope.loadCategories = function() {
		return BookstoreService.getCategories({
			pageNumber: 1,
			pageSize: 100,
			searchTerm: ''
		})
			.then(function(response) {
				if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.categories)) {
                    $scope.categories = response.data.data.categories.map(function(c){
                        c.categoryId = (c && c.categoryId != null) ? String(c.categoryId) : c.categoryId;
						return c;
					});
				} else if (response.data && Array.isArray(response.data.data)) {
                    $scope.categories = response.data.data.map(function(c){ if (c && c.categoryId != null) c.categoryId = String(c.categoryId); return c; });
				} else if (response.data && Array.isArray(response.data)) {
                    $scope.categories = response.data.map(function(c){ if (c && c.categoryId != null) c.categoryId = String(c.categoryId); return c; });
				} else {
					$scope.categories = [];
				}
				console.log('[AdminBooks] Categories loaded:', ($scope.categories||[]).length, $scope.categories);
			})
			.catch(function(error) {
				console.error('Error loading categories:', error);
			})
			.finally(function(){
				return;
			});
	};

	// Load authors
	$scope.loadAuthors = function() {
		return BookstoreService.getAuthors()
			.then(function(response) {
				// Support multiple response shapes
				if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.authors)) {
					$scope.authors = response.data.data.authors;
				} else if (response.data && Array.isArray(response.data && response.data.data)) {
					$scope.authors = response.data.data;
				} else if (response.data && Array.isArray(response.data)) {
					$scope.authors = response.data;
				} else if (Array.isArray(response.data)) {
					$scope.authors = response.data;
				} else {
					$scope.authors = [];
				}
			})
			.catch(function(error) {
				console.error('Error loading authors:', error);
			})
			.finally(function(){
				return;
			});
	};

	// Manage authors in bookData
	$scope.selectedAuthorId = null;
	$scope.addAuthor = function() {
		if ($scope.selectedAuthorId == null) return;
		var author = ($scope.authors || []).find(function(a){ return String(a.authorId) === String($scope.selectedAuthorId); });
		if (!author) return;
		$scope.bookData.authors = $scope.bookData.authors || [];
		var exists = $scope.bookData.authors.some(function(a){ return String(a.authorId) === String(author.authorId); });
		if (!exists) {
			$scope.bookData.authors.push({ authorId: author.authorId, fullName: author.fullName });
		}
		$scope.selectedAuthorId = null;
	};

	$scope.removeAuthor = function(index) {
		if (!$scope.bookData || !Array.isArray($scope.bookData.authors)) return;
		$scope.bookData.authors.splice(index, 1);
	};

	// Load publishers
    $scope.loadPublishers = function() {
		return BookstoreService.getPublishers({ pageNumber: 1, pageSize: 200, searchTerm: '' })
			.then(function(response) {
				if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.publishers)) {
                    $scope.publishers = response.data.data.publishers.map(function(p){
                        p.publisherId = (p && p.publisherId != null) ? String(p.publisherId) : p.publisherId;
						return p;
					});
				} else if (response.data && Array.isArray(response.data.data)) {
                    $scope.publishers = response.data.data.map(function(p){ if (p && p.publisherId != null) p.publisherId = String(p.publisherId); return p; });
				} else if (response.data && Array.isArray(response.data)) {
                    $scope.publishers = response.data.map(function(p){ if (p && p.publisherId != null) p.publisherId = String(p.publisherId); return p; });
				} else {
					$scope.publishers = [];
				}
				console.log('[AdminBooks] Publishers loaded:', ($scope.publishers||[]).length, $scope.publishers);
			})
			.catch(function(error) {
				console.error('Error loading publishers:', error);
			})
			.finally(function(){
				return;
			});
	};

	// Search books
	$scope.search = function() {
		$scope.currentPage = 1;
		$scope.loadBooks();
	};

	// Filter by category
	$scope.filterByCategory = function() {
		$scope.currentPage = 1;
		$scope.loadBooks();
	};

	// Page change
	$scope.onPageChange = function(page) {
		$scope.currentPage = page;
		$scope.loadBooks();
	};

	// Open create modal
	$scope.openCreateModal = function() {
		$scope.isEditMode = false;
		$scope.bookData = {
			isbn: '',
			title: '',
			categoryId: null,
			publisherId: null,
			unitPrice: 0,
			publishYear: new Date().getFullYear(),
			pageCount: 1,
			imageUrl: '',
			stock: 0,
			authors: []
		};
		$scope.selectedAuthorId = null;
		$q.all([
			$scope.loadCategories(),
			$scope.loadAuthors(),
			$scope.loadPublishers()
		]).finally(function(){
			var modal = new bootstrap.Modal(document.getElementById('bookModal'));
			modal.show();
		});
	};

	// Not used in modal flow
	$scope.showAddForm = function() {};

	// Open edit modal
    $scope.openEditModal = function(book) {
		if (!book) return;
		$scope.isEditMode = true;
		$scope.editingBook = book;
		console.log('[AdminBooks] Open edit for ISBN:', book.isbn, 'incoming categoryId/publisherId:', book.categoryId, book.publisherId);
		
		// Use book data from list (already includes details)
		$scope.bookData = {
			isbn: book.isbn,
			title: book.title,
            categoryId: (book.categoryId != null) ? String(book.categoryId) : null,
            publisherId: (book.publisherId != null) ? String(book.publisherId) : null,
			unitPrice: book.unitPrice,
			publishYear: book.publishYear,
			pageCount: book.pageCount,
			imageUrl: book.imageUrl,
			stock: book.stock || 0,
			authors: (book.authors && Array.isArray(book.authors)) ? book.authors.map(function(a){ return { authorId: a.authorId, fullName: a.fullName }; }) : []
		};
		console.log('[AdminBooks] Initial bookData IDs:', $scope.bookData.categoryId, $scope.bookData.publisherId);

		$q.all([
			$scope.loadCategories(),
			$scope.loadPublishers()
		]).then(function(){
			// Normalize and directly set IDs as strings if they exist in lists
			var beforeCat = $scope.bookData.categoryId, beforePub = $scope.bookData.publisherId;
			var desiredCat = (beforeCat != null) ? String(beforeCat) : null;
			var desiredPub = (beforePub != null) ? String(beforePub) : null;
			if (desiredCat != null) {
				var hasCat = ($scope.categories || []).some(function(c){ return String(c.categoryId) === desiredCat; });
				$scope.bookData.categoryId = hasCat ? desiredCat : null;
			}
			if (desiredPub != null) {
				var hasPub = ($scope.publishers || []).some(function(p){ return String(p.publisherId) === desiredPub; });
				$scope.bookData.publisherId = hasPub ? desiredPub : null;
			}
			console.log('[AdminBooks] After lists loaded. Category match?', beforeCat, '->', $scope.bookData.categoryId, 'Publisher match?', beforePub, '->', $scope.bookData.publisherId, 'typeofs:', typeof $scope.bookData.categoryId, typeof $scope.bookData.publisherId);
		}).finally(function(){
			// One more digest-safe rebind then show modal in next tick
			$scope.$evalAsync(function(){
				$scope.bookData.categoryId = ($scope.bookData && $scope.bookData.categoryId != null) ? String($scope.bookData.categoryId) : null;
				$scope.bookData.publisherId = ($scope.bookData && $scope.bookData.publisherId != null) ? String($scope.bookData.publisherId) : null;
				console.log('[AdminBooks] Pre-modal IDs:', $scope.bookData.categoryId, $scope.bookData.publisherId, 'typeofs:', typeof $scope.bookData.categoryId, typeof $scope.bookData.publisherId);
			});
			$timeout(function(){
				var modal = new bootstrap.Modal(document.getElementById('bookModal'));
				modal.show();
				console.log('[AdminBooks] Modal shown with IDs:', $scope.bookData.categoryId, $scope.bookData.publisherId, 'typeofs:', typeof $scope.bookData.categoryId, typeof $scope.bookData.publisherId);
				// After modal attach, assert once more
				$timeout(function(){
					$scope.bookData.categoryId = ($scope.bookData && $scope.bookData.categoryId != null) ? String($scope.bookData.categoryId) : null;
					$scope.bookData.publisherId = ($scope.bookData && $scope.bookData.publisherId != null) ? String($scope.bookData.publisherId) : null;
					console.log('[AdminBooks] Post-show IDs:', $scope.bookData.categoryId, $scope.bookData.publisherId, 'typeofs:', typeof $scope.bookData.categoryId, typeof $scope.bookData.publisherId);
				});
			}, 0);
 		});
	};

	// Hide form
	$scope.hideForm = function() {
		$scope.editingBook = null;
		$scope.bookData = {
			isbn: '',
			title: '',
			categoryId: null,
			publisherId: null,
			unitPrice: 0,
			publishYear: new Date().getFullYear(),
			pageCount: 1,
			imageUrl: '',
			stock: 0,
			authors: []
		};
		$scope.selectedAuthorId = null;
		var modal = bootstrap.Modal.getInstance(document.getElementById('bookModal'));
		if (modal) modal.hide();
	};

	// Save book
	$scope.saveBook = function() {
		if (!$scope.bookData.isbn || !$scope.bookData.title) {
			$scope.error = 'ISBN và tên sách không được để trống.';
			return;
		}

		$scope.loading = true;
		$scope.error = null;

		var promise;
		if ($scope.editingBook) {
			// Update existing book
			promise = BookstoreService.updateBook($scope.editingBook.isbn, $scope.bookData);
		} else {
			// Create new book
			promise = BookstoreService.createBook($scope.bookData);
		}

		promise
			.then(function(response) {
				$scope.loading = false;
				$scope.success = $scope.editingBook ? 'Cập nhật sách thành công!' : 'Thêm sách thành công!';
				$scope.hideForm();
				$scope.loadBooks();
				$scope.addToast('success', $scope.success);
				
				// Hide success message after 3 seconds
				setTimeout(function() {
					$scope.$apply(function() {
						$scope.success = null;
					});
				}, 3000);
			})
			.catch(function(error) {
				$scope.loading = false;
				$scope.error = error.data?.message || 'Có lỗi xảy ra khi lưu sách.';
				console.error('Error saving book:', error);
				$scope.addToast('danger', $scope.error);
			});
	};

	// Delete book
	$scope.deleteBook = function(book) {
		// Deprecated: replaced by activate/deactivate
	};

	$scope.toggleBookStatus = function(book) {
		if (!book) return;
		$scope.loading = true;
		var promise = book.status ? BookstoreService.deactivateBook(book.isbn) : BookstoreService.activateBook(book.isbn);
		promise
			.then(function(){
				$scope.loading = false;
				$scope.success = book.status ? 'Đã tắt sách.' : 'Đã bật sách.';
				$scope.addToast('success', $scope.success);
				$scope.loadBooks();
			})
			.catch(function(err){
				$scope.loading = false;
				$scope.error = err.data?.message || 'Không thể cập nhật trạng thái sách.';
				$scope.addToast('danger', $scope.error);
			});
	};

	// View book detail in modal
	$scope.viewBook = function(book) {
		if (!book) return;
		$scope.selectedBook = book;
		var modalEl = document.getElementById('bookDetailModal');
		if (modalEl) {
			var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
			modal.show();
		}
	};

	// Initialize
	$scope.loadCategories();
	$scope.loadAuthors();
	$scope.loadPublishers();
	$scope.loadBooks();
}]);