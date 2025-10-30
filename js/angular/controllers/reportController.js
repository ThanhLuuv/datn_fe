// Revenue Report Controller
app.controller('AdminRevenueReportController', ['$scope', 'BookstoreService', 'AuthService', function($scope, BookstoreService, AuthService) {
	if (!AuthService.isAdminOrTeacher()) {
		return;
	}

	$scope.title = 'Báo cáo doanh thu';
	$scope.mode = 'daily'; // 'daily' | 'monthly' | 'quarterly'
	function formatYMD(date) {
		var y = date.getFullYear();
		var m = ('0' + (date.getMonth() + 1)).slice(-2);
		var d = ('0' + date.getDate()).slice(-2);
		return y + '-' + m + '-' + d;
	}

	var nowInit = new Date();
	var monthStart = new Date(nowInit.getFullYear(), nowInit.getMonth(), 1);
	$scope.filters = {
		fromDate: monthStart,
		toDate: nowInit
	};
	$scope.loading = false;
	$scope.error = null;
	$scope.report = null;
	$scope.chart = null;
	$scope.now = new Date();
	$scope.downloadingPDF = false;

	$scope.toasts = [];
	$scope.addToast = function(variant, message) {
		var id = Date.now() + Math.random();
		$scope.toasts.push({ id: id, variant: variant, message: message });
		setTimeout(function(){
			$scope.$applyAsync(function(){
				$scope.toasts = $scope.toasts.filter(function(t){ return t.id !== id; });
			});
		}, 3000);
	};

	function formatVN(dd) {
		try {
			var d = new Date(dd);
			var day = ('0' + d.getDate()).slice(-2);
			var month = ('0' + (d.getMonth() + 1)).slice(-2);
			return day + '/' + month;
		} catch(e) { return dd; }
	}

	function formatVNDate(dd) {
		return formatVN(dd);
	}

	$scope.setMode = function(mode) {
		if (mode === 'daily' || mode === 'monthly' || mode === 'quarterly') {
			$scope.mode = mode;
			$scope.loadRevenue();
		}
	};

    // Normalize different user-entered date formats to a valid Date object
    function normalizeToDate(value) {
        if (value == null || value === '') return null;
        if (value instanceof Date && !isNaN(value.getTime())) return value;
        if (typeof value === 'number') {
            var fromNumber = new Date(value);
            return isNaN(fromNumber.getTime()) ? null : fromNumber;
        }
        if (typeof value === 'string') {
            var trimmed = value.trim();
            // Try yyyy-MM-dd (browser date input string)
            var ymdMatch = /^\d{4}-\d{2}-\d{2}$/;
            if (ymdMatch.test(trimmed)) {
                var y = parseInt(trimmed.slice(0, 4), 10);
                var m = parseInt(trimmed.slice(5, 7), 10) - 1;
                var d = parseInt(trimmed.slice(8, 10), 10);
                var dt = new Date(y, m, d);
                return isNaN(dt.getTime()) ? null : dt;
            }
            // Try dd/MM/yyyy (common VN typing)
            var dmyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            var m2 = dmyMatch.exec(trimmed);
            if (m2) {
                var dd = parseInt(m2[1], 10);
                var mm = parseInt(m2[2], 10) - 1;
                var yyyy = parseInt(m2[3], 10);
                var dt2 = new Date(yyyy, mm, dd);
                return isNaN(dt2.getTime()) ? null : dt2;
            }
            // Fallback to Date parser
            var parsed = new Date(trimmed);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
    }

	$scope.displayPeriod = function(item) {
		if (!item) return '';
		if ($scope.mode === 'monthly') {
			var y = item.year || item.Year;
			var m = item.month || item.Month;
			if (!y || !m) return '';
			var mm = ('0' + m).slice(-2);
			return mm + '/' + y;
		}
		if ($scope.mode === 'quarterly') {
			var yq = item.year || item.Year;
			var q = item.quarter || item.Quarter;
			if (!yq || !q) return '';
			return 'Q' + q + '/' + yq;
		}
		return formatVNDate(item.day || item.date || item.period);
	};

	function generateDaysInCurrentMonth() {
		var now = new Date();
		var year = now.getFullYear();
		var month = now.getMonth();
		var lastDay = new Date(year, month + 1, 0).getDate();
		var labels = [];
		for (var d = 1; d <= lastDay; d++) {
			labels.push(('0' + d).slice(-2));
		}
		return labels;
	}

	function initMonthlyChart() {
		try {
			var ctx = document.getElementById('revenueChart');
			if (!ctx) return;
			var labels = generateDaysInCurrentMonth();
			var data = labels.map(function(){ return 0; });
			if ($scope.chart) { $scope.chart.destroy(); }
			$scope.chart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: labels,
					datasets: [{
						label: 'Doanh thu (VND)',
						data: data,
						backgroundColor: 'rgba(13,110,253,0.6)'
					}]
				},
				options: {
					responsive: true,
					scales: {
						y: { beginAtZero: true, ticks: { callback: function(value){ try { return new Intl.NumberFormat('vi-VN').format(value); } catch(e){ return value; } } } }
					}
				}
			});
		} catch(e) { console.warn('Chart init error', e); }
	}

function isValidDateObject(d) {
    return d instanceof Date && !isNaN(d.getTime());
}

function validateDateRange(fromDate, toDate) {
    if (!fromDate || !toDate) {
        return 'Vui lòng chọn khoảng thời gian.';
    }
    if (!isValidDateObject(fromDate) || !isValidDateObject(toDate)) {
        return 'Định dạng ngày không hợp lệ. Vui lòng chọn lại.';
    }
    if (fromDate.getTime() > toDate.getTime()) {
        return 'Khoảng thời gian không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.';
    }
    return null;
}

	$scope.loadRevenue = function() {
		// Coerce potential string inputs to Date objects before validating
		var normalizedFrom = normalizeToDate($scope.filters.fromDate);
		var normalizedTo = normalizeToDate($scope.filters.toDate);
		var validationError = validateDateRange(normalizedFrom, normalizedTo);
		if (validationError) {
			$scope.error = validationError;
			$scope.addToast('danger', validationError);
			return;
		}
		// Persist normalized dates back to model for consistent rendering
		$scope.filters.fromDate = normalizedFrom;
		$scope.filters.toDate = normalizedTo;
		$scope.loading = true;
		$scope.error = null;
		$scope.report = null;
	var params = { fromDate: formatYMD(normalizedFrom), toDate: formatYMD(normalizedTo) };
	var apiCall;
	if ($scope.mode === 'monthly') {
		apiCall = BookstoreService.getRevenueReportMonthly(params);
	} else if ($scope.mode === 'quarterly') {
		apiCall = BookstoreService.getRevenueReportQuarterly(params);
	} else {
		apiCall = BookstoreService.getRevenueReport(params);
	}
		apiCall.then(function(res){
			var data = res && res.data ? res.data : null;
			if (data && data.success && data.data) {
				$scope.report = data.data;
			} else {
				$scope.report = data && data.revenue ? data : data; // fallback to raw
			}
			$scope.addToast('success', 'Đã tải báo cáo doanh thu.');
			// update chart if series available
			if ($scope.chart && $scope.report && Array.isArray($scope.report.items)) {
				$scope.chart.data.labels = $scope.report.items.map(function(i){ return $scope.displayPeriod(i); });
				$scope.chart.data.datasets[0].data = $scope.report.items.map(function(i){ return Number(i.revenue || i.totalRevenue || 0); });
				$scope.chart.update();
			}
		}).catch(function(err){
			$scope.error = err && (err.data && err.data.message) ? err.data.message : 'Không thể tải báo cáo doanh thu.';
			$scope.addToast('danger', $scope.error);
		}).finally(function(){
			$scope.loading = false;
		});
	};

	$scope.formatCurrency = function(amount) {
		try {
			return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
		} catch(e) { return amount; }
	};

	// Download PDF report
	$scope.downloadPDF = function() {
		if (!$scope.report || !$scope.report.items || $scope.report.items.length === 0) {
			$scope.addToast('danger', 'Không có dữ liệu để tải');
			return;
		}

		$scope.downloadingPDF = true;
		
		try {
			// Create HTML content for PDF
			var htmlContent = generateRevenuePDFContent();
			
			// Create blob and download
			var blob = new Blob([htmlContent], { type: 'text/html' });
			var url = URL.createObjectURL(blob);
			
			// Create download link
			var link = document.createElement('a');
			link.href = url;
			link.download = 'bao-cao-doanh-thu-' + formatYMD($scope.filters.fromDate) + '-to-' + formatYMD($scope.filters.toDate) + '.html';
			
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

	// Generate PDF content for revenue report
	function generateRevenuePDFContent() {
		var fromDate = new Date($scope.filters.fromDate).toLocaleDateString('vi-VN');
		var toDate = new Date($scope.filters.toDate).toLocaleDateString('vi-VN');
		var currentDate = new Date().toLocaleDateString('vi-VN');
		var currentTime = new Date().toLocaleTimeString('vi-VN');
		var modeText = $scope.mode === 'daily' ? 'Theo ngày' : ($scope.mode === 'monthly' ? 'Theo tháng' : 'Theo quý');
		
		var html = '<!DOCTYPE html>';
		html += '<html><head>';
		html += '<meta charset="UTF-8">';
		html += '<title>Báo cáo doanh thu - ' + fromDate + ' đến ' + toDate + '</title>';
		html += '<style>';
		html += 'body { font-family: Arial, sans-serif; margin: 20px; color: #000; }';
		html += 'h1 { text-align: center; margin-bottom: 30px; font-size: 24px; }';
		html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
		html += 'th, td { border: 1px solid #000; padding: 8px; text-align: left; }';
		html += 'th { background-color: #f5f5f5; font-weight: bold; }';
		html += '.header-info { margin-bottom: 20px; }';
		html += '.summary { margin-bottom: 20px; padding: 15px; border: 1px solid #000; }';
		html += '.footer { margin-top: 30px; font-size: 12px; }';
		html += '.text-right { text-align: right; }';
		html += '.text-center { text-align: center; }';
		html += '</style></head><body>';
		
		// Header
		html += '<h1>BÁO CÁO DOANH THU</h1>';
		html += '<div class="header-info">';
		html += '<div><strong>Khoảng thời gian:</strong> ' + fromDate + ' - ' + toDate + '</div>';
		html += '<div><strong>Chế độ:</strong> ' + modeText + '</div>';
		html += '<div><strong>Ngày tạo:</strong> ' + currentDate + ' ' + currentTime + '</div>';
		html += '</div>';
		
		// Summary
		html += '<div class="summary">';
		html += '<div><strong>Tổng doanh thu:</strong> ' + $scope.formatCurrency($scope.report.totalRevenue || 0) + '</div>';
		html += '<div><strong>Số lượng bản ghi:</strong> ' + ($scope.report.items ? $scope.report.items.length : 0) + '</div>';
		html += '</div>';
		
		// Table
		html += '<table>';
		html += '<thead>';
		html += '<tr>';
		html += '<th class="text-center">Thời gian</th>';
		html += '<th class="text-right">Doanh thu</th>';
		html += '</tr>';
		html += '</thead>';
		html += '<tbody>';
		
		if ($scope.report.items && $scope.report.items.length > 0) {
			$scope.report.items.forEach(function(item) {
				html += '<tr>';
				html += '<td>' + $scope.displayPeriod(item) + '</td>';
				html += '<td class="text-right">' + $scope.formatCurrency(item.revenue || item.totalRevenue || 0) + '</td>';
				html += '</tr>';
			});
		}
		
		html += '</tbody>';
		html += '</table>';
		
		// Footer
		html += '<div class="footer">';
		html += '<div><strong>Ghi chú:</strong> Báo cáo doanh thu được tính toán dựa trên khoảng thời gian từ ' + fromDate + ' đến ' + toDate + '</div>';
		html += '<div><strong>Đơn vị:</strong> Doanh thu tính theo VND</div>';
		html += '<div class="text-right">Hệ thống quản lý nhà sách - ' + currentDate + ' ' + currentTime + '</div>';
		html += '</div>';
		
		html += '</body></html>';
		
		return html;
	}

	// Initialize chart then auto-load current month revenue
	setTimeout(function(){
		initMonthlyChart();
		$scope.loadRevenue();
	}, 0);
}]);


