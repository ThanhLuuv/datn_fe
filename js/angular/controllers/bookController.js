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
	$scope.showError = false;
	$scope.errorMessage = '';
	$scope.showSuccess = false;
	$scope.successMessage = '';
	$scope.isSaving = false;
	$scope.searchTerm = '';
	$scope.selectedCategoryId = '';
	$scope.selectedPublisherId = '';
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
		$scope.bookData = {
			isbn: '',
			title: '',
			categoryId: null,
			publisherId: null,
			unitPrice: 0,
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
			imageFile: null,
			imagePreview: book.imageUrl,
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
			unitPrice: $scope.bookData.unitPrice,
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
		
		// If no new file is selected but we have an existing imageUrl, keep it
		if (!bookDataToSend.imageFile && bookDataToSend.imageUrl) {
			// Keep existing imageUrl
			console.log('Keeping existing imageUrl:', bookDataToSend.imageUrl);
		} else if (!bookDataToSend.imageFile && !bookDataToSend.imageUrl) {
			// No image at all
			bookDataToSend.imageUrl = '';
			console.log('No image file or URL');
		} else {
			console.log('Has image file:', bookDataToSend.imageFile);
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
				$scope.showSuccess = true;
				$scope.successMessage = $scope.editingBook ? 'Cập nhật sách thành công!' : 'Thêm sách thành công!';
				$scope.hideForm();
				$scope.loadBooks();
				$scope.addToast('success', $scope.successMessage);
				
				// Hide success message after 3 seconds
				setTimeout(function() {
					$scope.$apply(function() {
						$scope.showSuccess = false;
						$scope.successMessage = '';
					});
				}, 3000);
			})
			.catch(function(error) {
				$scope.isSaving = false;
				$scope.showError = true;
				$scope.errorMessage = error.data?.message || 'Có lỗi xảy ra khi lưu sách.';
				console.error('Error saving book:', error);
				$scope.addToast('danger', $scope.errorMessage);
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
				$scope.showSuccess = true;
				$scope.successMessage = book.status ? 'Đã tắt sách.' : 'Đã bật sách.';
				$scope.addToast('success', $scope.successMessage);
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

	// Initialize
	$scope.loadCategories();
	$scope.loadAuthors();
	$scope.loadPublishers();
	$scope.loadBooks();
}]);