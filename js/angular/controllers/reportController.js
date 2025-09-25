// Revenue Report Controller
app.controller('AdminRevenueReportController', ['$scope', 'BookstoreService', 'AuthService', function($scope, BookstoreService, AuthService) {
	if (!AuthService.isAdminOrTeacher()) {
		return;
	}

	$scope.title = 'Báo cáo doanh thu';
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

	$scope.loadRevenue = function() {
		if (!$scope.filters.fromDate || !$scope.filters.toDate) {
			$scope.error = 'Vui lòng chọn khoảng thời gian.';
			return;
		}
		$scope.loading = true;
		$scope.error = null;
		$scope.report = null;
		BookstoreService.getRevenueReport({
			fromDate: $scope.filters.fromDate,
			toDate: $scope.filters.toDate
		}).then(function(res){
			var data = res && res.data ? res.data : null;
			if (data && data.success && data.data) {
				$scope.report = data.data;
			} else {
				$scope.report = data && data.revenue ? data : data; // fallback to raw
			}
			$scope.addToast('success', 'Đã tải báo cáo doanh thu.');
			// update chart if series available
			if ($scope.chart && $scope.report && Array.isArray($scope.report.items)) {
				$scope.chart.data.labels = $scope.report.items.map(function(i){ return formatVN(i.day || i.date || i.period); });
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


