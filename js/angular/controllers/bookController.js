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
                // Ensure categories is always an array
                if (response.data && Array.isArray(response.data.data)) {
                    $scope.categories = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    $scope.categories = response.data;
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
app.controller('AdminBooksController', ['$scope', 'BookstoreService', 'AuthService', '$location', function($scope, BookstoreService, AuthService, $location) {
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
    $scope.loading = false;
    $scope.error = null;
    $scope.success = null;
    $scope.searchTerm = '';
    $scope.selectedCategoryId = '';
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.totalPages = 0;

    // Form data
    $scope.formData = {
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        categoryId: '',
        price: 0,
        quantity: 0,
        description: ''
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
        BookstoreService.getCategories({
            pageNumber: 1,
            pageSize: 100,
            searchTerm: ''
        })
            .then(function(response) {
                // Ensure categories is always an array
                if (response.data && Array.isArray(response.data.data)) {
                    $scope.categories = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    $scope.categories = response.data;
                } else {
                    $scope.categories = [];
                }
            })
            .catch(function(error) {
                console.error('Error loading categories:', error);
            });
    };

    // Load authors
    $scope.loadAuthors = function() {
        BookstoreService.getAuthors()
            .then(function(response) {
                // Ensure authors is always an array
                if (response.data && Array.isArray(response.data)) {
                    $scope.authors = response.data;
                } else if (Array.isArray(response.data)) {
                    $scope.authors = response.data;
                } else {
                    $scope.authors = [];
                }
            })
            .catch(function(error) {
                console.error('Error loading authors:', error);
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
        $scope.formData = {
            isbn: '',
            title: '',
            author: '',
            publisher: '',
            categoryId: '',
            price: 0,
            quantity: 0,
            description: ''
        };
        $scope.loadCategories();
        $scope.loadAuthors();
        
        // Show modal
        var modal = new bootstrap.Modal(document.getElementById('bookModal'));
        modal.show();
    };

    // Show add form
    $scope.showAddForm = function() {
        $scope.editingBook = null;
        $scope.formData = {
            isbn: '',
            title: '',
            author: '',
            publisher: '',
            categoryId: '',
            price: 0,
            quantity: 0,
            description: ''
        };
        $scope.showForm = true;
    };

    // Show edit form
    $scope.showEditForm = function(book) {
        $scope.editingBook = book;
        $scope.formData = {
            isbn: book.isbn,
            title: book.title,
            author: book.author,
            publisher: book.publisher,
            categoryId: book.categoryId,
            price: book.price,
            quantity: book.quantity,
            description: book.description
        };
        $scope.showForm = true;
    };

    // Hide form
    $scope.hideForm = function() {
        $scope.showForm = false;
        $scope.editingBook = null;
        $scope.formData = {
            isbn: '',
            title: '',
            author: '',
            publisher: '',
            categoryId: '',
            price: 0,
            quantity: 0,
            description: ''
        };
    };

    // Save book
    $scope.saveBook = function() {
        if (!$scope.formData.isbn.trim() || !$scope.formData.title.trim()) {
            $scope.error = 'ISBN và tên sách không được để trống.';
            return;
        }

        $scope.loading = true;
        $scope.error = null;

        var promise;
        if ($scope.editingBook) {
            // Update existing book
            promise = BookstoreService.updateBook($scope.editingBook.isbn, $scope.formData);
        } else {
            // Create new book
            promise = BookstoreService.createBook($scope.formData);
        }

        promise
            .then(function(response) {
                $scope.loading = false;
                $scope.success = $scope.editingBook ? 'Cập nhật sách thành công!' : 'Thêm sách thành công!';
                $scope.hideForm();
                $scope.loadBooks();
                
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
            });
    };

    // Delete book
    $scope.deleteBook = function(book) {
        if (confirm('Bạn có chắc chắn muốn xóa sách "' + book.title + '"?')) {
            $scope.loading = true;
            $scope.error = null;

            BookstoreService.deleteBook(book.isbn)
                .then(function(response) {
                    $scope.loading = false;
                    $scope.success = 'Xóa sách thành công!';
                    $scope.loadBooks();
                    
                    // Hide success message after 3 seconds
                    setTimeout(function() {
                        $scope.$apply(function() {
                            $scope.success = null;
                        });
                    }, 3000);
                })
                .catch(function(error) {
                    $scope.loading = false;
                    $scope.error = error.data?.message || 'Có lỗi xảy ra khi xóa sách.';
                    console.error('Error deleting book:', error);
                });
        }
    };

    // Initialize
    $scope.loadCategories();
    $scope.loadAuthors();
    $scope.loadBooks();
}]);