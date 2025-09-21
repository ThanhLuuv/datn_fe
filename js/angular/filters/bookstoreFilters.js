// Bookstore Filters - Các filter chung cho hệ thống
console.log('Loading Bookstore Filters...');

// Filter format currency
app.filter('currency', function() {
    return function(amount) {
        if (!amount && amount !== 0) return '';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };
});

// Filter format date
app.filter('date', function() {
    return function(dateString) {
        if (!dateString) return '';
        var date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };
});

// Filter format datetime
app.filter('datetime', function() {
    return function(dateString) {
        if (!dateString) return '';
        var date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };
});

// Filter format relative time
app.filter('timeAgo', function() {
    return function(dateString) {
        if (!dateString) return '';
        var date = new Date(dateString);
        var now = new Date();
        var diff = now - date;
        
        var seconds = Math.floor(diff / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        
        if (days > 0) return days + ' ngày trước';
        if (hours > 0) return hours + ' giờ trước';
        if (minutes > 0) return minutes + ' phút trước';
        return 'Vừa xong';
    };
});

// Filter get role name
app.filter('roleName', function() {
    return function(roleId) {
        var roles = {
            1: 'ADMIN',
            2: 'SALES_EMPLOYEE',
            3: 'DELIVERY_EMPLOYEE',
            4: 'CUSTOMER'
        };
        return roles[roleId] || 'UNKNOWN';
    };
});

// Filter get role display name
app.filter('roleDisplayName', function() {
    return function(roleId) {
        var roles = {
            1: 'Quản trị viên',
            2: 'Nhân viên bán hàng',
            3: 'Nhân viên giao hàng',
            4: 'Khách hàng'
        };
        return roles[roleId] || 'Không xác định';
    };
});

// Filter truncate text
app.filter('truncate', function() {
    return function(text, length) {
        if (!text) return '';
        length = length || 50;
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    };
});

// Filter capitalize first letter
app.filter('capitalize', function() {
    return function(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    };
});

// Filter format phone number
app.filter('phone', function() {
    return function(phone) {
        if (!phone) return '';
        var cleaned = phone.replace(/\D/g, '');
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3];
        }
        return phone;
    };
});

// Filter format ISBN
app.filter('isbn', function() {
    return function(isbn) {
        if (!isbn) return '';
        // Remove any non-digit characters except hyphens
        var cleaned = isbn.replace(/[^\d-]/g, '');
        return cleaned;
    };
});

// Filter format book title
app.filter('bookTitle', function() {
    return function(title) {
        if (!title) return '';
        return title.length > 50 ? title.substring(0, 50) + '...' : title;
    };
});

// Filter format author name
app.filter('authorName', function() {
    return function(author) {
        if (!author) return '';
        if (typeof author === 'string') return author;
        if (author.fullName) return author.fullName;
        if (author.firstName && author.lastName) {
            return author.firstName + ' ' + author.lastName;
        }
        return author.firstName || author.lastName || '';
    };
});

// Filter format publisher name
app.filter('publisherName', function() {
    return function(publisher) {
        if (!publisher) return '';
        if (typeof publisher === 'string') return publisher;
        return publisher.name || publisher.publisherName || '';
    };
});

// Filter format category name
app.filter('categoryName', function() {
    return function(category) {
        if (!category) return '';
        if (typeof category === 'string') return category;
        return category.name || category.categoryName || '';
    };
});

// Filter format status
app.filter('status', function() {
    return function(status) {
        if (!status) return '';
        var statusMap = {
            'ACTIVE': 'Hoạt động',
            'INACTIVE': 'Không hoạt động',
            'PENDING': 'Chờ xử lý',
            'APPROVED': 'Đã duyệt',
            'REJECTED': 'Từ chối',
            'COMPLETED': 'Hoàn thành',
            'CANCELLED': 'Đã hủy'
        };
        return statusMap[status] || status;
    };
});

// Filter format gender
app.filter('gender', function() {
    return function(gender) {
        if (!gender) return '';
        var genderMap = {
            'Male': 'Nam',
            'Female': 'Nữ',
            'Other': 'Khác'
        };
        return genderMap[gender] || gender;
    };
});

// Filter format boolean
app.filter('boolean', function() {
    return function(value) {
        if (value === true || value === 'true' || value === 1) return 'Có';
        if (value === false || value === 'false' || value === 0) return 'Không';
        return value;
    };
});

// Filter format file size
app.filter('fileSize', function() {
    return function(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
});

// Filter highlight search term
app.filter('highlight', function($sce) {
    return function(text, search) {
        if (!search) return $sce.trustAsHtml(text);
        var regex = new RegExp('(' + search + ')', 'gi');
        var highlighted = text.replace(regex, '<mark>$1</mark>');
        return $sce.trustAsHtml(highlighted);
    };
});
