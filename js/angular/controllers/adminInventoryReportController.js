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
    $scope.groupedInventoryData = null;
    $scope.loading = false;
    $scope.error = null;
    $scope.success = null;
    $scope.now = new Date();
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.downloadingPDF = false;
    $scope.toasts = [];

    // Set default date to today
    var today = new Date();
    $scope.reportDate = today.toISOString().split('T')[0];

    // Gộp dữ liệu theo thể loại
    $scope.groupInventoryByCategory = function(items) {
        if (!items || !Array.isArray(items)) return [];
        
        var grouped = {};
        
        // Nhóm các item theo thể loại
        items.forEach(function(item) {
            var category = item.category || 'Không phân loại';
            if (!grouped[category]) {
                grouped[category] = {
                    category: category,
                    items: [],
                    totalQuantity: 0,
                    totalValue: 0,
                    averagePrice: 0
                };
            }
            
            grouped[category].items.push(item);
            grouped[category].totalQuantity += item.quantityOnHand || 0;
            grouped[category].totalValue += (item.quantityOnHand || 0) * (item.averagePrice || 0);
        });
        
        // Tính giá trung bình cho mỗi thể loại
        Object.keys(grouped).forEach(function(category) {
            var group = grouped[category];
            if (group.items.length > 0) {
                var totalPrice = group.items.reduce(function(sum, item) {
                    return sum + (item.averagePrice || 0);
                }, 0);
                group.averagePrice = totalPrice / group.items.length;
            }
        });
        
        // Chuyển đổi thành mảng và sắp xếp theo tên thể loại
        return Object.keys(grouped).map(function(category) {
            return grouped[category];
        }).sort(function(a, b) {
            return a.category.localeCompare(b.category);
        });
    };

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
                    // Gộp dữ liệu theo thể loại
                    $scope.groupedInventoryData = $scope.groupInventoryByCategory($scope.inventoryData.items);
                    $scope.addToast('success', 'Tải báo cáo tồn kho thành công');
                } else {
                    $scope.addToast('danger', response.data.message || 'Có lỗi xảy ra khi tải báo cáo');
                }
            })
            .catch(function(error) {
                console.error('Error loading inventory report:', error);
                $scope.addToast('danger', 'Có lỗi xảy ra khi tải báo cáo tồn kho');
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    // Export to Excel
    $scope.exportToExcel = function() {
        if (!$scope.inventoryData || !$scope.inventoryData.items || $scope.inventoryData.items.length === 0) {
            $scope.addToast('danger', 'Không có dữ liệu để xuất');
            return;
        }

        // Create CSV content
        var csvContent = 'Thể loại,ISBN,Tên sách,Số lượng tồn kho,Giá trung bình\n';
        
        $scope.groupedInventoryData.forEach(function(group) {
            group.items.forEach(function(item) {
                csvContent += '"' + group.category + '","' + item.isbn + '","' + item.title + '",' + item.quantityOnHand + ',' + item.averagePrice + '\n';
            });
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
        
        $scope.addToast('success', 'Xuất file thành công');
    };

    // Download PDF report
    $scope.downloadPDF = function() {
        if (!$scope.inventoryData || !$scope.inventoryData.items || $scope.inventoryData.items.length === 0) {
            $scope.addToast('danger', 'Không có dữ liệu để tải');
            return;
        }

        $scope.downloadingPDF = true;
        
        try {
            // Create HTML content for PDF
            var htmlContent = generatePDFContent();
            
            // Create blob and download
            var blob = new Blob([htmlContent], { type: 'text/html' });
            var url = URL.createObjectURL(blob);
            
            // Create download link
            var link = document.createElement('a');
            link.href = url;
            link.download = 'bao-cao-ton-kho-' + $scope.reportDate + '.html';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup
            URL.revokeObjectURL(url);
            
            $scope.addToast('success', 'Tải báo cáo thành công');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            $scope.addToast('danger', 'Có lỗi xảy ra khi tải báo cáo');
        } finally {
            $scope.downloadingPDF = false;
        }
    };

    // Generate PDF content
    function generatePDFContent() {
        var reportDate = new Date($scope.reportDate).toLocaleDateString('vi-VN');
        var currentDate = new Date().toLocaleDateString('vi-VN');
        var currentTime = new Date().toLocaleTimeString('vi-VN');
        
        var html = '<!DOCTYPE html>';
        html += '<html><head>';
        html += '<meta charset="UTF-8">';
        html += '<title>Báo cáo tồn kho - ' + reportDate + '</title>';
        html += '<style>';
        html += 'body { font-family: Arial, sans-serif; margin: 20px; color: #000; }';
        html += 'h1 { text-align: center; margin-bottom: 30px; font-size: 24px; }';
        html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
        html += 'th, td { border: 1px solid #000; padding: 8px; text-align: left; }';
        html += 'th { background-color: #f5f5f5; font-weight: bold; }';
        html += '.header-info { margin-bottom: 20px; }';
        html += '.footer { margin-top: 30px; font-size: 12px; }';
        html += '.text-right { text-align: right; }';
        html += '.text-center { text-align: center; }';
        html += '</style></head><body>';
        
        // Header
        html += '<h1>BÁO CÁO TỒN KHO</h1>';
        html += '<div class="header-info">';
        html += '<div><strong>Ngày báo cáo:</strong> ' + reportDate + '</div>';
        html += '<div><strong>Ngày tạo:</strong> ' + currentDate + ' ' + currentTime + '</div>';
        html += '<div><strong>Người tạo:</strong> ' + ($scope.currentUser && $scope.currentUser.email || 'N/A') + '</div>';
        html += '<div><strong>Tổng giá trị:</strong> ' + formatCurrency($scope.getTotalValue()) + '</div>';
        html += '</div>';
        
        // Table
        html += '<table>';
        html += '<thead>';
        html += '<tr>';
        html += '<th class="text-center">#</th>';
        html += '<th class="text-center">Danh mục</th>';
        html += '<th class="text-center">ISBN</th>';
        html += '<th>Tên sách</th>';
        html += '<th class="text-center">Số lượng tồn kho</th>';
        html += '<th class="text-right">Giá trung bình</th>';
        html += '<th class="text-right">Giá trị tồn kho</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        var itemIndex = 1;
        $scope.groupedInventoryData.forEach(function(group, groupIndex) {
            // Header row for category
            html += '<tr>';
            html += '<td class="text-center" rowspan="' + (group.items.length + 1) + '">' + (groupIndex + 1) + '</td>';
            html += '<td class="text-center" rowspan="' + (group.items.length + 1) + '"><strong>' + group.category + '</strong></td>';
            html += '<td colspan="5" class="text-center bg-light"><strong>Tổng thể loại: ' + group.totalQuantity + ' quyển - ' + formatCurrency(group.totalValue) + '</strong></td>';
            html += '</tr>';
            
            // Items in category
            group.items.forEach(function(item) {
                html += '<tr>';
                html += '<td class="text-center">' + item.isbn + '</td>';
                html += '<td>' + item.title + '</td>';
                html += '<td class="text-center">' + item.quantityOnHand + '</td>';
                html += '<td class="text-right">' + formatCurrency(item.averagePrice) + '</td>';
                html += '<td class="text-right">' + formatCurrency(item.quantityOnHand * item.averagePrice) + '</td>';
                html += '</tr>';
                itemIndex++;
            });
        });
        
        html += '</tbody>';
        html += '<tfoot>';
        html += '<tr>';
        html += '<th colspan="4" class="text-right">TỔNG CỘNG:</th>';
        html += '<th class="text-center">' + $scope.getTotalQuantity() + '</th>';
        html += '<th class="text-right">' + formatCurrency($scope.getAveragePrice()) + '</th>';
        html += '<th class="text-right">' + formatCurrency($scope.getTotalValue()) + '</th>';
        html += '</tr>';
        html += '</tfoot>';
        html += '</table>';
        
        // Footer
        html += '<div class="footer">';
        html += '<div><strong>Ghi chú:</strong> Báo cáo tồn kho được tính toán dựa trên số liệu tại ngày ' + reportDate + '</div>';
        html += '<div><strong>Đơn vị:</strong> Số lượng tính theo quyển, giá trị tính theo đơn vị tiền tệ</div>';
        html += '<div class="text-right">Hệ thống quản lý nhà sách - ' + currentDate + ' ' + currentTime + '</div>';
        html += '</div>';
        
        html += '</body></html>';
        
        return html;
    }

    // Format currency helper - bỏ đơn vị VNĐ và làm tròn
    function formatCurrency(amount) {
        return Math.round(amount || 0).toLocaleString('vi-VN');
    }

    // Helper functions for modal
    $scope.getTotalQuantity = function() {
        if (!$scope.inventoryData || !$scope.inventoryData.items) return 0;
        return $scope.inventoryData.items.reduce(function(total, item) {
            return total + (item.quantityOnHand || 0);
        }, 0);
    };

    $scope.getTotalValue = function() {
        if (!$scope.inventoryData || !$scope.inventoryData.items) return 0;
        return $scope.inventoryData.items.reduce(function(total, item) {
            return total + ((item.quantityOnHand || 0) * (item.averagePrice || 0));
        }, 0);
    };

    $scope.getAveragePrice = function() {
        if (!$scope.inventoryData || !$scope.inventoryData.items || $scope.inventoryData.items.length === 0) return 0;
        var totalPrice = $scope.inventoryData.items.reduce(function(total, item) {
            return total + (item.averagePrice || 0);
        }, 0);
        return totalPrice / $scope.inventoryData.items.length;
    };

    $scope.getQuantityBadgeClass = function(quantity) {
        if (quantity > 10) return 'bg-success';
        if (quantity > 0) return 'bg-warning';
        return 'bg-danger';
    };

    // Clear messages
    $scope.clearError = function() {
        $scope.error = null;
    };

    $scope.clearSuccess = function() {
        $scope.success = null;
    };

    // Toast system
    $scope.addToast = function(variant, message) {
        var id = Date.now() + Math.random();
        $scope.toasts.push({ id: id, variant: variant, message: message });
        setTimeout(function(){
            $scope.$applyAsync(function(){
                $scope.toasts = $scope.toasts.filter(function(t){ return t.id !== id; });
            });
        }, 4000);
    };

    // Load report on page load
    $scope.loadInventoryReport();
}]);

