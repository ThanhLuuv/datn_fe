// Bookstore Service - Quản lý tất cả API calls cho hệ thống bookstore
console.log('Loading BookstoreService...');
app.service('BookstoreService', ['$http', '$q', 'APP_CONFIG', 'AuthService', function($http, $q, APP_CONFIG, AuthService) {
    // Auto-detect API URL: use local backend for localhost, production otherwise
    var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    var baseUrl = APP_CONFIG.API_BASE_URL || (isLocal ? 'http://localhost:5256/api' : 'https://api-datn.thanhlaptrinh.online/api');
    
    // Helper function to get auth headers
    var getAuthHeaders = function() {
        var token = AuthService.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        };
    };

    // Helper function to get auth headers for file upload
    var getFileUploadHeaders = function() {
        var token = AuthService.getToken();
        return {
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

    // ==================== AREA APIs ====================
    
    // Lấy danh sách khu vực
    this.getAreas = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/area',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    };

    // Lấy thông tin khu vực theo ID
    this.getAreaById = function(areaId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/area/' + areaId,
            headers: {
                'Content-Type': 'application/json'
            }
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
        params = params || {};
        // Only include filters when provided; avoid sending empty strings that may confuse backend
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        if (params.searchTerm && String(params.searchTerm).trim() !== '') {
            queryParams.searchTerm = String(params.searchTerm).trim();
        }
        if (params.categoryId != null && params.categoryId !== '' && params.categoryId !== undefined) {
            // Convert to number if it's a valid number
            var catId = Number(params.categoryId);
            if (!isNaN(catId) && catId > 0) {
                queryParams.categoryId = catId;
            }
        }
        if (params.publisherId != null && params.publisherId !== '' && params.publisherId !== undefined) {
            // Convert to number if it's a valid number
            var pubId = Number(params.publisherId);
            if (!isNaN(pubId) && pubId > 0) {
                queryParams.publisherId = pubId;
            }
        }
        
        console.log('[BookstoreService] getBooks params:', queryParams);
        
        return $http({
            method: 'GET',
            url: baseUrl + '/book',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy sách theo danh mục (Public API for storefront/home)
    this.getBooksByCategory = function(categoryId, params) {
        params = params || {};
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 12,
            search: params.search || params.searchTerm || ''
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/book/categories/' + encodeURIComponent(categoryId),
            params: queryParams
        });
    };


    // ==================== REPORT APIs ====================
    // Tỷ lệ sách theo danh mục
    this.getBooksByCategoryShare = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/report/books-by-category',
            headers: getAuthHeaders()
        });
    };
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

    // Báo cáo tồn kho theo ngày
    this.getInventoryReport = function(date) {
        var queryParams = {
            date: date || ''
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/report/inventory',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Báo cáo lợi nhuận (fromDate,toDate)
    this.getProfitReport = function(params) {
        params = params || {};
        var queryParams = {
            fromDate: params.fromDate || '',
            toDate: params.toDate || ''
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/report/profit',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

	// Báo cáo doanh thu theo tháng
	this.getRevenueReportMonthly = function(params) {
		var queryParams = {
			fromDate: params && params.fromDate ? params.fromDate : '',
			toDate: params && params.toDate ? params.toDate : ''
		};
		return $http({
			method: 'GET',
			url: baseUrl + '/report/revenue-monthly',
			headers: getAuthHeaders(),
			params: queryParams
		});
	};

	// Báo cáo doanh thu theo quý
	this.getRevenueReportQuarterly = function(params) {
		var queryParams = {
			fromDate: params && params.fromDate ? params.fromDate : '',
			toDate: params && params.toDate ? params.toDate : ''
		};
		return $http({
			method: 'GET',
			url: baseUrl + '/report/revenue-quarterly',
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
        // Always use FormData for multipart form data
        var formData = new FormData();
        
        // Ensure all required fields are properly formatted
        formData.append('isbn', String(bookData.isbn || ''));
        formData.append('title', String(bookData.title || ''));
        formData.append('categoryId', String(bookData.categoryId || ''));
        formData.append('publisherId', String(bookData.publisherId || ''));
        formData.append('unitPrice', String(Number(bookData.unitPrice) || 0));
        formData.append('publishYear', String(Number(bookData.publishYear) || new Date().getFullYear()));
        formData.append('pageCount', String(Number(bookData.pageCount) || 1));
        formData.append('stock', String(Number(bookData.stock) || 0));
        
        // Add authors as comma-separated string (authorIds)
        if (bookData.authors && bookData.authors.length > 0) {
            var authorIds = bookData.authors.map(function(author) {
                return author.authorId;
            }).join(',');
            formData.append('authorIds', authorIds);
        }
        
        // Add image file if exists
        console.log('=== DEBUG IMAGE FILE ===');
        console.log('bookData.imageFile:', bookData.imageFile);
        console.log('bookData.imageFile type:', typeof bookData.imageFile);
        console.log('bookData.imageFile instanceof File:', bookData.imageFile instanceof File);
        
        if (bookData.imageFile) {
            formData.append('imageFile', bookData.imageFile);
            console.log('✅ Image file added to FormData');
        } else {
            console.log('❌ No image file to add');
        }
        
        // Debug: Log form data
        console.log('=== SENDING FORMDATA TO /api/book ===');
        console.log('FormData contents:');
        for (var pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[1] instanceof File ? '[FILE: ' + pair[1].name + ']' : pair[1]));
        }
        
        // Log detailed FormData information
        console.log('=== FORMDATA DETAILS ===');
        console.log('FormData constructor:', formData.constructor.name);
        console.log('FormData entries count:', Array.from(formData.entries()).length);
        
        // Log each field separately
        console.log('=== FIELD BY FIELD ===');
        console.log('isbn:', formData.get('isbn'));
        console.log('title:', formData.get('title'));
        console.log('categoryId:', formData.get('categoryId'));
        console.log('publisherId:', formData.get('publisherId'));
        console.log('unitPrice:', formData.get('unitPrice'));
        console.log('publishYear:', formData.get('publishYear'));
        console.log('pageCount:', formData.get('pageCount'));
        console.log('stock:', formData.get('stock'));
        console.log('authorIds:', formData.get('authorIds'));
        
        var imageFile = formData.get('imageFile');
        if (imageFile) {
            console.log('imageFile:', {
                name: imageFile.name,
                size: imageFile.size,
                type: imageFile.type,
                lastModified: imageFile.lastModified,
                constructor: imageFile.constructor.name
            });
        } else {
            console.log('imageFile: null');
        }
        
        // Use fetch API for FormData to ensure proper multipart/form-data
        var token = AuthService.getToken();
        
        console.log('=== SENDING FETCH REQUEST ===');
        console.log('URL:', baseUrl + '/book');
        console.log('Method: POST');
        console.log('Headers:', { 'Authorization': 'Bearer ' + token });
        console.log('Body type:', formData.constructor.name);
        
        // Log raw FormData as string (for debugging)
        console.log('=== RAW FORMDATA DEBUG ===');
        try {
            // Try to log FormData as string representation
            var formDataString = '';
            for (var pair of formData.entries()) {
                if (pair[1] instanceof File) {
                    formDataString += pair[0] + ': [FILE] ' + pair[1].name + ' (' + pair[1].size + ' bytes)\n';
                } else {
                    formDataString += pair[0] + ': ' + pair[1] + '\n';
                }
            }
            console.log('FormData as string:\n' + formDataString);
        } catch (e) {
            console.log('Cannot convert FormData to string:', e.message);
        }
        
        return fetch(baseUrl + '/book', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
                // Don't set Content-Type - browser will set it automatically
            },
            body: formData
        })
        .then(function(response) {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                return response.json().then(function(errorData) {
                    console.error('Error response:', errorData);
                    throw new Error(errorData.message || 'Request failed');
                });
            }
            return response.json();
        })
        .then(function(data) {
            console.log('Success response:', data);
            return { data: data };
        })
        .catch(function(error) {
            console.error('Fetch error:', error);
            throw { data: { message: error.message } };
        });
    };

    // Cập nhật sách
    this.updateBook = function(isbn, bookData) {
        // Always use FormData for multipart form data
        var formData = new FormData();
        
        // Ensure all required fields are properly formatted
        formData.append('isbn', String(bookData.isbn || ''));
        formData.append('title', String(bookData.title || ''));
        formData.append('categoryId', String(bookData.categoryId || ''));
        formData.append('publisherId', String(bookData.publisherId || ''));
        formData.append('unitPrice', String(Number(bookData.unitPrice) || 0));
        formData.append('publishYear', String(Number(bookData.publishYear) || new Date().getFullYear()));
        formData.append('pageCount', String(Number(bookData.pageCount) || 1));
        formData.append('stock', String(Number(bookData.stock) || 0));
        
        // Add authors as comma-separated string (authorIds)
        if (bookData.authors && bookData.authors.length > 0) {
            var authorIds = bookData.authors.map(function(author) {
                return author.authorId;
            }).join(',');
            formData.append('authorIds', authorIds);
        }
        
        // Add image file if exists
        console.log('=== DEBUG IMAGE FILE (UPDATE) ===');
        console.log('bookData.imageFile:', bookData.imageFile);
        console.log('bookData.imageFile type:', typeof bookData.imageFile);
        console.log('bookData.imageFile instanceof File:', bookData.imageFile instanceof File);
        
        if (bookData.imageFile) {
            formData.append('imageFile', bookData.imageFile);
            console.log('✅ Image file added to FormData');
        } else {
            console.log('❌ No image file to add');
        }
        
        // Debug: Log form data
        console.log('=== SENDING FORMDATA TO /api/book/' + isbn + ' ===');
        console.log('FormData contents:');
        for (var pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[1] instanceof File ? '[FILE: ' + pair[1].name + ']' : pair[1]));
        }
        
        // Log detailed FormData information
        console.log('=== FORMDATA DETAILS (UPDATE) ===');
        console.log('FormData constructor:', formData.constructor.name);
        console.log('FormData entries count:', Array.from(formData.entries()).length);
        
        // Log each field separately
        console.log('=== FIELD BY FIELD (UPDATE) ===');
        console.log('isbn:', formData.get('isbn'));
        console.log('title:', formData.get('title'));
        console.log('categoryId:', formData.get('categoryId'));
        console.log('publisherId:', formData.get('publisherId'));
        console.log('unitPrice:', formData.get('unitPrice'));
        console.log('publishYear:', formData.get('publishYear'));
        console.log('pageCount:', formData.get('pageCount'));
        console.log('stock:', formData.get('stock'));
        console.log('authorIds:', formData.get('authorIds'));
        
        var imageFile = formData.get('imageFile');
        if (imageFile) {
            console.log('imageFile:', {
                name: imageFile.name,
                size: imageFile.size,
                type: imageFile.type,
                lastModified: imageFile.lastModified,
                constructor: imageFile.constructor.name
            });
        } else {
            console.log('imageFile: null');
        }
        
        // Use fetch API for FormData to ensure proper multipart/form-data
        var token = AuthService.getToken();
        
        console.log('=== SENDING FETCH REQUEST (UPDATE) ===');
        console.log('URL:', baseUrl + '/book/' + isbn);
        console.log('Method: PUT');
        console.log('Headers:', { 'Authorization': 'Bearer ' + token });
        console.log('Body type:', formData.constructor.name);
        
        // Log raw FormData as string (for debugging)
        console.log('=== RAW FORMDATA DEBUG (UPDATE) ===');
        try {
            // Try to log FormData as string representation
            var formDataString = '';
            for (var pair of formData.entries()) {
                if (pair[1] instanceof File) {
                    formDataString += pair[0] + ': [FILE] ' + pair[1].name + ' (' + pair[1].size + ' bytes)\n';
                } else {
                    formDataString += pair[0] + ': ' + pair[1] + '\n';
                }
            }
            console.log('FormData as string:\n' + formDataString);
        } catch (e) {
            console.log('Cannot convert FormData to string:', e.message);
        }
        
        return fetch(baseUrl + '/book/' + isbn, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token
                // Don't set Content-Type - browser will set it automatically
            },
            body: formData
        })
        .then(function(response) {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                return response.json().then(function(errorData) {
                    console.error('Error response:', errorData);
                    throw new Error(errorData.message || 'Request failed');
                });
            }
            return response.json();
        })
        .then(function(data) {
            console.log('Success response:', data);
            return { data: data };
        })
        .catch(function(error) {
            console.error('Fetch error:', error);
            throw { data: { message: error.message } };
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

    // ==================== BOOK APIs (NEW) ====================
    
    // Tìm kiếm sách với các filter
    this.searchBooks = function(params) {
        var queryParams = {
            searchTerm: params.searchTerm || '',
            categoryId: params.categoryId || '',
            minPrice: params.minPrice || '',
            maxPrice: params.maxPrice || '',
            sortBy: params.sortBy || 'title',
            sortDirection: params.sortDirection || 'asc',
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/book/search',
            params: queryParams
        });
    };

    // Sách có khuyến mãi
    this.getPromotionBooks = function(limit) {
        var queryParams = { limit: Math.min(Math.max(parseInt(limit) || 10, 1), 50) };
        return $http({
            method: 'GET',
            url: baseUrl + '/book/promotions',
            params: queryParams
        });
    };

    // Sách bán chạy nhất
    this.getBestsellerBooks = function(limit) {
        var queryParams = { limit: Math.min(Math.max(parseInt(limit) || 10, 1), 50) };
        return $http({
            method: 'GET',
            url: baseUrl + '/book/bestsellers',
            params: queryParams
        });
    };

    // Sách mới nhất
    this.getLatestBooks = function(limit) {
        var queryParams = { limit: Math.min(Math.max(parseInt(limit) || 10, 1), 50) };
        return $http({
            method: 'GET',
            url: baseUrl + '/book/latest',
            params: queryParams
        });
    };

    // Chi tiết sách theo ISBN
    this.getBookDetail = function(isbn) {
        return $http({
            method: 'GET',
            url: baseUrl + '/book/' + encodeURIComponent(isbn)
        });
    };

    // Danh sách tác giả
    this.getBookAuthors = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/book/authors'
        });
    };

    // Sách theo nhà xuất bản
    this.getBooksByPublisherId = function(publisherId, params) {
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            searchTerm: params.searchTerm || ''
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/book/by-publisher/' + publisherId,
            params: queryParams
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

    // ==================== PROMOTION APIs ====================
    
    // Lấy danh sách khuyến mãi
    this.getPromotions = function(params) {
        params = params || {};
        // Backend requires SortBy and SortOrder; provide sensible defaults when missing
        var sortBy = params.SortBy || params.sortBy || 'StartDate';
        var sortOrder = params.SortOrder || params.sortOrder || 'DESC';
        var queryParams = {
            Name: params.Name || params.name || '',
            MinDiscountPct: params.MinDiscountPct || params.minDiscountPct || '',
            MaxDiscountPct: params.MaxDiscountPct || params.maxDiscountPct || '',
            StartDate: params.StartDate || params.startDate || '',
            EndDate: params.EndDate || params.endDate || '',
            Status: params.Status || params.status || 'all',
            IssuedBy: params.IssuedBy || params.issuedBy || '',
            BookIsbn: params.BookIsbn || params.bookIsbn || '',
            Page: params.Page || params.pageNumber || 1,
            PageSize: params.PageSize || params.pageSize || 10,
            SortBy: sortBy,
            SortOrder: sortOrder
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/promotion',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy chi tiết khuyến mãi
    this.getPromotionById = function(promotionId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/promotion/' + promotionId,
            headers: getAuthHeaders()
        });
    };

    // Tạo khuyến mãi
    this.createPromotion = function(promotionData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/promotion',
            data: promotionData,
            headers: getAuthHeaders()
        });
    };

    // Cập nhật khuyến mãi
    this.updatePromotion = function(promotionId, promotionData) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/promotion/' + promotionId,
            data: promotionData,
            headers: getAuthHeaders()
        });
    };

    // Xóa khuyến mãi
    this.deletePromotion = function(promotionId) {
        return $http({
            method: 'DELETE',
            url: baseUrl + '/promotion/' + promotionId,
            headers: getAuthHeaders()
        });
    };

    // Thống kê khuyến mãi
    this.getPromotionStats = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/promotion/stats',
            headers: getAuthHeaders()
        });
    };

    // Danh sách sách đang có khuyến mãi (Public)
    this.getActivePromotionBooks = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/promotion/active-books'
        });
    };

    // Danh sách khuyến mãi theo ISBN (Public)
    this.getPromotionsByBook = function(isbn) {
        return $http({
            method: 'GET',
            url: baseUrl + '/promotion/book/' + encodeURIComponent(isbn)
        });
    };

    // ==================== CUSTOMER ORDER APIs ====================

    // Tạo đơn hàng (Customer)
    this.createOrder = function(orderPayload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/order',
            data: orderPayload,
            headers: getAuthHeaders()
        });
    };

    // Lấy danh sách đơn hàng (Admin/Employee)
    this.getOrders = function(params) {
        params = params || {};
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        // Only add non-empty parameters
        if (params.keyword) queryParams.keyword = params.keyword;
        if (params.customerId) queryParams.customerId = params.customerId;
        if (params.status) queryParams.status = params.status;
        if (params.paymentStatus) queryParams.paymentStatus = params.paymentStatus;
        if (params.fromDate) queryParams.fromDate = params.fromDate;
        if (params.toDate) queryParams.toDate = params.toDate;
        return $http({
            method: 'GET',
            url: baseUrl + '/order',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy đơn hàng của khách hàng
    this.getMyOrders = function(params) {
        params = params || {};
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            status: params.status || '',
            fromDate: params.fromDate || '',
            toDate: params.toDate || ''
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/order/my-orders',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy danh sách đơn được phân công cho nhân viên giao hàng (DELIVERY)
    this.getMyAssignedOrders = function(params) {
        params = params || {};
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/order/my-assigned-orders',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy chi tiết đơn hàng
    this.getOrderById = function(orderId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/order/' + orderId,
            headers: getAuthHeaders()
        });
    };

    // Gợi ý nhân viên giao hàng cho đơn
    this.getOrderDeliveryCandidates = function(orderId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/order/' + orderId + '/delivery-candidates',
            headers: getAuthHeaders()
        });
    };

    // Duyệt/Không duyệt đơn
    this.approveOrder = function(orderId, payload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/order/' + orderId + '/approve',
            data: payload,
            headers: getAuthHeaders()
        });
    };

    // Phân công giao hàng
    this.assignOrderDelivery = function(orderId, payload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/order/' + orderId + '/assign-delivery',
            data: payload,
            headers: getAuthHeaders()
        });
    };

    // Xác nhận giao hàng thành công
    this.confirmOrderDelivered = function(orderId, payload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/order/' + orderId + '/confirm-delivered',
            data: payload,
            headers: getAuthHeaders()
        });
    };

    // Hủy đơn hàng
    this.cancelOrder = function(orderId, payload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/order/' + orderId + '/cancel',
            data: payload,
            headers: getAuthHeaders()
        });
    };

    // ==================== PAYMENT APIs ====================
    this.createPaymentLink = function(payload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/payment/create-link',
            data: payload,
            headers: getAuthHeaders()
        });
    };

    // ==================== INVOICE APIs ====================
    // Danh sách hóa đơn (filter, phân trang)
    this.getInvoices = function(params) {
        params = params || {};
        var queryParams = {
            invoiceNumber: params.invoiceNumber || '',
            orderId: params.orderId || '',
            paymentStatus: params.paymentStatus || '',
            fromDate: params.fromDate || '',
            toDate: params.toDate || '',
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/invoice',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Danh sách hóa đơn kèm thông tin đơn hàng
    this.getInvoicesWithOrders = function(params) {
        params = params || {};
        var queryParams = {
            invoiceNumber: params.invoiceNumber || '',
            orderId: params.orderId || '',
            paymentStatus: params.paymentStatus || '',
            fromDate: params.fromDate || '',
            toDate: params.toDate || '',
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/invoice/with-orders',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Trả hàng (Return order)
    this.returnOrder = function(orderId, payload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/order/' + orderId + '/return',
            data: payload || {},
            headers: getAuthHeaders()
        });
    };

    // Lập phiếu trả (API mới)
    this.createReturn = function(returnRequest) {
        return $http({
            method: 'POST',
            url: baseUrl + '/return',
            data: returnRequest,
            headers: getAuthHeaders()
        });
    };

    // ==================== CUSTOMER RETURN APIs ====================

    // Tạo yêu cầu trả hàng cho customer
    this.createCustomerReturn = function(returnRequest) {
        return $http({
            method: 'POST',
            url: baseUrl + '/customer/return',
            data: returnRequest,
            headers: getAuthHeaders()
        });
    };

    // Lấy danh sách yêu cầu trả hàng của customer
    this.getCustomerReturns = function(params) {
        params = params || {};
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            status: params.status || '',
            fromDate: params.fromDate || '',
            toDate: params.toDate || ''
        };
        
        var queryString = Object.keys(queryParams)
            .filter(key => queryParams[key] !== '')
            .map(key => key + '=' + encodeURIComponent(queryParams[key]))
            .join('&');
        
        return $http({
            method: 'GET',
            url: baseUrl + '/customer/return?' + queryString,
            headers: getAuthHeaders()
        });
    };

    // Lấy chi tiết yêu cầu trả hàng của customer
    this.getCustomerReturnDetail = function(returnId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/customer/return/' + returnId,
            headers: getAuthHeaders()
        });
    };

    // Hủy yêu cầu trả hàng của customer
    this.cancelCustomerReturn = function(returnId) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/customer/return/' + returnId + '/cancel',
            headers: getAuthHeaders()
        });
    };

    // ==================== RETURN MANAGEMENT APIs ====================

    // Danh sách phiếu trả (có filter và phân trang)
    this.getReturns = function(params) {
        params = params || {};
        var queryParams = {
            invoiceId: params.invoiceId || '',
            fromDate: params.fromDate || '',
            toDate: params.toDate || '',
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        return $http({
            method: 'GET',
            url: baseUrl + '/return',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Chi tiết phiếu trả
    this.getReturnById = function(returnId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/return/' + returnId,
            headers: getAuthHeaders()
        });
    };

    // Cập nhật trạng thái phiếu trả
    this.updateReturnStatus = function(returnId, data) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/return/' + returnId + '/status',
            headers: getAuthHeaders(),
            data: data
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

    // ==================== RATINGS APIs ====================
    // Get ratings list for an ISBN (public)
    this.getRatings = function(isbn, page, pageSize) {
        var p = Math.max(parseInt(page) || 1, 1);
        var ps = Math.min(Math.max(parseInt(pageSize) || 10, 1), 50);
        return $http({
            method: 'GET',
            url: baseUrl + '/ratings/' + encodeURIComponent(isbn),
            params: { page: p, pageSize: ps }
        });
    };

    // Get ratings stats for an ISBN (public)
    this.getRatingsStats = function(isbn) {
        return $http({
            method: 'GET',
            url: baseUrl + '/ratings/' + encodeURIComponent(isbn) + '/stats'
        });
    };

    // Create or update rating (authorized)
    this.createOrUpdateRating = function(payload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/ratings',
            data: payload,
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
            1: 'CUSTOMER',
            2: 'SALES_EMPLOYEE',
            3: 'ADMIN',
            4: 'DELIVERY_EMPLOYEE'
        };
        return roles[roleId] || 'UNKNOWN';
    };

    // Get role display name by ID
    this.getRoleDisplayName = function(roleId) {
        var roles = {
            1: 'Khách hàng',
            2: 'Nhân viên bán hàng',
            3: 'Quản trị viên',
            4: 'Nhân viên giao hàng'
        };
        return roles[roleId] || 'Không xác định';
    };
    // ==================== PRICE CHANGE APIs ====================
    
    // Lấy danh sách thay đổi giá
    this.getPriceChanges = function(params) {
        var queryParams = {
            isbn: params.isbn || '',
            employeeId: params.employeeId || '',
            fromDate: params.fromDate || '',
            toDate: params.toDate || '',
            isActive: params.isActive || '',
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/pricechange',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Lấy chi tiết thay đổi giá
    this.getPriceChangeDetail = function(priceChangeId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/pricechange/' + priceChangeId,
            headers: getAuthHeaders()
        });
    };

    // Tạo thay đổi giá mới
    this.createPriceChange = function(priceChangeData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/pricechange',
            data: priceChangeData,
            headers: getAuthHeaders()
        });
    };

    // Lấy giá hiện tại của sách (PUBLIC)
    this.getCurrentPrice = function(isbn, asOfDate) {
        var queryParams = {};
        if (asOfDate) {
            queryParams.asOfDate = asOfDate;
        }
        
        return $http({
            method: 'GET',
            url: baseUrl + '/pricechange/current-price/' + isbn,
            params: queryParams
        });
    };

    // Lấy lịch sử giá của sách (PUBLIC)
    this.getPriceHistory = function(isbn) {
        return $http({
            method: 'GET',
            url: baseUrl + '/pricechange/history/' + isbn
        });
    };

    // ==================== ADMIN PRICE CHANGE APIs ====================
    
    // Danh sách thay đổi giá (Admin)
    this.getAdminPriceChanges = function(params) {
        var queryParams = {
            isbn: params.isbn || '',
            page: params.page || 1,
            pageSize: params.pageSize || 20
        };
        
        return $http({
            method: 'GET',
            url: baseUrl + '/admin/price-changes',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    // Tạo thay đổi giá (Admin)
    this.createAdminPriceChange = function(priceChangeData) {
        return $http({
            method: 'POST',
            url: baseUrl + '/admin/price-changes',
            data: priceChangeData,
            headers: getAuthHeaders()
        });
    };

    // Cập nhật thay đổi giá (Admin)
    this.updateAdminPriceChange = function(isbn, changedAt, priceChangeData) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/admin/price-changes/' + isbn + '/' + changedAt,
            data: priceChangeData,
            headers: getAuthHeaders()
        });
    };

    // Xóa thay đổi giá (Admin)
    this.deleteAdminPriceChange = function(isbn, changedAt) {
        return $http({
            method: 'DELETE',
            url: baseUrl + '/admin/price-changes/' + isbn + '/' + changedAt,
            headers: getAuthHeaders()
        });
    };

    // ==================== EMPLOYEE MANAGEMENT APIs ====================
    // Employees
    this.getEmployees = function(params) {
        params = params || {};
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        if (params.searchTerm) queryParams.searchTerm = params.searchTerm;
        if (params.departmentId) queryParams.departmentId = params.departmentId;
        return $http({
            method: 'GET',
            url: baseUrl + '/employee',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    this.getEmployeeById = function(employeeId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/employee/' + employeeId,
            headers: getAuthHeaders()
        });
    };

    this.createEmployeeWithAccount = function(payload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/employee/create-with-account',
            data: payload,
            headers: getAuthHeaders()
        });
    };

    this.updateEmployee = function(employeeId, payload) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/employee/' + employeeId,
            data: payload,
            headers: getAuthHeaders()
        });
    };

    this.deleteEmployee = function(employeeId) {
        return $http({
            method: 'DELETE',
            url: baseUrl + '/employee/' + employeeId,
            headers: getAuthHeaders()
        });
    };

    // Departments
    this.getDepartments = function(params) {
        params = params || {};
        var queryParams = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10
        };
        if (params.searchTerm) queryParams.searchTerm = params.searchTerm;
        return $http({
            method: 'GET',
            url: baseUrl + '/department',
            headers: getAuthHeaders(),
            params: queryParams
        });
    };

    this.getDepartmentById = function(departmentId) {
        return $http({
            method: 'GET',
            url: baseUrl + '/department/' + departmentId,
            headers: getAuthHeaders()
        });
        };

    this.createDepartment = function(payload) {
        return $http({
            method: 'POST',
            url: baseUrl + '/department',
            data: payload,
            headers: getAuthHeaders()
        });
    };

    this.updateDepartment = function(departmentId, payload) {
        return $http({
            method: 'PUT',
            url: baseUrl + '/department/' + departmentId,
            data: payload,
            headers: getAuthHeaders()
        });
    };

    this.deleteDepartment = function(departmentId) {
        return $http({
            method: 'DELETE',
            url: baseUrl + '/department/' + departmentId,
            headers: getAuthHeaders()
        });
    };

    // ==================== CUSTOMER PROFILE APIs ====================

    // Lấy thông tin cá nhân của khách hàng hiện tại
    this.getMyProfile = function() {
        return $http({
            method: 'GET',
            url: baseUrl + '/customer/me',
            headers: getAuthHeaders()
        });
    };

    // Cập nhật thông tin cá nhân của khách hàng hiện tại
    this.updateMyProfile = function(profile) {
        var payload = {
            firstName: (profile.firstName || '').trim(),
            lastName: (profile.lastName || '').trim(),
            gender: profile.gender || 'Other',
            dateOfBirth: profile.dateOfBirth || null,
            address: (profile.address || '').trim(),
            phone: (profile.phone || '').trim(),
            email: (profile.email || '').trim()
        };

        return $http({
            method: 'PUT',
            url: baseUrl + '/customer/me',
            data: payload,
            headers: getAuthHeaders()
        });
    };
}]);
