// Category Controllers

// Categories Controller (for viewing categories)
app.controller('CategoriesController', ['$scope', 'BookstoreService', 'AuthService', function($scope, BookstoreService, AuthService) {
    $scope.title = 'Danh mục sách';
    $scope.categories = [];
    $scope.loading = false;
    $scope.error = null;
    $scope.searchTerm = '';
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.totalPages = 0;

    // Load categories
    $scope.loadCategories = function() {
        $scope.loading = true;
        $scope.error = null;
        
        BookstoreService.getCategories({
            pageNumber: $scope.currentPage,
            pageSize: $scope.pageSize,
            searchTerm: $scope.searchTerm
        })
            .then(function(response) {
                // Parse API response according to actual structure
                if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.categories)) {
                    $scope.categories = response.data.data.categories;
                    $scope.totalPages = response.data.data.totalPages || 0;
                } else if (response.data && Array.isArray(response.data.data)) {
                    $scope.categories = response.data.data;
                    $scope.totalPages = response.data.totalPages || 0;
                } else if (response.data && Array.isArray(response.data)) {
                    $scope.categories = response.data;
                    $scope.totalPages = 0;
                } else {
                    $scope.categories = [];
                    $scope.totalPages = 0;
                }
                $scope.loading = false;
            })
            .catch(function(error) {
                $scope.error = 'Không thể tải danh sách danh mục. Vui lòng thử lại.';
                $scope.loading = false;
                console.error('Error loading categories:', error);
            });
    };

    // Search categories
    $scope.search = function() {
        $scope.currentPage = 1;
        $scope.loadCategories();
    };

    // Page change
    $scope.onPageChange = function(page) {
        $scope.currentPage = page;
        $scope.loadCategories();
    };

    // Initialize
    $scope.loadCategories();
}]);

// Admin Categories Controller (for managing categories)
app.controller('AdminCategoriesController', ['$scope', 'BookstoreService', 'AuthService', '$location', function($scope, BookstoreService, AuthService, $location) {
    // Check if user has admin or teacher access
    if (!AuthService.isAdminOrTeacher()) {
        console.log('Access denied: User does not have admin or teacher role');
        $location.path('/home');
        return;
    }
    $scope.title = 'Quản lý danh mục';
    $scope.categories = [];
    $scope.loading = false;
    $scope.error = null;
    $scope.success = null;
    $scope.searchTerm = '';
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.totalPages = 0;

    // Form data
    $scope.formData = {
        name: '',
        description: ''
    };
    $scope.editingCategory = null;
    $scope.showForm = false;

    // Load categories
    $scope.loadCategories = function() {
        $scope.loading = true;
        $scope.error = null;
        
        BookstoreService.getCategories({
            pageNumber: $scope.currentPage,
            pageSize: $scope.pageSize,
            searchTerm: $scope.searchTerm
        })
            .then(function(response) {
                // Parse API response according to actual structure
                if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.categories)) {
                    $scope.categories = response.data.data.categories;
                    $scope.totalPages = response.data.data.totalPages || 0;
                } else if (response.data && Array.isArray(response.data.data)) {
                    $scope.categories = response.data.data;
                    $scope.totalPages = response.data.totalPages || 0;
                } else if (response.data && Array.isArray(response.data)) {
                    $scope.categories = response.data;
                    $scope.totalPages = 0;
                } else {
                    $scope.categories = [];
                    $scope.totalPages = 0;
                }
                $scope.loading = false;
            })
            .catch(function(error) {
                $scope.error = 'Không thể tải danh sách danh mục. Vui lòng thử lại.';
                $scope.loading = false;
                console.error('Error loading categories:', error);
            });
    };

    // Search categories
    $scope.search = function() {
        $scope.currentPage = 1;
        $scope.loadCategories();
    };

    // Page change
    $scope.onPageChange = function(page) {
        $scope.currentPage = page;
        $scope.loadCategories();
    };

    // Open create modal
    $scope.openCreateModal = function() {
        $scope.isEditMode = false;
        $scope.formData = {
            name: '',
            description: ''
        };
        
        // Show modal
        var modal = new bootstrap.Modal(document.getElementById('categoryModal'));
        modal.show();
    };

    // Show add form
    $scope.showAddForm = function() {
        $scope.editingCategory = null;
        $scope.formData = {
            name: '',
            description: ''
        };
        $scope.showForm = true;
    };

    // Show edit form
    $scope.showEditForm = function(category) {
        $scope.editingCategory = category;
        $scope.formData = {
            name: category.name,
            description: category.description
        };
        $scope.showForm = true;
    };

    // Hide form
    $scope.hideForm = function() {
        $scope.showForm = false;
        $scope.editingCategory = null;
        $scope.formData = {
            name: '',
            description: ''
        };
    };

    // Save category
    $scope.saveCategory = function() {
        if (!$scope.formData.name.trim()) {
            $scope.error = 'Tên danh mục không được để trống.';
            return;
        }

        $scope.loading = true;
        $scope.error = null;

        var promise;
        if ($scope.editingCategory) {
            // Update existing category
            promise = BookstoreService.updateCategory($scope.editingCategory.id, $scope.formData);
        } else {
            // Create new category
            promise = BookstoreService.createCategory($scope.formData);
        }

        promise
            .then(function(response) {
                $scope.loading = false;
                $scope.success = $scope.editingCategory ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!';
                $scope.hideForm();
                $scope.loadCategories();
                
                // Hide success message after 3 seconds
                setTimeout(function() {
                    $scope.$apply(function() {
                        $scope.success = null;
                    });
                }, 3000);
            })
            .catch(function(error) {
                $scope.loading = false;
                $scope.error = error.data?.message || 'Có lỗi xảy ra khi lưu danh mục.';
                console.error('Error saving category:', error);
            });
    };

    // Delete category
    $scope.deleteCategory = function(category) {
        if (confirm('Bạn có chắc chắn muốn xóa danh mục "' + category.name + '"?')) {
            $scope.loading = true;
            $scope.error = null;

            BookstoreService.deleteCategory(category.id)
                .then(function(response) {
                    $scope.loading = false;
                    $scope.success = 'Xóa danh mục thành công!';
                    $scope.loadCategories();
                    
                    // Hide success message after 3 seconds
                    setTimeout(function() {
                        $scope.$apply(function() {
                            $scope.success = null;
                        });
                    }, 3000);
                })
                .catch(function(error) {
                    $scope.loading = false;
                    $scope.error = error.data?.message || 'Có lỗi xảy ra khi xóa danh mục.';
                    console.error('Error deleting category:', error);
                });
        }
    };

    // Initialize
    $scope.loadCategories();
}]);