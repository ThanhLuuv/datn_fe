// Admin Inventory Report Controller
app.controller('AdminInventoryReportController', ['$scope', 'BookstoreService', 'AuthService', '$location', function($scope, BookstoreService, AuthService, $location) {
    // Check if user has admin access
    if (!AuthService.isAdminOrTeacher()) {
        console.log('Access denied: User does not have admin or teacher role');
        $location.path('/home');
        return;
    }

    // Initialize scope variables
    $scope.reportDate = '';
    $scope.inventoryData = null;
    $scope.loading = false;
    $scope.error = null;
    $scope.success = null;

    // Set default date to today
    var today = new Date();
    $scope.reportDate = today.toISOString().split('T')[0];

    // Load inventory report
    $scope.loadInventoryReport = function() {
        if (!$scope.reportDate) {
            $scope.error = 'Vui lòng chọn ngày báo cáo';
            return;
        }

        $scope.loading = true;
        $scope.error = null;
        $scope.success = null;

        BookstoreService.getInventoryReport($scope.reportDate)
            .then(function(response) {
                if (response.data && response.data.success) {
                    $scope.inventoryData = response.data.data;
                    $scope.success = 'Tải báo cáo tồn kho thành công';
                } else {
                    $scope.error = response.data.message || 'Có lỗi xảy ra khi tải báo cáo';
                }
            })
            .catch(function(error) {
                console.error('Error loading inventory report:', error);
                $scope.error = 'Có lỗi xảy ra khi tải báo cáo tồn kho';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    // Export to Excel
    $scope.exportToExcel = function() {
        if (!$scope.inventoryData || !$scope.inventoryData.items || $scope.inventoryData.items.length === 0) {
            $scope.error = 'Không có dữ liệu để xuất';
            return;
        }

        // Create CSV content
        var csvContent = 'Danh mục,ISBN,Tên sách,Số lượng tồn kho,Giá trung bình\n';
        
        $scope.inventoryData.items.forEach(function(item) {
            csvContent += '"' + item.category + '","' + item.isbn + '","' + item.title + '",' + item.quantityOnHand + ',' + item.averagePrice + '\n';
        });

        // Create and download file
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'bao-cao-ton-kho-' + $scope.reportDate + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        $scope.success = 'Xuất file thành công';
    };

    // Print report
    $scope.printReport = function() {
        if (!$scope.inventoryData || !$scope.inventoryData.items || $scope.inventoryData.items.length === 0) {
            $scope.error = 'Không có dữ liệu để in';
            return;
        }

        var printWindow = window.open('', '_blank');
        var printContent = '<html><head><title>Báo cáo tồn kho - ' + $scope.reportDate + '</title>';
        printContent += '<style>body{font-family:Arial,sans-serif;margin:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#f2f2f2;}</style></head><body>';
        printContent += '<h1>Báo cáo tồn kho ngày ' + $scope.reportDate + '</h1>';
        printContent += '<table><thead><tr><th>Danh mục</th><th>ISBN</th><th>Tên sách</th><th>Số lượng tồn kho</th><th>Giá trung bình</th></tr></thead><tbody>';
        
        $scope.inventoryData.items.forEach(function(item) {
            printContent += '<tr><td>' + item.category + '</td><td>' + item.isbn + '</td><td>' + item.title + '</td><td>' + item.quantityOnHand + '</td><td>' + formatCurrency(item.averagePrice) + '</td></tr>';
        });
        
        printContent += '</tbody></table></body></html>';
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    // Format currency helper
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Clear messages
    $scope.clearError = function() {
        $scope.error = null;
    };

    $scope.clearSuccess = function() {
        $scope.success = null;
    };

    // Load report on page load
    $scope.loadInventoryReport();
}]);
