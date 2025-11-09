app.controller('AdminEmployeesController', ['$scope', 'BookstoreService', 'AuthService', function($scope, BookstoreService, AuthService) {
    $scope.title = 'Quản lý nhân viên & phòng ban';
    $scope.BookstoreService = BookstoreService;

    // Employees state
    $scope.employees = [];
    $scope.empPage = { pageNumber: 1, pageSize: 10, totalCount: 0, searchTerm: '', departmentId: '' };

    // Departments state
    $scope.departments = [];
    $scope.depPage = { pageNumber: 1, pageSize: 10, totalCount: 0, searchTerm: '' };

    // Roles mapping (the DB order is: 1 CUSTOMER, 2 SALES_EMPLOYEE, 3 ADMIN, 4 DELIVERY_EMPLOYEE)
    $scope.roleMap = { 1: 'CUSTOMER', 2: 'SALES_EMPLOYEE', 3: 'ADMIN', 4: 'DELIVERY_EMPLOYEE' };
    $scope.roleDisplayMap = {
        'CUSTOMER': 'Khách hàng',
        'SALES_EMPLOYEE': 'Nhân viên bán hàng',
        'ADMIN': 'Quản trị viên',
        'DELIVERY_EMPLOYEE': 'Nhân viên giao hàng'
    };
    // Available roles to create employee (exclude CUSTOMER)
    $scope.roles = [
        { id: 3, name: 'ADMIN', display: $scope.roleDisplayMap['ADMIN'] },
        { id: 2, name: 'SALES_EMPLOYEE', display: $scope.roleDisplayMap['SALES_EMPLOYEE'] },
        { id: 4, name: 'DELIVERY_EMPLOYEE', display: $scope.roleDisplayMap['DELIVERY_EMPLOYEE'] }
    ];

    // Create employee form
    $scope.newEmployee = {
        accountEmail: '',
        password: '',
        roleId: 2,
        isActive: true,
        departmentId: '',
        firstName: '',
        lastName: '',
        gender: 'Other',
        dateOfBirth: '',
        address: '',
        phone: '',
        employeeEmail: ''
    };

    $scope.getRoleName = function(roleId){
        return $scope.roleMap[roleId] || '';
    };
    $scope.getRoleDisplay = function(roleId){
        var key = $scope.getRoleName(roleId);
        return $scope.roleDisplayMap[key] || key || '';
    };

    // Create department form
    $scope.newDepartment = { name: '', description: '' };

    $scope.loading = false;

    // Load employees
    $scope.loadEmployees = function() {
        $scope.loading = true;
        BookstoreService.getEmployees({
            pageNumber: $scope.empPage.pageNumber,
            pageSize: $scope.empPage.pageSize,
            searchTerm: $scope.empPage.searchTerm,
            departmentId: $scope.empPage.departmentId
        }).then(function(resp) {
            if (resp.data && resp.data.success) {
                $scope.employees = resp.data.data.employees || [];
                $scope.empPage.totalCount = resp.data.data.totalCount || 0;
            } else {
                $scope.employees = [];
                $scope.empPage.totalCount = 0;
            }
        }).catch(function(err) {
            console.error('Load employees error', err);
            $scope.employees = [];
            $scope.empPage.totalCount = 0;
        }).finally(function() { $scope.loading = false; });
    };

    // Load departments
    $scope.loadDepartments = function() {
        BookstoreService.getDepartments({
            pageNumber: $scope.depPage.pageNumber,
            pageSize: 100, // load many for dropdown
            searchTerm: ''
        }).then(function(resp) {
            if (resp.data && resp.data.success) {
                $scope.departments = resp.data.data.departments || [];
                $scope.depPage.totalCount = resp.data.data.totalCount || 0;
            } else {
                $scope.departments = [];
                $scope.depPage.totalCount = 0;
            }
        }).catch(function(err) {
            console.error('Load departments error', err);
            $scope.departments = [];
            $scope.depPage.totalCount = 0;
        });
    };

    // Create employee with account
    $scope.createEmployee = function() {
        if (!$scope.newEmployee.accountEmail || !$scope.newEmployee.password || !$scope.newEmployee.firstName || !$scope.newEmployee.lastName || !$scope.newEmployee.departmentId) {
            alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
            return;
        }
        var payload = Object.assign({}, $scope.newEmployee);
        if (payload.dateOfBirth instanceof Date) {
            payload.dateOfBirth = payload.dateOfBirth.toISOString();
        }
        $scope.loading = true;
        BookstoreService.createEmployeeWithAccount(payload).then(function(resp) {
            if (resp.data && resp.data.success) {
                alert('Tạo nhân viên thành công');
                $scope.newEmployee = { accountEmail: '', password: '', roleId: 2, isActive: true, departmentId: '', firstName: '', lastName: '', gender: 'Other', dateOfBirth: '', address: '', phone: '', employeeEmail: '' };
                $scope.loadEmployees();
            } else {
                alert(resp.data && resp.data.message ? resp.data.message : 'Không thể tạo nhân viên');
            }
        }).catch(function(err) {
            alert('Lỗi tạo nhân viên');
            console.error(err);
        }).finally(function(){ $scope.loading = false; });
    };

    // Delete employee
    $scope.deleteEmployee = function(emp) {
        if (!confirm('Xác nhận xóa nhân viên ' + emp.firstName + ' ' + emp.lastName + '?')) return;
        BookstoreService.deleteEmployee(emp.employeeId).then(function(resp) {
            if (resp.data && resp.data.success) {
                $scope.loadEmployees();
            } else {
                alert('Không thể xóa nhân viên');
            }
        }).catch(function(err){ console.error(err); alert('Lỗi xóa nhân viên'); });
    };

    // Create department
    $scope.createDepartment = function() {
        if (!$scope.newDepartment.name) { alert('Vui lòng nhập tên phòng ban'); return; }
        BookstoreService.createDepartment($scope.newDepartment).then(function(resp){
            if (resp.data && resp.data.success) {
                alert('Tạo phòng ban thành công');
                $scope.newDepartment = { name: '', description: '' };
                $scope.loadDepartments();
            } else {
                alert(resp.data && resp.data.message ? resp.data.message : 'Không thể tạo phòng ban');
            }
        }).catch(function(err){ console.error(err); alert('Lỗi tạo phòng ban'); });
    };

    // Delete department
    $scope.deleteDepartment = function(dep) {
        if (!confirm('Xác nhận xóa phòng ban ' + dep.name + '?')) return;
        BookstoreService.deleteDepartment(dep.departmentId).then(function(resp){
            if (resp.data && resp.data.success) {
                $scope.loadDepartments();
            } else {
                alert(resp.data && resp.data.message ? resp.data.message : 'Không thể xóa phòng ban');
            }
        }).catch(function(err){ console.error(err); alert('Lỗi xóa phòng ban'); });
    };

    // Init
    $scope.init = function() {
        if (!AuthService.isAdmin()) return;
        $scope.loadDepartments();
        $scope.loadEmployees();
    };

    $scope.init();
}]);


