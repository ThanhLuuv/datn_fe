// Bookstore Service - Quản lý tất cả API calls cho hệ thống bookstore
console.log('Loading BookstoreService...');
app.service('BookstoreService', ['$http', '$q', 'APP_CONFIG', 'AuthService', function($http, $q, APP_CONFIG, AuthService) {
    var baseUrl = APP_CONFIG.API_BASE_URL || 'http://localhost:5000/api';
    
    // Helper function to get auth headers
    var getAuthHeaders = function() {
        var token = AuthService.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        };
    };

    // ==================== CATEGORY APIs ====================
    
    // Lấy danh sách danh mục
    this.getCategories = function(params) {
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            searchTerm: params.searchTerm || ''
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/category',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // ==================== PUBLISHER APIs ====================
    
    // Lấy danh sách nhà xuất bản
    this.getPublishers = function(params) {
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            searchTerm: params.searchTerm || ''
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/publisher',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy danh sách sách theo nhà xuất bản
    this.getBooksByPublisher = function(publisherId, params) {
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            searchTerm: params.searchTerm || ''
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/book/by-publisher/' + publisherId,
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy danh mục theo ID
    this.getCategoryById = function(id) {
        return $http({
            method: 'GET',
            url: baseUrl + '/category/' + id,
            headers: getAuthHeaders()
        });
    };

    // Tạo danh mục mới
    this.createCategory = function(categoryData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/category',
            data: categoryData,
            headers: getAuthHeaders()
        });
    };

    // Cập nhật danh mục
    this.updateCategory = function(id, categoryData) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/category/' + id,
            data: categoryData,
            headers: getAuthHeaders()
        });
    };

    // Xóa danh mục
    this.deleteCategory = function(id) {
        return $http({
            method: 'DELETE',
            url: baseUrl + '/category/' + id,
            headers: getAuthHeaders()
        });
    };

    // ==================== BOOK APIs ====================
    
    // Lấy danh sách sách
    this.getBooks = function(params) {
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            searchTerm: params.searchTerm || '',
            categoryId: params.categoryId || '',
            publisherId: params.publisherId || ''
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/book',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy sách mới nhất
    this.getNewestBooks = function(limit) {
        var queryParams = { limit: Math.min(Math.max(parseInt(limit) || 10, 1), 50) };
        return $http({
            method: 'GET',
            url: baseUrl + '/book/newest',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // ==================== REPORT APIs ====================
    // Báo cáo doanh thu theo khoảng thời gian
    this.getRevenueReport = function(params) {
        var queryParams = {
            fromDate: params && params.fromDate ? params.fromDate : '',
            toDate: params && params.toDate ? params.toDate : ''
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/report/revenue',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // ==================== ROLE & PERMISSION APIs ====================
    // Get roles
    this.getRoles = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/role',
            headers: getAuthHeaders()
        });
    };

    // ==================== ADMIN DASHBOARD APIs ====================
    this.getAdminDashboardSummary = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/admin/dashboard/summary',
            headers: getAuthHeaders()
        });
    };

    this.getAdminRecentActivities = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/admin/dashboard/recent-activities',
            headers: getAuthHeaders()
        });
    };

    // New: total users
    this.getAdminTotalUsers = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/admin/dashboard/total-users',
            headers: getAuthHeaders()
        });
    };

    // New: total orders today (UTC)
    this.getAdminOrdersToday = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/admin/dashboard/orders-today',
            headers: getAuthHeaders()
        });
    };

    // Get all permissions
    this.getAllPermissions = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/role/permissions',
            headers: getAuthHeaders()
        });
    };

    // Get permissions by role
    this.getRolePermissions = function(roleId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/role/' + roleId + '/permissions',
            headers: getAuthHeaders()
        });
    };

    // Assign permission to role
    this.assignPermissionToRole = function(roleId, permissionId) {
        return $http({
            method: 'POST',
            url: baseUrl + '/role/assign',
            data: { roleId: roleId, permissionId: permissionId },
            headers: getAuthHeaders()
        });
    };

    // Remove permission from role
    this.removePermissionFromRole = function(roleId, permissionId) {
        return $http({
            method: 'POST',
            url: baseUrl + '/role/remove',
            data: { roleId: roleId, permissionId: permissionId },
            headers: getAuthHeaders()
        });
    };

    // Lấy sách theo ISBN
    this.getBookByIsbn = function(isbn) {
        return $http({
            method: 'GET',
            url: baseUrl + '/book/' + isbn,
            headers: getAuthHeaders()
        });
    };

    // Lấy danh sách tác giả
    this.getAuthors = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/book/authors',
            headers: getAuthHeaders()
        });
    };

    // Tạo tác giả mới
    this.createAuthor = function(authorData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/book/authors',
            data: authorData,
            headers: getAuthHeaders()
        });
    };

    // Tạo sách mới
    this.createBook = function(bookData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/book',
            data: bookData,
            headers: getAuthHeaders()
        });
    };

    // Cập nhật sách
    this.updateBook = function(isbn, bookData) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/book/' + isbn,
            data: bookData,
            headers: getAuthHeaders()
        });
    };

    // Xóa sách
    this.deleteBook = function(isbn) {
        return $http({
            method: 'DELETE',
            url: baseUrl + '/book/' + isbn,
            headers: getAuthHeaders()
        });
    };

    // Kích hoạt sách (status = 1)
    this.activateBook = function(isbn) {
        return $http({
            method: 'POST',
            url: baseUrl + '/book/' + encodeURIComponent(isbn) + '/activate',
            headers: getAuthHeaders()
        });
    };

    // Vô hiệu hóa sách (status = 0)
    this.deactivateBook = function(isbn) {
        return $http({
            method: 'POST',
            url: baseUrl + '/book/' + encodeURIComponent(isbn) + '/deactivate',
            headers: getAuthHeaders()
        });
    };

    // ==================== STOREFRONT APIs ====================
    // Bestsellers in last N days
    this.getBestSellers = function(days, top) {
        return $http({
            method: 'GET',
            url: baseUrl + '/storefront/bestsellers',
            params: { days: days || 30, top: top || 10 }
        });
    };

    // New books in last N days
    this.getNewBooks = function(days, top) {
        return $http({
            method: 'GET',
            url: baseUrl + '/storefront/new-books',
            params: { days: days || 30, top: top || 10 }
        });
    };

    // Search by title
    this.searchBooksByTitle = function(title, page, pageSize) {
        return $http({
            method: 'GET',
            url: baseUrl + '/storefront/search',
            params: { title: title || '', page: page || 1, pageSize: pageSize || 12 }
        });
    };

    // Get effective price for a book by ISBN
    this.getEffectivePrice = function(isbn) {
        if (!isbn) {
            return $q.reject('ISBN is required');
        }
        return $http({
            method: 'GET',
            url: baseUrl + '/storefront/effective-price/' + encodeURIComponent(isbn)
        });
    };

    // ==================== PURCHASE ORDER APIs ====================
    
    // Lấy danh sách đơn đặt mua
    this.getPurchaseOrders = function(params) {
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            searchTerm: params.searchTerm || ''
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/purchaseorder',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Tạo đơn đặt mua mới
    this.createPurchaseOrder = function(purchaseOrderData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/purchaseorder',
            data: purchaseOrderData,
            headers: getAuthHeaders()
        });
    };

    // Cập nhật đơn đặt mua
    this.updatePurchaseOrder = function(id, purchaseOrderData) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/purchaseorder/' + id,
            data: purchaseOrderData,
            headers: getAuthHeaders()
        });
    };

    // Thay đổi trạng thái đơn đặt mua
    this.changePurchaseOrderStatus = function(poId, newStatusId, note) {
        return $http({
            method: 'POST',
            url: baseUrl + '/purchaseorder/' + poId + '/change-status',
            data: {
                newStatusId: newStatusId,
                note: note || ''
            },
            headers: getAuthHeaders()
        });
    };

    // Xóa đơn đặt mua
    this.deletePurchaseOrder = function(id) {
        return $http({
            method: 'DELETE',
            url: baseUrl + '/purchaseorder/' + id,
            headers: getAuthHeaders()
        });
    };

    // ==================== GOODS RECEIPT APIs ====================
    
    // Lấy danh sách phiếu nhập
    this.getGoodsReceipts = function(params) {
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/goodsreceipt',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy danh sách đơn đặt mua có thể tạo phiếu nhập
    this.getAvailablePurchaseOrders = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/goodsreceipt/available-purchase-orders',
            headers: getAuthHeaders()
        });
    };

    // Tạo phiếu nhập mới
    this.createGoodsReceipt = function(goodsReceiptData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/goodsreceipt',
            data: goodsReceiptData,
            headers: getAuthHeaders()
        });
    };

    // Cập nhật phiếu nhập
    this.updateGoodsReceipt = function(id, goodsReceiptData) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/goodsreceipt/' + id,
            data: goodsReceiptData,
            headers: getAuthHeaders()
        });
    };

    // Xóa phiếu nhập
    this.deleteGoodsReceipt = function(id) {
        return $http({
            method: 'DELETE',
            url: baseUrl + '/goodsreceipt/' + id,
            headers: getAuthHeaders()
        });
    };

    // ==================== HEALTH CHECK APIs ====================
    
    // Health check
    this.healthCheck = function() {
        return $http.get(baseUrl.replace('/api', '') + '/health');
    };

    this.healthReady = function() {
        return $http.get(baseUrl.replace('/api', '') + '/health/ready');
    };

    this.healthLive = function() {
        return $http.get(baseUrl.replace('/api', '') + '/health/live');
    };

    // ==================== TEST APIs ====================
    
    // Test public endpoint
    this.testPublic = function() {
        return $http.get(baseUrl + '/test');
    };

    // Test protected endpoint
    this.testProtected = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/test/protected',
            headers: getAuthHeaders()
        });
    };

    // Test admin only endpoint
    this.testAdminOnly = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/test/admin-only',
            headers: getAuthHeaders()
        });
    };

    // Test sales only endpoint
    this.testSalesOnly = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/test/sales-only',
            headers: getAuthHeaders()
        });
    };

    // Test delivery only endpoint
    this.testDeliveryOnly = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/test/delivery-only',
            headers: getAuthHeaders()
        });
    };

    // Test staff only endpoint
    this.testStaffOnly = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/test/staff-only',
            headers: getAuthHeaders()
        });
    };

    // ==================== UTILITY FUNCTIONS ====================
    
    // Format currency
    this.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Format date
    this.formatDate = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    // Format datetime
    this.formatDateTime = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    // Get role name by ID
    this.getRoleName = function(roleId) {
        var roles = {
            1: 'ADMIN',
            2: 'SALES_EMPLOYEE',
            3: 'DELIVERY_EMPLOYEE',
            4: 'CUSTOMER'
        };
        return roles[roleId] || 'UNKNOWN';
    };

    // Get role display name by ID
    this.getRoleDisplayName = function(roleId) {
        var roles = {
            1: 'Quản trị viên',
            2: 'Nhân viên bán hàng',
            3: 'Nhân viên giao hàng',
            4: 'Khách hàng'
        };
        return roles[roleId] || 'Không xác định';
    };
}]);
