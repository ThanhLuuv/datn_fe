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
		fromDate: formatYMD(monthStart),
		toDate: formatYMD(nowInit)
	};
	$scope.loading = false;
	$scope.error = null;
	$scope.report = null;
	$scope.chart = null;
	$scope.now = new Date();

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

	function isValidYMD(str) {
		if (!str || typeof str !== 'string') return false;
		var re = /^\d{4}-\d{2}-\d{2}$/;
		if (!re.test(str)) return false;
		var d = new Date(str);
		if (isNaN(d.getTime())) return false;
		// Ensure components match (avoid parsing quirks)
		var parts = str.split('-');
		var y = d.getFullYear();
		var m = ('0' + (d.getMonth() + 1)).slice(-2);
		var day = ('0' + d.getDate()).slice(-2);
		return String(y) === parts[0] && m === parts[1] && day === parts[2];
	}

	function validateDateRange(fromDate, toDate) {
		if (!fromDate || !toDate) {
			return 'Vui lòng chọn khoảng thời gian.';
		}
		if (!isValidYMD(fromDate) || !isValidYMD(toDate)) {
			return 'Định dạng ngày không hợp lệ. Vui lòng dùng yyyy-MM-dd.';
		}
		var f = new Date(fromDate);
		var t = new Date(toDate);
		if (f.getTime() > t.getTime()) {
			return 'Khoảng thời gian không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.';
		}
		return null;
	}

	$scope.loadRevenue = function() {
		var validationError = validateDateRange($scope.filters.fromDate, $scope.filters.toDate);
		if (validationError) {
			$scope.error = validationError;
			$scope.addToast('danger', validationError);
			return;
		}
		$scope.loading = true;
		$scope.error = null;
		$scope.report = null;
		var apiCall;
		if ($scope.mode === 'monthly') {
			apiCall = BookstoreService.getRevenueReportMonthly({ fromDate: $scope.filters.fromDate, toDate: $scope.filters.toDate });
		} else if ($scope.mode === 'quarterly') {
			apiCall = BookstoreService.getRevenueReportQuarterly({ fromDate: $scope.filters.fromDate, toDate: $scope.filters.toDate });
		} else {
			apiCall = BookstoreService.getRevenueReport({ fromDate: $scope.filters.fromDate, toDate: $scope.filters.toDate });
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

	// Initialize chart then auto-load current month revenue
	setTimeout(function(){
		initMonthlyChart();
		$scope.loadRevenue();
	}, 0);
}]);


