// Admin Controller
app.controller('AdminController', ['$scope', 'AuthService', 'APP_CONFIG', '$location', 'BookstoreService', function($scope, AuthService, APP_CONFIG, $location, BookstoreService) {
    // Check if user has admin or teacher access
    if (!AuthService.isAdminOrTeacher()) {
        console.log('Access denied: User does not have admin or teacher role');
        $location.path('/home');
        return;
    }

    $scope.title = 'Admin Dashboard';
    $scope.isDeliveryOnly = AuthService.isDeliveryEmployee() && !AuthService.isAdmin();
    $scope.stats = {
        totalUsers: 0,
        totalBooks: 0,
        todayOrders: 0,
        monthlyRevenue: 0,
        growthRate: 0,
        newUsers: 0,
        soldBooks: 0
    };
    
    $scope.recentActivities = [];
    $scope.latestBooks = [];
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

    function formatYMD(date) {
        var y = date.getFullYear();
        var m = ('0' + (date.getMonth() + 1)).slice(-2);
        var d = ('0' + date.getDate()).slice(-2);
        return y + '-' + m + '-' + d;
    }

    function sumRevenueFromReportPayload(payload) {
        var items = payload && Array.isArray(payload.items) ? payload.items : [];
        var sum = 0;
        for (var i = 0; i < items.length; i++) {
            var val = Number(items[i].revenue || items[i].totalRevenue || 0);
            if (!isNaN(val)) sum += val;
        }
        return sum;
    }

    // Bổ sung biến và hàm cho dashboard báo cáo
    $scope.revenueFilter = { type:'monthly', fromDate:'', toDate:'' };
    $scope.inventoryFilter = { toDate:'' };
    $scope.profitFilter = { fromDate:'', toDate:'' };
    $scope.loadingRevenue = false;
    $scope.loadingInventory = false;
    $scope.revenueChart = null;
    $scope.inventoryChart = null;
    $scope.categoryShare = { total: 0, items: [] };
    $scope.categoryPie = { gradient: '', items: [] };
    $scope.profitReportData = null;
    $scope.revenueReportData = null;
    $scope.inventoryReportData = null;
    $scope.revenueReportTotal = 0;
    $scope.inventoryReportTotal = 0;
    $scope.revenueSummary = null;
    $scope.inventorySummary = null;
    $scope.profitSummary = null;
    $scope.currentUser = AuthService.getCurrentUser ? (AuthService.getCurrentUser()||{}) : {};
    $scope.now = new Date();
    // modal flags for custom dashboard modals
    $scope.showingDashboardReport = false;
    $scope.showingDashboardInventory = false;
    $scope.showingDashboardProfit = false;

    // Resolve reporter display name robustly
    $scope.getReporterName = function(user) {
        var u = user || $scope.currentUser || {};
        var combined = (u.firstName && u.lastName) ? (u.firstName + ' ' + u.lastName) : (u.firstName || u.lastName);
        return (
            u.fullName || u.displayName || u.name || combined || u.email || u.username || '—'
        );
    };

    // Header label for revenue report table based on type
    $scope.getRevenueHeader = function() {
        var t = ($scope.revenueFilter && $scope.revenueFilter.type) ? String($scope.revenueFilter.type).toLowerCase() : 'daily';
        if (t === 'quarterly') return 'Quý/Năm';
        if (t === 'monthly') return 'Tháng/Năm';
        return 'Ngày';
    };

    // Helper: giữ chỉ 1 backdrop khi mở modal
    function ensureSingleBackdrop() {
      try {
        var backs = document.querySelectorAll('.modal-backdrop');
        if (backs && backs.length > 1) {
          // Giữ lại backdrop cuối (mới nhất)
          for (var i = 0; i < backs.length - 1; i++) {
            var el = backs[i];
            if (el && el.parentNode) el.parentNode.removeChild(el);
          }
        }
      } catch(e) { /* no-op */ }
    }

    // Xem báo cáo doanh thu
    $scope.viewRevenueReport = function(openModal) {
      $scope.loadingRevenue = true;
      $scope.revenueReportData = null;
      $scope.revenueChart = null;
      $scope.revenueReportTotal = 0;
      // Chuẩn hóa ngày
      var from = $scope.revenueFilter.fromDate;
      var to = $scope.revenueFilter.toDate;
      if (!from || !to) { $scope.loadingRevenue = false; $scope.addToast('danger','Vui lòng chọn đủ khoảng ngày!'); return; }
      var type = ($scope.revenueFilter.type || 'daily').toLowerCase();
      var apiPromise;
      // Helpers to avoid timezone shift and align to month boundaries
      function toYMDLocal(d){
        if (!(d instanceof Date)) d = new Date(d);
        var y = d.getFullYear();
        var m = ('0'+(d.getMonth()+1)).slice(-2);
        var day = ('0'+d.getDate()).slice(-2);
        return y + '-' + m + '-' + day;
      }
      function monthStart(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
      function monthEnd(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }

      var fromObj = (from instanceof Date) ? new Date(from.getTime()) : new Date(from);
      var toObj = (to instanceof Date) ? new Date(to.getTime()) : new Date(to);
      if (type === 'monthly' || type === 'quarterly') {
        fromObj = monthStart(fromObj);
        toObj = monthEnd(toObj);
      }
      var fromStr = toYMDLocal(fromObj);
      var toStr = toYMDLocal(toObj);

      if (type === 'monthly') {
        apiPromise = BookstoreService.getRevenueReportMonthly({ fromDate: fromStr, toDate: toStr });
      } else if (type === 'quarterly') {
        apiPromise = BookstoreService.getRevenueReportQuarterly({ fromDate: fromStr, toDate: toStr });
      } else {
        apiPromise = BookstoreService.getRevenueReport({ fromDate: fromStr, toDate: toStr });
      }

      apiPromise.then(function(res){
        var data = res && res.data && res.data.data;
        // capture generatedBy if provided by API
        if (data && data.generatedBy) {
          $scope.reportGeneratedBy = data.generatedBy;
        } else {
          $scope.reportGeneratedBy = null;
        }
        // Mapping dữ liệu chart
        function buildRevenueLabel(it){
          if (it.label) return it.label;
          if (it.quarter != null && it.year != null) {
            return  String(it.quarter) + ' / ' + String(it.year);
          }
          if (it.month != null && it.year != null) {
            return String(it.month) + ' / ' + String(it.year);
          }
          if (it.monthYear) return it.monthYear; // e.g. '2025-10'
          if (it.day) {
            try { return toYMDLocal(new Date(it.day)); } catch(e) { return String(it.day); }
          }
          if (it.name) return it.name;
          return '';
        }
        var items = Array.isArray(data.items) ? data.items : data;
        $scope.revenueReportData = items.map(function(it){
          return { label: buildRevenueLabel(it), value: Number(it.revenue || it.totalRevenue || it.value || 0) };
        });
        $scope.revenueReportTotal = $scope.revenueReportData.reduce(function(a,b){return a+Number(b.value||0)},0);
        $scope.revenueSummary = {
          total: $scope.revenueReportTotal,
          count: ($scope.revenueReportData || []).length,
          fromDate: fromStr,
          toDate: toStr,
          type: $scope.revenueFilter.type
        };
        // (Nếu dùng Chart.js thực sẽ attach chart data ở đây)
        $scope.revenueChart = true;
        // Mở modal preview khi người dùng yêu cầu (custom modal)
        if (openModal) {
          $scope.showingDashboardInventory = false;
          $scope.showingDashboardProfit = false;
          $scope.showingDashboardReport = true;
        }
      }).catch(function(e){
        $scope.addToast('danger','Không thể tải báo cáo doanh thu');
      }).finally(function(){ $scope.loadingRevenue = false; $scope.$applyAsync(); });
    };

    // Xem báo cáo tồn kho
    $scope.viewInventoryReport = function(openModal) {
      $scope.loadingInventory = true;
      $scope.inventoryReportData = null;
      $scope.inventoryChart = null;
      $scope.inventoryReportTotal = 0;
      var to = $scope.inventoryFilter.toDate;
      if (!to) { $scope.loadingInventory = false; $scope.addToast('danger','Vui lòng chọn ngày!'); return; }
      // chuẩn hóa yyyy-MM-dd
      if (typeof to === 'string' && to.length > 10) to = to.slice(0,10);
      if (to instanceof Date) {
        var d = to; to = d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
      }
      BookstoreService.getInventoryReport(to).then(function(res){
        var data = res && res.data && res.data.data;
        if (data && data.generatedBy) {
          $scope.reportGeneratedByInventory = data.generatedBy;
        } else {
          $scope.reportGeneratedByInventory = null;
        }
        var items = Array.isArray(data && data.items) ? data.items : [];
        $scope.inventoryReportData = items.map(function(it){
          var qty = Number(it.quantityOnHand != null ? it.quantityOnHand : (it.quantity || it.stock || 0));
          var price = Number(it.averagePrice != null ? it.averagePrice : (it.unitPrice || 0));
          var value = qty * price;
          return {
            isbn: it.isbn || '',
            title: it.title || it.bookTitle || it.name || '',
            category: it.category || '',
            quantityOnHand: qty,
            averagePrice: price,
            value: value
          };
        });
        $scope.inventoryReportTotal = $scope.inventoryReportData.reduce(function(a,b){return a+Number(b.value||0)},0);
        var totalQty = $scope.inventoryReportData.reduce(function(a,b){return a+Number(b.quantityOnHand||0)},0);
        var byCat = {};
        $scope.inventoryReportData.forEach(function(it){
          var key = it.category || 'Khác';
          byCat[key] = (byCat[key]||0) + Number(it.value||0);
        });
        var catArr = Object.keys(byCat).map(function(k){ return { category: k, value: byCat[k] }; }).sort(function(a,b){ return b.value - a.value; });
        var totalVal = $scope.inventoryReportTotal || 1;
        var catPercents = catArr.slice(0,5).map(function(x){ return { category: x.category, percent: Math.round((x.value/totalVal)*1000)/10, value: x.value }; });
        // Build groups for UI rendering
        var groupsMap = {};
        $scope.inventoryReportData.forEach(function(it){
          var cat = it.category || 'Khác';
          if (!groupsMap[cat]) groupsMap[cat] = { category: cat, items: [], subtotal: 0 };
          groupsMap[cat].items.push(it);
          groupsMap[cat].subtotal += Number(it.value||0);
        });
        $scope.inventoryGroups = Object.keys(groupsMap).sort().map(function(k){ return groupsMap[k]; });
        $scope.inventorySummary = {
          totalValue: $scope.inventoryReportTotal,
          totalQuantity: totalQty,
          categories: catPercents
        };
        $scope.inventoryChart = true;
        if (openModal) {
          $scope.showingDashboardReport = false;
          $scope.showingDashboardProfit = false;
          $scope.showingDashboardInventory = true;
        }
      }).catch(function(e){
        $scope.addToast('danger','Không thể tải báo cáo tồn kho');
      }).finally(function(){ $scope.loadingInventory = false; $scope.$applyAsync(); });
    };

    // Xem báo cáo lợi nhuận
    $scope.viewProfitReport = function(openModal) {
      $scope.loadingProfit = true;
      $scope.profitReportData = null;
      $scope.profitSummary = null;
      var f = $scope.profitFilter.fromDate;
      var t = $scope.profitFilter.toDate;
      if (!f || !t) { $scope.loadingProfit = false; $scope.addToast('danger','Vui lòng chọn đủ khoảng ngày!'); return; }
      function toYMD(d){ if (typeof d === 'string') return d.slice(0,10); var dt = (d instanceof Date)? d : new Date(d); return dt.getFullYear()+'-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+('0'+dt.getDate()).slice(-2); }
      var fromStr = toYMD(f), toStr = toYMD(t);
      if (openModal) {
        $scope.showingDashboardReport = false;
        $scope.showingDashboardInventory = false;
        $scope.showingDashboardProfit = true;
      }
      BookstoreService.getProfitReport({ fromDate: fromStr, toDate: toStr })
        .then(function(res){
          var data = res && res.data && res.data.data;
          if (!data) { $scope.addToast('warning','Không có dữ liệu lợi nhuận'); return; }
          // capture generatedBy if provided by API
          if (data && data.generatedBy) {
            $scope.reportGeneratedByProfit = data.generatedBy;
          } else {
            $scope.reportGeneratedByProfit = null;
          }
          $scope.profitReportData = {
            ordersCount: Number(data.ordersCount||0),
            revenue: Number(data.revenue||0),
            cogs: Number(data.costOfGoods||0),
            opex: Number(data.operatingExpenses||0),
            profit: Number(data.profit||0)
          };
          // Always display exactly the user-selected range to avoid timezone shifts
          $scope.profitSummary = {
            fromDate: fromStr,
            toDate: toStr,
            profit: $scope.profitReportData.profit
          };
          // modal đã mở ở trên; chỉ cập nhật dữ liệu
        })
        .catch(function(){ $scope.addToast('danger','Không thể tải báo cáo lợi nhuận'); })
        .finally(function(){ $scope.loadingProfit = false; $scope.$applyAsync(); });
    };

    // Initialize controller
    $scope.init = function() {
        $scope.loadStats();
        $scope.loadLatestBooks();
        // Set default filters to current month and today, then auto-load charts (không mở modal)
        try {
            var now = new Date();
            var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            $scope.revenueFilter.type = 'monthly';
            // Với AngularJS, input type=date bind Date object để hiển thị
            $scope.revenueFilter.fromDate = monthStart;
            $scope.revenueFilter.toDate = now;
            $scope.inventoryFilter.toDate = now;
            $scope.profitFilter.fromDate = monthStart;
            $scope.profitFilter.toDate = now;
            // Defer to next digest to make sure bindings are ready
            setTimeout(function(){
                $scope.viewRevenueReport(false);
                $scope.viewInventoryReport(false);
                $scope.viewProfitReport(false);
                $scope.loadBooksByCategoryShare();
            }, 0);
        } catch(e) { console.warn('Auto-load dashboard reports failed', e); }
    };

    // Load books share by category for pie chart
    $scope.loadBooksByCategoryShare = function() {
      BookstoreService.getBooksByCategoryShare()
        .then(function(res){
          var data = res && res.data && res.data.data;
          if (!data || !Array.isArray(data.items)) { $scope.categoryShare = { total:0, items: [] }; return; }
          var total = Number(data.total || 0);
          var items = data.items.map(function(it){
            return {
              category: it.category || 'Khác',
              count: Number(it.count || 0),
              percent: Number(it.percent || (total ? (it.count*100/total) : 0))
            };
          }).filter(function(x){ return x.count > 0; });
          // sort desc by percent and keep top 8, group the rest as 'Khác'
          items.sort(function(a,b){ return b.percent - a.percent; });
          var top = items.slice(0,8);
          var rest = items.slice(8);
          if (rest.length > 0) {
            var restCount = rest.reduce(function(a,b){ return a + b.count; }, 0);
            var restPercent = rest.reduce(function(a,b){ return a + b.percent; }, 0);
            top.push({ category: 'Khác', count: restCount, percent: Math.round(restPercent*100)/100 });
          }
          // normalize percentages to 100
          var sumPct = top.reduce(function(a,b){ return a + b.percent; }, 0) || 1;
          top = top.map(function(x){ return { category: x.category, count: x.count, percent: Math.round((x.percent*100/sumPct)*100)/100 }; });

          $scope.categoryShare = { total: total, items: top };
          // Build conic-gradient string
          var palette = ['#4f46e5','#22c55e','#f59e0b','#ef4444','#06b6d4','#a855f7','#84cc16','#f97316','#3b82f6','#14b8a6'];
          var accum = 0;
          var segments = [];
          var legend = [];
          for (var i=0;i<top.length;i++) {
            var color = palette[i % palette.length];
            var start = accum;
            var pct = Math.max(0, Math.min(100, Number(top[i].percent)));
            accum = Math.min(100, start + pct);
            segments.push(color + ' ' + start + '% ' + accum + '%');
            legend.push({ color: color, label: top[i].category, percent: pct });
          }
          // fill leftover with transparent if any gap
          if (accum < 100) segments.push('transparent ' + accum + '% 100%');
          $scope.categoryPie = { gradient: segments.join(', '), items: legend };
        })
        .catch(function(){ $scope.categoryShare = { total:0, items: [] }; });
    };

    // ===== Export report to PDF =====
    function ensureHtml2PdfLoaded() {
      return new Promise(function(resolve, reject){
        if (window.html2pdf) return resolve();
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = function(){ resolve(); };
        script.onerror = function(){ reject(new Error('Failed to load html2pdf.js')); };
        document.head.appendChild(script);
      });
    }

    function exportElementToPdf(el, filename){
      return ensureHtml2PdfLoaded().then(function(){
        var opt = {
          margin:       10,
          filename:     filename || 'report.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        return window.html2pdf().set(opt).from(el).save();
      });
    }

    // Fallback (print -> user chooses Save as PDF manually)
    function openPrintWindowWithHtml(html, title) {
      var win = window.open('', '_blank');
      if (!win) { $scope.addToast('danger','Trình duyệt chặn cửa sổ mới'); return; }
      win.document.open();
      win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+ (title||'Report') +'</title>');
      // clone styles from current document
      try {
        var nodes = document.querySelectorAll('link[rel="stylesheet"], style');
        for (var i=0;i<nodes.length;i++) {
          win.document.write(nodes[i].outerHTML);
        }
      } catch(e) {}
      // add print styles
      win.document.write('<style>@page{size:auto;margin:16mm;} body{padding:0 8mm;font-family:inherit;-webkit-print-color-adjust:exact;print-color-adjust:exact;} .modal-header .btn-close,.modal-header .btn{display:none!important;} .dashboard-report-modal,.inventory-report-modal,.profit-report-modal{position:static;transform:none;width:auto;max-width:none;box-shadow:none;} .modal-body{max-height:none;overflow:visible;} .table{width:100%;}</style>');
      win.document.write('</head><body>');
      win.document.write('<div class="print-container">' + html + '</div>');
      win.document.write('</body></html>');
      win.document.close();
      // ensure print after load
      var doPrint = function(){ try { win.focus(); win.print(); } catch(e) {} };
      if (win.document.readyState === 'complete') {
        setTimeout(doPrint, 150);
      } else {
        win.onload = function(){ setTimeout(doPrint, 150); };
      }
    }

    function exportReport(selector, title){
      try {
        var el = document.querySelector(selector);
        if (!el) { $scope.addToast('danger','Không tìm thấy nội dung báo cáo'); return; }
        // Try html2pdf first for auto-download; fallback to print
        exportElementToPdf(el, (title||'report') + '.pdf')
          .catch(function(){ openPrintWindowWithHtml(el.innerHTML, title); });
      } catch(e) {
        $scope.addToast('danger','Không thể xuất PDF');
      }
    }

    $scope.exportRevenuePdf = function(){ exportReport('#revenueReportModal .modal-body', 'Báo cáo doanh thu'); };
    $scope.exportInventoryPdf = function(){ exportReport('#inventoryReportModal .modal-body', 'Báo cáo tồn kho'); };
    $scope.exportProfitPdf = function(){ exportReport('#profitReportModal .modal-body', 'Báo cáo lợi nhuận'); };

    // Load statistics
    $scope.loadStats = function() {
        BookstoreService.getAdminDashboardSummary()
            .then(function(res){
                var data = res && res.data && res.data.data;
                if (data) {
                    var src = (data && data.summary) ? data.summary : data;
                    var totalUsers = src.totalUsers != null ? src.totalUsers : (src.users != null ? src.users : 0);
                    var totalBooks = src.totalBooks != null ? src.totalBooks : (src.totalBook != null ? src.totalBook : (src.booksCount != null ? src.booksCount : (src.books != null ? src.books : 0)));
                    var todayOrders = src.todayOrders != null ? src.todayOrders : (src.ordersToday != null ? src.ordersToday : 0);
                    var monthlyRevenue = src.monthlyRevenue != null ? src.monthlyRevenue : (src.revenueThisMonth != null ? src.revenueThisMonth : (src.totalRevenueThisMonth != null ? src.totalRevenueThisMonth : (src.monthRevenue != null ? src.monthRevenue : 0)));
                    var growthRate = src.growthRate != null ? src.growthRate : (src.growth != null ? src.growth : 0);
                    var newUsers = src.newUsers != null ? src.newUsers : (src.newUsersThisMonth != null ? src.newUsersThisMonth : 0);
                    var soldBooks = src.soldBooks != null ? src.soldBooks : (src.soldBooksThisMonth != null ? src.soldBooksThisMonth : 0);
                    $scope.stats = {
                        totalUsers: Number(totalUsers) || 0,
                        totalBooks: Number(totalBooks) || 0,
                        todayOrders: Number(todayOrders) || 0,
                        monthlyRevenue: Number(monthlyRevenue) || 0,
                        growthRate: Number(growthRate) || 0,
                        newUsers: Number(newUsers) || 0,
                        soldBooks: Number(soldBooks) || 0
                    };
                    $scope.addToast('success', 'Đã tải thống kê tổng quan.');
                }
            })
            .catch(function(err){
                console.error('Summary error:', err);
                $scope.addToast('danger', (err && err.data && err.data.message) || 'Không thể tải thống kê.');
            })
            .finally(function(){
                // Always compute monthly revenue from report API to ensure accuracy
                try {
                    var now = new Date();
                    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    var prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    var prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

                    // Current month revenue
                    BookstoreService.getRevenueReport({ fromDate: formatYMD(monthStart), toDate: formatYMD(now) })
                        .then(function(r){
                            var payload = r && r.data && r.data.data;
                            var currentSum = sumRevenueFromReportPayload(payload);
                            $scope.stats.monthlyRevenue = currentSum;
                            return BookstoreService.getRevenueReport({ fromDate: formatYMD(prevMonthStart), toDate: formatYMD(prevMonthEnd) });
                        })
                        .then(function(prevRes){
                            var prevPayload = prevRes && prevRes.data && prevRes.data.data;
                            var prevSum = sumRevenueFromReportPayload(prevPayload);
                            var cur = Number($scope.stats.monthlyRevenue) || 0;
                            var growth = 0;
                            if (prevSum > 0) {
                                growth = ((cur - prevSum) / prevSum) * 100;
                            } else if (cur > 0) {
                                growth = 100; // from zero to positive => 100%+
                            } else {
                                growth = 0;
                            }
                            // Round to one decimal place
                            $scope.stats.growthRate = Math.round(growth * 10) / 10;
                            return BookstoreService.getAdminTotalUsers();
                        })
                        .then(function(usersRes){
                            var udata = usersRes && usersRes.data && usersRes.data.data;
                            if (udata && udata.totalUsers != null) {
                                $scope.stats.totalUsers = Number(udata.totalUsers) || $scope.stats.totalUsers;
                            }
                            return BookstoreService.getAdminOrdersToday();
                        })
                        .then(function(ordersRes){
                            var odata = ordersRes && ordersRes.data && ordersRes.data.data;
                            if (odata && (odata.totalOrdersToday != null)) {
                                $scope.stats.todayOrders = Number(odata.totalOrdersToday) || $scope.stats.todayOrders;
                            }
                        })
                        .catch(function(e){
                            console.warn('Monthly revenue via report failed', e);
                        });
                } catch(e) { console.warn(e); }
            });
    };

    // (Removed recent activities per request)

    // Load newest books via dedicated API
    $scope.loadLatestBooks = function() {
        BookstoreService.getLatestBooks(10)
            .then(function(response){
                var list = [];
                if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.books)) {
                    list = response.data.data.books;
                } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    list = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    list = response.data;
                }
                $scope.latestBooks = (list || []).slice(0,5);
            })
            .catch(function(error){
                console.error('Newest books error:', error);
                $scope.addToast('danger', 'Không thể tải sách mới nhất.');
            });
    };

    // Test API endpoints
    $scope.testPublicAPI = function() {
        AuthService.testPublic()
            .then(function(response) {
                console.log('Public API test:', response.data);
                showNotification('Public API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Public API test failed:', error);
                showNotification('Public API không hoạt động!', 'danger');
            });
    };

    $scope.testProtectedAPI = function() {
        AuthService.testProtected()
            .then(function(response) {
                console.log('Protected API test:', response.data);
                showNotification('Protected API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Protected API test failed:', error);
                showNotification('Protected API không hoạt động!', 'danger');
            });
    };

    $scope.testAdminAPI = function() {
        AuthService.testAdminOnly()
            .then(function(response) {
                console.log('Admin API test:', response.data);
                showNotification('Admin API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Admin API test failed:', error);
                showNotification('Admin API không hoạt động!', 'danger');
            });
    };

    $scope.testStaffAPI = function() {
        AuthService.testStaffOnly()
            .then(function(response) {
                console.log('Staff API test:', response.data);
                showNotification('Staff API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Staff API test failed:', error);
                showNotification('Staff API không hoạt động!', 'danger');
            });
    };

    // Initialize when controller loads
    $scope.init();
}]);

// Vietnamese number formatting filter (thousands separator by dot)
app.filter('vnNumber', [function() {
  return function(input, fractionSize) {
    var num = Number(input);
    if (isNaN(num)) return input;
    var digits = (typeof fractionSize === 'number') ? fractionSize : 0;
    try {
      return num.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    } catch (e) {
      // Fallback manual formatting
      var parts = num.toFixed(digits).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return parts.join(',');
    }
  };
}]);

