// Book Controllers

// Books Controller (for viewing books)
app.controller('BooksController', ['$scope', 'BookstoreService', 'AuthService', 'CartService', '$location', function($scope, BookstoreService, AuthService, CartService, $location) {
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

	// (Đã bỏ tính năng gợi ý sách bằng AI trên trang books)

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
		$scope.isAiMode = false;
		$scope.aiSummary = null;
		$scope.aiError = null;
		$scope.loading = true;
		$scope.error = null;
		
		var categoryIdParam = ($scope.selectedCategoryId !== '' && $scope.selectedCategoryId != null) ? $scope.selectedCategoryId : undefined;
		var publisherIdParam = ($scope.selectedPublisherId !== '' && $scope.selectedPublisherId != null) ? $scope.selectedPublisherId : undefined;
		BookstoreService.getBooks({
			pageNumber: $scope.currentPage,
			pageSize: $scope.pageSize,
			searchTerm: $scope.searchTerm,
			categoryId: categoryIdParam,
			publisherId: publisherIdParam
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

	// (Đã bỏ hàm askAiRecommendations/resetAiMode vì không còn dùng)

	// Add to cart function
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

	// Get final price (support promotions)
	$scope.getFinalPrice = function(book) {
		if (!book) return 0;
		
		// Use discountedPrice if available (from new API)
		if (book.discountedPrice != null) return Math.round(book.discountedPrice);
		
		// Use currentPrice as fallback
		if (book.currentPrice != null) return Math.round(book.currentPrice);
		
		// Legacy support for old API structure
		if (book.effectivePrice != null) return Math.round(book.effectivePrice);
		
		// Calculate from promoPercent/promoAmount if available
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

	// Check if book has promotion
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
	
	// Add truncate filter directly to scope
	$scope.truncate = function(text, length) {
		if (!text) return '';
		length = length || 50;
		if (text.length <= length) return text;
		return text.substring(0, length) + '...';
	};
	
	$scope.title = 'Quản lý sách';
	$scope.books = [];
	$scope.categories = [];
	$scope.authors = [];
	$scope.publishers = [];
	$scope.loading = false;
	$scope.showError = false;
	$scope.errorMessage = '';
	$scope.isSaving = false;
	$scope.searchTerm = '';
	$scope.selectedCategoryId = '';
	$scope.selectedPublisherId = '';
	$scope.currentPage = 1;
	$scope.pageSize = 10;
	$scope.totalPages = 0;
	$scope.currentYear = new Date().getFullYear();
	$scope.publisherManager = {
		items: [],
		loading: false,
		saving: false,
		deletingId: null,
		isEdit: false,
		searchTerm: '',
		pageNumber: 1,
		pageSize: 10,
		totalPages: 1,
		totalCount: 0
	};
	$scope.publisherFormData = {
		publisherId: null,
		name: '',
		address: '',
		email: '',
		phone: '',
		bookCount: 0
	};

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
	
	// Clear error message
	$scope.clearError = function() {
		$scope.showError = false;
		$scope.errorMessage = '';
	};
	
	// Clear error when user starts typing ISBN
	$scope.onIsbnChange = function() {
		if ($scope.showError && $scope.errorMessage.includes('ISBN đã tồn tại')) {
			$scope.clearError();
		}
	};

	// Modal form data (admin)
	$scope.bookData = {
		isbn: '',
		title: '',
		categoryId: null,
		publisherId: null,
		currentPrice: 0,
		publishYear: new Date().getFullYear(),
		pageCount: 1,
		imageUrl: '',
		imageFile: null,
		imagePreview: null,
		stock: 0,
		authors: []
	};
	$scope.editingBook = null;
	$scope.showForm = false;

	// Load books
	$scope.loadBooks = function() {
		$scope.loading = true;
		$scope.showError = false;
		$scope.errorMessage = '';
		
		console.log('[AdminBooks] loadBooks called with:', {
			searchTerm: $scope.searchTerm,
			selectedCategoryId: $scope.selectedCategoryId,
			selectedPublisherId: $scope.selectedPublisherId,
			currentPage: $scope.currentPage,
			pageSize: $scope.pageSize
		});
		
		BookstoreService.getBooks({
			pageNumber: $scope.currentPage,
			pageSize: $scope.pageSize,
			searchTerm: $scope.searchTerm || '',
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
				$scope.showError = true;
				$scope.errorMessage = 'Không thể tải danh sách sách. Vui lòng thử lại.';
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
		if ($scope.selectedAuthorId == null || $scope.selectedAuthorId === '') {
			console.log('No author selected');
			return;
		}
		
		var author = ($scope.authors || []).find(function(a){ 
			return String(a.authorId) === String($scope.selectedAuthorId); 
		});
		
		if (!author) {
			console.log('Author not found for ID:', $scope.selectedAuthorId);
			return;
		}
		
		$scope.bookData.authors = $scope.bookData.authors || [];
		var exists = $scope.bookData.authors.some(function(a){ 
			return String(a.authorId) === String(author.authorId); 
		});
		
		if (!exists) {
			$scope.bookData.authors.push({ 
				authorId: author.authorId, 
				fullName: author.fullName 
			});
			console.log('✅ Author added:', author.fullName);
			$scope.addToast('success', 'Đã thêm tác giả: ' + author.fullName);
		} else {
			console.log('Author already exists:', author.fullName);
			$scope.addToast('warning', 'Tác giả đã được thêm: ' + author.fullName);
		}
		
	// Reset dropdown selection
	$scope.selectedAuthorId = null;
};

// Clear image
$scope.clearImage = function() {
	$scope.bookData.imageFile = null;
	$scope.bookData.imagePreview = null;
	$scope.bookData.imageUrl = '';
};

// Remove image (alias for clearImage)
$scope.removeImage = function() {
	$scope.clearImage();
};

$scope.removeAuthor = function(index) {
		if (!$scope.bookData || !Array.isArray($scope.bookData.authors)) return;
		
		var author = $scope.bookData.authors[index];
		if (author) {
			$scope.bookData.authors.splice(index, 1);
			console.log('✅ Author removed:', author.fullName);
			$scope.addToast('info', 'Đã xóa tác giả: ' + author.fullName);
		}
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

	function normalizePublisherListPayload(response) {
		if (response && response.data) {
			if (response.data.success && response.data.data) {
				return response.data.data;
			}
			if (Array.isArray(response.data.data)) {
				return { publishers: response.data.data };
			}
			if (Array.isArray(response.data)) {
				return { publishers: response.data };
			}
		} else if (Array.isArray(response)) {
			return { publishers: response };
		}
		return { publishers: [] };
	}

	$scope.startCreatePublisher = function(form) {
		$scope.publisherManager.isEdit = false;
		$scope.publisherFormData = {
			publisherId: null,
			name: '',
			address: '',
			email: '',
			phone: '',
			bookCount: 0
		};
		if (form && form.$setPristine) {
			form.$setPristine();
			form.$setUntouched();
		}
	};

	$scope.editPublisher = function(publisher, form) {
		if (!publisher) return;
		$scope.publisherManager.isEdit = true;
		$scope.publisherFormData = {
			publisherId: publisher.publisherId,
			name: publisher.name,
			address: publisher.address,
			email: publisher.email,
			phone: publisher.phone,
			bookCount: publisher.bookCount || 0
		};
		if (form && form.$setPristine) {
			form.$setPristine();
			form.$setUntouched();
		}
	};

	$scope.openPublisherManager = function() {
		$scope.publisherManager.searchTerm = '';
		$scope.publisherManager.pageNumber = 1;
		$scope.startCreatePublisher();
		$scope.loadPublisherManagementData().finally(function(){
			var modalEl = document.getElementById('publisherModal');
			if (!modalEl) return;
			var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
			modal.show();
		});
	};

	$scope.loadPublisherManagementData = function() {
		$scope.publisherManager.loading = true;
		return BookstoreService.getPublishers({
			pageNumber: $scope.publisherManager.pageNumber,
			pageSize: $scope.publisherManager.pageSize,
			searchTerm: $scope.publisherManager.searchTerm || ''
		})
		.then(function(response){
			var payload = normalizePublisherListPayload(response);
			var list = payload.publishers || [];
			$scope.publisherManager.items = list;
			$scope.publisherManager.totalPages = payload.totalPages || 1;
			$scope.publisherManager.totalCount = payload.totalCount || list.length;
		})
		.catch(function(error){
			console.error('Error loading publisher manager data:', error);
			$scope.addToast('danger', 'Không thể tải danh sách nhà xuất bản.');
		})
		.finally(function(){
			$scope.publisherManager.loading = false;
		});
	};

	$scope.searchPublisherManager = function() {
		$scope.publisherManager.pageNumber = 1;
		$scope.loadPublisherManagementData();
	};

	$scope.changePublisherManagerPage = function(page) {
		if (page < 1 || page > ($scope.publisherManager.totalPages || 1)) {
			return;
		}
		$scope.publisherManager.pageNumber = page;
		$scope.loadPublisherManagementData();
	};

	$scope.submitPublisherForm = function(form) {
		if (form && form.$setSubmitted) {
			form.$setSubmitted();
		}
		if (!$scope.publisherFormData.name || !$scope.publisherFormData.address || !$scope.publisherFormData.email || !$scope.publisherFormData.phone) {
			$scope.addToast('warning', 'Vui lòng nhập đầy đủ thông tin nhà xuất bản.');
			return;
		}
		$scope.publisherManager.saving = true;
		var payload = {
			name: $scope.publisherFormData.name,
			address: $scope.publisherFormData.address,
			email: $scope.publisherFormData.email,
			phone: $scope.publisherFormData.phone
		};
		var requestPromise;
		if ($scope.publisherManager.isEdit && $scope.publisherFormData.publisherId != null) {
			requestPromise = BookstoreService.updatePublisher($scope.publisherFormData.publisherId, payload);
		} else {
			requestPromise = BookstoreService.createPublisher(payload);
		}
		requestPromise
			.then(function(){
				$scope.addToast('success', $scope.publisherManager.isEdit ? 'Cập nhật nhà xuất bản thành công.' : 'Thêm nhà xuất bản thành công.');
				$scope.startCreatePublisher(form);
				$scope.loadPublisherManagementData();
				$scope.loadPublishers();
			})
			.catch(function(error){
				console.error('Save publisher error:', error);
				var message = (error && error.data && error.data.message) || 'Không thể lưu nhà xuất bản.';
				if (Array.isArray(error?.data?.errors) && error.data.errors.length > 0) {
					message = error.data.errors.join(', ');
				}
				$scope.addToast('danger', message);
			})
			.finally(function(){
				$scope.publisherManager.saving = false;
			});
	};

	$scope.confirmDeletePublisher = function(publisher) {
		if (!publisher || !publisher.publisherId) return;
		if (!confirm('Bạn chắc chắn muốn xóa nhà xuất bản "' + (publisher.name || '') + '"?')) {
			return;
		}
		$scope.publisherManager.deletingId = publisher.publisherId;
		BookstoreService.deletePublisher(publisher.publisherId)
			.then(function(){
				$scope.addToast('success', 'Đã xóa nhà xuất bản.');
				$scope.loadPublisherManagementData();
				$scope.loadPublishers();
			})
			.catch(function(error){
				console.error('Delete publisher error:', error);
				var message = (error && error.data && error.data.message) || 'Không thể xóa nhà xuất bản.';
				$scope.addToast('danger', message);
			})
			.finally(function(){
				$scope.publisherManager.deletingId = null;
			});
	};

	// Search books
	$scope.searchBooks = function() {
		$scope.currentPage = 1;
		$scope.loadBooks();
	};

	$scope.clearSearch = function() {
		$scope.searchTerm = '';
		$scope.currentPage = 1;
		$scope.loadBooks();
	};

	// Filter by category
	$scope.filterByCategory = function() {
		$scope.currentPage = 1;
		$scope.loadBooks();
	};

	// Filter by publisher
	$scope.filterByPublisher = function() {
		$scope.currentPage = 1;
		$scope.loadBooks();
	};

	// Reset filters
	$scope.resetFilters = function() {
		$scope.searchTerm = '';
		$scope.selectedCategoryId = '';
		$scope.selectedPublisherId = '';
		$scope.currentPage = 1;
		$scope.loadBooks();
	};

	// Page change
	$scope.goToPage = function(page) {
		$scope.currentPage = page;
		$scope.loadBooks();
	};

	// Open create modal
	$scope.openCreateModal = function() {
		$scope.isEditMode = false;
		$scope.clearError(); // Clear any previous errors
		$scope.bookData = {
			isbn: '',
			title: '',
			categoryId: null,
			publisherId: null,
			currentPrice: 0,
			publishYear: new Date().getFullYear(),
			pageCount: 1,
			imageUrl: '',
			imageFile: null,
			imagePreview: null,
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
		$scope.clearError(); // Clear any previous errors
		console.log('[AdminBooks] Open edit for ISBN:', book.isbn, 'incoming categoryId/publisherId:', book.categoryId, book.publisherId);
		console.log('[AdminBooks] Book currentPrice:', book.currentPrice, 'type:', typeof book.currentPrice);
		
		// Use book data from list (already includes details)
		$scope.bookData = {
			isbn: book.isbn,
			title: book.title,
            categoryId: (book.categoryId != null) ? String(book.categoryId) : null,
            publisherId: (book.publisherId != null) ? String(book.publisherId) : null,
			currentPrice: book.currentPrice,
			publishYear: book.publishYear,
			pageCount: book.pageCount,
			imageUrl: book.imageUrl,
			imageFile: null,
			imagePreview: book.imageUrl,
			stock: book.stock || 0,
			authors: (book.authors && Array.isArray(book.authors)) ? book.authors.map(function(a){ return { authorId: a.authorId, fullName: a.fullName }; }) : []
		};
		console.log('[AdminBooks] Initial bookData IDs:', $scope.bookData.categoryId, $scope.bookData.publisherId);
		console.log('[AdminBooks] Set bookData.currentPrice:', $scope.bookData.currentPrice, 'type:', typeof $scope.bookData.currentPrice);

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
				
				// Ensure currentPrice is properly set as number
				if ($scope.bookData.currentPrice != null) {
					$scope.bookData.currentPrice = parseFloat($scope.bookData.currentPrice);
					console.log('[AdminBooks] Final currentPrice:', $scope.bookData.currentPrice, 'type:', typeof $scope.bookData.currentPrice);
				}
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
					
					// Ensure currentPrice is properly displayed
					if ($scope.bookData.currentPrice != null) {
						$scope.bookData.currentPrice = parseFloat($scope.bookData.currentPrice);
						console.log('[AdminBooks] Post-modal currentPrice:', $scope.bookData.currentPrice);
						$scope.$apply();
					}
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
			currentPrice: 0,
			publishYear: new Date().getFullYear(),
			pageCount: 1,
			imageUrl: '',
			imageFile: null,
			imagePreview: null,
			stock: 0,
			authors: []
		};
		$scope.selectedAuthorId = null;
		var modal = bootstrap.Modal.getInstance(document.getElementById('bookModal'));
		if (modal) modal.hide();
	};

	// Save book
	$scope.saveBook = function() {
		// Mark all fields as touched to trigger validation
		$scope.bookForm.$setSubmitted();
		
		// Check if form is valid
		if ($scope.bookForm.$invalid) {
			$scope.showError = true;
			$scope.errorMessage = 'Vui lòng kiểm tra lại thông tin đã nhập.';
			return;
		}

		$scope.isSaving = true;
		$scope.showError = false;
		$scope.errorMessage = '';

		// Prepare book data for API - don't use angular.copy for File objects
		var bookDataToSend = {
			isbn: $scope.bookData.isbn,
			title: $scope.bookData.title,
			categoryId: $scope.bookData.categoryId,
			publisherId: $scope.bookData.publisherId,
			currentPrice: $scope.bookData.currentPrice,
			publishYear: $scope.bookData.publishYear,
			pageCount: $scope.bookData.pageCount,
			stock: $scope.bookData.stock,
			imageUrl: $scope.bookData.imageUrl,
			imageFile: $scope.bookData.imageFile, // Keep original File object
			imagePreview: $scope.bookData.imagePreview,
			authors: $scope.bookData.authors ? angular.copy($scope.bookData.authors) : []
		};
		
		console.log('=== PREPARING BOOK DATA ===');
		console.log('bookDataToSend:', bookDataToSend);
		console.log('bookDataToSend.imageFile:', bookDataToSend.imageFile);
		console.log('bookDataToSend.imageFile type:', typeof bookDataToSend.imageFile);
		console.log('bookDataToSend.imageFile instanceof File:', bookDataToSend.imageFile instanceof File);
		
		// Handle image logic
		if (!bookDataToSend.imageFile) {
			// No new file selected
			if ($scope.isEditMode && $scope.editingBook && $scope.editingBook.imageUrl) {
				// In edit mode, keep the original book's imageUrl
				bookDataToSend.imageUrl = $scope.editingBook.imageUrl;
				console.log('Edit mode: Keeping original imageUrl:', bookDataToSend.imageUrl);
			} else if (bookDataToSend.imageUrl) {
				// Keep existing imageUrl
				console.log('Keeping existing imageUrl:', bookDataToSend.imageUrl);
			} else {
				// No image at all
				bookDataToSend.imageUrl = '';
				console.log('No image file or URL');
			}
			// Remove imageFile from data to avoid sending null/undefined
			delete bookDataToSend.imageFile;
			delete bookDataToSend.imagePreview;
		} else {
			// New file selected
			console.log('Has new image file:', bookDataToSend.imageFile);
			// Remove imageUrl when uploading new file
			delete bookDataToSend.imageUrl;
			delete bookDataToSend.imagePreview;
		}

		var promise;
		if ($scope.editingBook) {
			// Update existing book
			promise = BookstoreService.updateBook($scope.editingBook.isbn, bookDataToSend);
		} else {
			// Create new book
			promise = BookstoreService.createBook(bookDataToSend);
		}

		promise
			.then(function(response) {
				$scope.isSaving = false;
				$scope.hideForm();
				$scope.loadBooks();
				$scope.addToast('success', $scope.editingBook ? 'Cập nhật sách thành công!' : 'Thêm sách thành công!');
			})
			.catch(function(error) {
				$scope.isSaving = false;
				console.error('Error saving book:', error);
				
				// Handle specific error cases
				if (error.data && error.data.errors && error.data.errors.length > 0) {
					var errorMessage = error.data.errors[0];
					
					// Handle ISBN already exists error
					if (errorMessage.includes('ISBN already exists') || errorMessage.includes('Book with this ISBN already exists')) {
						$scope.showError = true;
						$scope.errorMessage = 'ISBN đã tồn tại trong hệ thống. Vui lòng sử dụng ISBN khác.';
						$scope.addToast('danger', 'ISBN đã tồn tại! Vui lòng kiểm tra lại.');
						
						// Focus on ISBN field
						$timeout(function() {
							var isbnField = document.getElementById('bookIsbn');
							if (isbnField) {
								isbnField.focus();
								isbnField.select();
							}
						}, 100);
					} else {
						// Other validation errors
						$scope.showError = true;
						$scope.errorMessage = errorMessage;
						$scope.addToast('danger', errorMessage);
					}
				} else {
					// Generic error
					$scope.showError = true;
					$scope.errorMessage = error.data?.message || 'Có lỗi xảy ra khi lưu sách.';
					$scope.addToast('danger', $scope.errorMessage);
				}
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
				$scope.addToast('success', book.status ? 'Đã tắt sách.' : 'Đã bật sách.');
				$scope.loadBooks();
			})
			.catch(function(err){
				$scope.loading = false;
				$scope.showError = true;
				$scope.errorMessage = err.data?.message || 'Không thể cập nhật trạng thái sách.';
				$scope.addToast('danger', $scope.errorMessage);
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

	// Preview image when file is selected
	$scope.previewImage = function(input) {
		console.log('=== FILE INPUT CHANGED ===');
		console.log('input.files:', input.files);
		console.log('input.files.length:', input.files ? input.files.length : 'null');
		
		if (input.files && input.files[0]) {
			var file = input.files[0];
			console.log('Selected file:', file);
			console.log('File name:', file.name);
			console.log('File size:', file.size);
			console.log('File type:', file.type);
			console.log('File instanceof File:', file instanceof File);
			
			var reader = new FileReader();
			
			reader.onload = function(e) {
				$scope.$apply(function() {
					$scope.bookData.imageFile = file;
					$scope.bookData.imagePreview = e.target.result;
					
					console.log('✅ File set to bookData.imageFile:', $scope.bookData.imageFile);
					
					// Trigger validation for file input
					if ($scope.bookForm && $scope.bookForm.imageFile) {
						$scope.bookForm.imageFile.$setTouched();
					}
				});
			};
			
			reader.readAsDataURL(file);
		} else {
			console.log('❌ No file selected');
		}
	};

	// Remove selected image
	$scope.removeImage = function() {
		$scope.bookData.imageFile = null;
		$scope.bookData.imagePreview = null;
		$scope.bookData.imageUrl = '';
		
		// Clear file input
		var fileInput = document.getElementById('bookImage');
		if (fileInput) {
			fileInput.value = '';
		}
		
		// Trigger validation for file input
		if ($scope.bookForm && $scope.bookForm.imageFile) {
			$scope.bookForm.imageFile.$setTouched();
		}
	};

	// ==================== PRICE CHANGE FUNCTIONS ====================
	
	// Price change modal data
	$scope.selectedBookForPriceChange = null;
	$scope.priceChangeData = {
		newPrice: null,
		effectiveDate: '',
		reason: ''
	};
	
	// Price history data
	$scope.selectedBookForHistory = null;
	$scope.priceHistory = [];
	$scope.priceHistoryLoading = false;
	$scope.priceHistoryError = null;
	
	// Open price change modal
	$scope.openPriceChangeModal = function(book) {
		if (!book) return;
		
		$scope.selectedBookForPriceChange = book;
		$scope.priceChangeData = {
			newPrice: book.currentPrice,
			effectiveDate: new Date().toISOString().slice(0, 16), // Current datetime-local format
			reason: ''
		};
		
		var modal = new bootstrap.Modal(document.getElementById('priceChangeModal'));
		modal.show();
	};
	
	// Save price change
	$scope.savePriceChange = function() {
		if (!$scope.priceChangeData.newPrice || !$scope.priceChangeData.effectiveDate || !$scope.priceChangeData.reason) {
			$scope.addToast('warning', 'Vui lòng điền đầy đủ thông tin.');
			return;
		}
		
		$scope.loading = true;
		
		var priceChangeData = {
			isbn: $scope.selectedBookForPriceChange.isbn,
			newPrice: parseFloat($scope.priceChangeData.newPrice),
			effectiveDate: new Date($scope.priceChangeData.effectiveDate).toISOString(),
			reason: $scope.priceChangeData.reason.trim()
		};
		
		BookstoreService.createPriceChange(priceChangeData)
			.then(function(response) {
				$scope.loading = false;
				$scope.addToast('success', 'Thay đổi giá thành công!');
				
				// Close modal
				var modal = bootstrap.Modal.getInstance(document.getElementById('priceChangeModal'));
				if (modal) modal.hide();
				
				// Refresh books list to show updated price
				$scope.loadBooks();
			})
			.catch(function(error) {
				$scope.loading = false;
				var errorMsg = error.data?.message || 'Có lỗi xảy ra khi thay đổi giá.';
				$scope.addToast('danger', errorMsg);
				console.error('Error creating price change:', error);
			});
	};
	
	// View price history
	$scope.viewPriceHistory = function(book) {
		if (!book) return;
		
		$scope.selectedBookForHistory = book;
		$scope.priceHistoryLoading = true;
		$scope.priceHistoryError = null;
		$scope.priceHistory = [];
		
		BookstoreService.getPriceHistory(book.isbn)
			.then(function(response) {
				$scope.priceHistoryLoading = false;
				
				if (response.data && response.data.success && Array.isArray(response.data.data)) {
					$scope.priceHistory = response.data.data;
				} else if (Array.isArray(response.data)) {
					$scope.priceHistory = response.data;
				} else {
					$scope.priceHistory = [];
				}
			})
			.catch(function(error) {
				$scope.priceHistoryLoading = false;
				$scope.priceHistoryError = error.data?.message || 'Không thể tải lịch sử giá.';
				console.error('Error loading price history:', error);
			});
		
		var modal = new bootstrap.Modal(document.getElementById('priceHistoryModal'));
		modal.show();
	};

	// Initialize
	$scope.loadCategories();
	$scope.loadAuthors();
	$scope.loadPublishers();
	$scope.loadBooks();
}]);