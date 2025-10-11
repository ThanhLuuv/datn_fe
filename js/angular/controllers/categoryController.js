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

    // Modal form state
    $scope.categoryData = { name: '', description: '' };
    $scope.isEditMode = false;
    $scope.categoryToDelete = null;
    $scope.showDeleteConfirm = false;

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
                console.log('Admin Categories API response:', response);
                // Parse API response according to actual structure
                if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.categories)) {
                    $scope.categories = response.data.data.categories;
                    $scope.totalPages = response.data.data.totalPages || 0;
                    console.log('Admin Categories loaded (method 1):', $scope.categories);
                } else if (response.data && Array.isArray(response.data.data)) {
                    $scope.categories = response.data.data;
                    $scope.totalPages = response.data.totalPages || 0;
                    console.log('Admin Categories loaded (method 2):', $scope.categories);
                } else if (response.data && Array.isArray(response.data)) {
                    $scope.categories = response.data;
                    $scope.totalPages = 0;
                    console.log('Admin Categories loaded (method 3):', $scope.categories);
                } else {
                    $scope.categories = [];
                    $scope.totalPages = 0;
                    console.log('No admin categories found');
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
        $scope.categoryData = { name: '', description: '' };
        var modal = new bootstrap.Modal(document.getElementById('categoryModal'));
        modal.show();
    };

    // Open edit modal
    $scope.openEditModal = function(category) {
        if (!category) return;
        $scope.isEditMode = true;
        $scope.editingCategory = category;
        $scope.categoryData = { name: category.name, description: category.description };
        var modal = new bootstrap.Modal(document.getElementById('categoryModal'));
        modal.show();
    };

    // View category detail
    $scope.viewCategory = function(category) {
        $scope.selectedCategory = category;
        var modal = new bootstrap.Modal(document.getElementById('categoryDetailModal'));
        modal.show();
    };

    function closeCategoryModal() {
        var modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
        if (modal) modal.hide();
    }

    // Save category (create/update)
    $scope.saveCategory = function() {
        if (!$scope.categoryData.name || !$scope.categoryData.name.trim()) {
            $scope.error = 'Tên danh mục không được để trống.';
            return;
        }

        $scope.loading = true;
        $scope.error = null;

        var promise;
        if ($scope.editingCategory) {
            // Update existing category
            promise = BookstoreService.updateCategory($scope.editingCategory.categoryId || $scope.editingCategory.id, $scope.categoryData);
        } else {
            // Create new category
            promise = BookstoreService.createCategory($scope.categoryData);
        }

        promise
            .then(function(response) {
                $scope.loading = false;
                $scope.success = $scope.editingCategory ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!';
                closeCategoryModal();
                $scope.loadCategories();
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
                $scope.error = error.data?.message || 'Có lỗi xảy ra khi lưu danh mục.';
                console.error('Error saving category:', error);
                $scope.addToast('danger', $scope.error);
            });
    };

    // Confirm delete flow
    $scope.confirmDelete = function(category) {
        $scope.categoryToDelete = category;
        $scope.showDeleteConfirm = true;
        var d = document.querySelector('confirm-dialog');
    };

    // Delete category (only if no books)
    $scope.deleteCategory = function() {
        var category = $scope.categoryToDelete;
        if (!category) return;
        if ((category.bookCount || 0) > 0) {
            $scope.error = 'Chỉ xóa được danh mục không có đầu sách.';
            $scope.showDeleteConfirm = false;
            $scope.addToast('warning', $scope.error);
            return;
        }
        $scope.loading = true;
        $scope.error = null;
        BookstoreService.deleteCategory(category.categoryId || category.id)
            .then(function(response) {
                $scope.loading = false;
                $scope.success = 'Xóa danh mục thành công!';
                $scope.loadCategories();
                $scope.showDeleteConfirm = false;
                $scope.addToast('success', $scope.success);
                setTimeout(function() {
                    $scope.$apply(function() { $scope.success = null; });
                }, 3000);
            })
            .catch(function(error) {
                $scope.loading = false;
                $scope.error = error.data?.message || 'Có lỗi xảy ra khi xóa danh mục.';
                console.error('Error deleting category:', error);
                $scope.showDeleteConfirm = false;
                $scope.addToast('danger', $scope.error);
            });
    };

    // Initialize
    $scope.loadCategories();
}]);