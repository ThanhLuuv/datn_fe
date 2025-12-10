app.controller('AdminEmployeesController', ['$scope', 'BookstoreService', 'AuthService', '$location', '$timeout', function ($scope, BookstoreService, AuthService, $location, $timeout) {
    // Check if user is admin (only admin can manage employees)
    if (!AuthService.isAdmin()) {
        $location.path('/home');
        return;
    }

    $scope.title = 'Quản lý nhân viên & phòng ban';
    $scope.BookstoreService = BookstoreService;

    // Toast notifications
    $scope.toasts = [];
    $scope.showNotification = function (message, type) {
        var toast = { message: message, variant: type || 'info' };
        $scope.toasts.push(toast);
        $timeout(function () {
            var index = $scope.toasts.indexOf(toast);
            if (index > -1) {
                $scope.toasts.splice(index, 1);
            }
        }, 3000);
    };

    // Employees state
    $scope.employees = [];
    $scope.empPage = { pageNumber: 1, pageSize: 10, totalCount: 0, searchTerm: '', departmentId: '' };
    $scope.isEditMode = false;
    $scope.editingEmployeeId = null;

    // Departments state
    $scope.departments = [];
    $scope.depPage = { pageNumber: 1, pageSize: 10, totalCount: 0, searchTerm: '' };
    $scope.isEditDepMode = false;
    $scope.editingDepartmentId = null;

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

    // Areas state
    $scope.areas = [];

    // Create/Edit employee form
    $scope.defaultEmployee = {
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
        employeeEmail: '',
        areaIds: [],
        selectedAreaId: null
    };
    $scope.newEmployee = angular.copy($scope.defaultEmployee);

    $scope.getRoleName = function (roleId) {
        return $scope.roleMap[roleId] || '';
    };
    $scope.getRoleDisplay = function (roleId) {
        var key = $scope.getRoleName(roleId);
        return $scope.roleDisplayMap[key] || key || '';
    };

    // Create/Edit department form
    $scope.defaultDepartment = { name: '', description: '' };
    $scope.newDepartment = angular.copy($scope.defaultDepartment);

    $scope.loading = false;

    // Delete Confirmation State
    $scope.showDeleteConfirm = false;
    $scope.deleteItemType = ''; // 'employee' or 'department'
    $scope.itemToDelete = null;
    $scope.deleteMessage = '';

    // Load employees
    $scope.loadEmployees = function () {
        $scope.loading = true;
        BookstoreService.getEmployees({
            pageNumber: $scope.empPage.pageNumber,
            pageSize: $scope.empPage.pageSize,
            searchTerm: $scope.empPage.searchTerm,
            departmentId: $scope.empPage.departmentId
        }).then(function (resp) {
            if (resp.data && resp.data.success) {
                $scope.employees = resp.data.data.employees || [];
                $scope.empPage.totalCount = resp.data.data.totalCount || 0;
            } else {
                $scope.employees = [];
                $scope.empPage.totalCount = 0;
            }
        }).catch(function (err) {
            console.error('Load employees error', err);
            $scope.employees = [];
            $scope.empPage.totalCount = 0;
            $scope.showNotification('Lỗi tải danh sách nhân viên', 'danger');
        }).finally(function () { $scope.loading = false; });
    };

    // Load departments
    $scope.loadDepartments = function () {
        BookstoreService.getDepartments({
            pageNumber: $scope.depPage.pageNumber,
            pageSize: 100, // load many for dropdown
            searchTerm: ''
        }).then(function (resp) {
            if (resp.data && resp.data.success) {
                $scope.departments = resp.data.data.departments || [];
                $scope.depPage.totalCount = resp.data.data.totalCount || 0;
            } else {
                $scope.departments = [];
                $scope.depPage.totalCount = 0;
            }
        }).catch(function (err) {
            console.error('Load departments error', err);
            $scope.departments = [];
            $scope.depPage.totalCount = 0;
            $scope.showNotification('Lỗi tải danh sách phòng ban', 'danger');
        });
    };

    // Load areas
    $scope.loadAreas = function () {
        BookstoreService.getAreas().then(function (resp) {
            if (resp.data && resp.data.success && resp.data.data && resp.data.data.areas) {
                $scope.areas = resp.data.data.areas || [];
            } else if (resp.data && resp.data.data && Array.isArray(resp.data.data)) {
                $scope.areas = resp.data.data;
            } else {
                $scope.areas = [];
            }
        }).catch(function (err) {
            console.error('Load areas error', err);
            $scope.areas = [];
        });
    };

    // Get area name by ID
    $scope.getAreaName = function (areaId) {
        var area = $scope.areas.find(function (a) { return a.areaId === areaId; });
        return area ? area.name : 'Unknown';
    };

    // Add area to employee
    $scope.addArea = function () {
        if (!$scope.newEmployee.selectedAreaId) return;
        if (!$scope.newEmployee.areaIds) {
            $scope.newEmployee.areaIds = [];
        }
        if ($scope.newEmployee.areaIds.indexOf($scope.newEmployee.selectedAreaId) === -1) {
            $scope.newEmployee.areaIds.push($scope.newEmployee.selectedAreaId);
        }
        $scope.newEmployee.selectedAreaId = null;
    };

    // Remove area from employee
    $scope.removeArea = function (areaId) {
        if (!$scope.newEmployee.areaIds) return;
        var index = $scope.newEmployee.areaIds.indexOf(areaId);
        if (index > -1) {
            $scope.newEmployee.areaIds.splice(index, 1);
        }
    };

    // ----- EMPLOYEE ACTIONS -----

    // Submit form wrapper
    $scope.submitEmployeeForm = function (form) {
        if (!form) return;
        form.$setSubmitted(); // Trigger validation messages
        if (form.$invalid) {
            $scope.showNotification('Vui lòng kiểm tra lại thông tin nhập', 'warning');
            return;
        }

        if ($scope.isEditMode) {
            $scope.updateEmployee();
        } else {
            $scope.createEmployee();
        }
    };

    $scope.createEmployee = function () {
        // Minimal check, rely on form validation
        /* if (!$scope.newEmployee.accountEmail || !$scope.newEmployee.password || 
               !$scope.newEmployee.firstName || !$scope.newEmployee.lastName || !$scope.newEmployee.departmentId) {
             return; 
        } */

        var payload = angular.copy($scope.newEmployee);
        if (payload.dateOfBirth) {
            // Handle date input (might be Date object or string)
            try {
                payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
            } catch (e) { console.error('Date parse error', e); }
        }

        // Convert areaIds array to the format expected by API
        if (payload.areaIds && payload.areaIds.length > 0) {
            payload.areaIds = payload.areaIds.map(function (id) { return Number(id); });
        } else {
            payload.areaIds = [];
        }
        // Remove selectedAreaId from payload (it's only for UI)
        delete payload.selectedAreaId;

        $scope.loading = true;
        BookstoreService.createEmployeeWithAccount(payload).then(function (resp) {
            if (resp.data && resp.data.success) {
                $scope.showNotification('Tạo nhân viên thành công', 'success');
                $scope.newEmployee = angular.copy($scope.defaultEmployee);
                // Reset form state
                if ($scope.employeeForm) {
                    $scope.employeeForm.$setPristine();
                    $scope.employeeForm.$setUntouched();
                }
                $scope.loadEmployees();
            } else {
                $scope.showNotification(resp.data && resp.data.message ? resp.data.message : 'Không thể tạo nhân viên', 'danger');
            }
        }).catch(function (err) {
            $scope.showNotification('Lỗi tạo nhân viên: ' + (err.data?.message || err.message), 'danger');
        }).finally(function () { $scope.loading = false; });
    };

    $scope.editEmployee = function (emp) {
        $scope.isEditMode = true;
        $scope.editingEmployeeId = emp.employeeId;

        // Populate form
        $scope.newEmployee = angular.copy(emp);

        // Ensure date is a Date object for input[type=date]
        if ($scope.newEmployee.dateOfBirth) {
            $scope.newEmployee.dateOfBirth = new Date($scope.newEmployee.dateOfBirth);
        }

        // IMPORTANT: Password is NOT populated.
        $scope.newEmployee.password = '';

        // Reset selected area
        $scope.newEmployee.selectedAreaId = null;

        // Reset form validation state when editing starts
        if ($scope.employeeForm) {
            $scope.employeeForm.$setPristine();
            $scope.employeeForm.$setUntouched();
        }

        // Fetch detail to get areaIds and latest data
        BookstoreService.getEmployeeById(emp.employeeId).then(function (resp) {
            if (resp.data && resp.data.success) {
                var fullEmp = resp.data.data;
                $scope.newEmployee.areaIds = fullEmp.areaIds || [];
                // Update other fields to be latest
                $scope.newEmployee.firstName = fullEmp.firstName;
                $scope.newEmployee.lastName = fullEmp.lastName;
                $scope.newEmployee.phone = fullEmp.phone;
                $scope.newEmployee.address = fullEmp.address;
                $scope.newEmployee.employeeEmail = fullEmp.email; // Fixed mapping
                $scope.newEmployee.departmentId = fullEmp.departmentId;
                $scope.newEmployee.roleId = fullEmp.roleId;
                $scope.newEmployee.accountEmail = fullEmp.accountEmail;
                if (fullEmp.dateOfBirth) $scope.newEmployee.dateOfBirth = new Date(fullEmp.dateOfBirth);
                if (fullEmp.gender) $scope.newEmployee.gender = fullEmp.gender;
            }
        });
    };

    $scope.cancelEditEmployee = function () {
        $scope.isEditMode = false;
        $scope.editingEmployeeId = null;
        $scope.newEmployee = angular.copy($scope.defaultEmployee);
        if ($scope.employeeForm) {
            $scope.employeeForm.$setPristine();
            $scope.employeeForm.$setUntouched();
        }
    };

    $scope.updateEmployee = function () {
        // Validation handled by submitEmployeeForm
        /* if (!$scope.newEmployee.firstName || !$scope.newEmployee.lastName || !$scope.newEmployee.departmentId) {
             return;
        } */


        var payload = angular.copy($scope.newEmployee);

        // Format Date
        if (payload.dateOfBirth) {
            try {
                payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
            } catch (e) { console.error('Date parse error', e); }
        }

        // Areas
        if (payload.areaIds && payload.areaIds.length > 0) {
            payload.areaIds = payload.areaIds.map(Number);
        } else {
            payload.areaIds = [];
        }
        delete payload.selectedAreaId;

        // If updating, typically we don't update accountEmail/password via this endpoint unless backend supports it.
        // Assuming backend ignores password if empty or this endpoint is just for profile.

        $scope.loading = true;
        BookstoreService.updateEmployee($scope.editingEmployeeId, payload).then(function (resp) {
            if (resp.data && resp.data.success) {
                $scope.showNotification('Cập nhật nhân viên thành công', 'success');
                $scope.cancelEditEmployee();
                $scope.loadEmployees();
            } else {
                $scope.showNotification(resp.data && resp.data.message ? resp.data.message : 'Không thể cập nhật nhân viên', 'danger');
            }
        }).catch(function (err) {
            $scope.showNotification('Lỗi cập nhật nhân viên: ' + (err.data?.message || err.message), 'danger');
        }).finally(function () { $scope.loading = false; });
    };

    $scope.confirmDeleteEmployee = function (emp) {
        if (emp.accountEmail === 'admin@bookstore.com') {
            $scope.showNotification('Không thể xóa tài khoản Admin mặc định', 'warning');
            return;
        }
        $scope.deleteItemType = 'employee';
        $scope.itemToDelete = emp;
        $scope.deleteMessage = 'Bạn có chắc chắn muốn xóa nhân viên "' + emp.firstName + ' ' + emp.lastName + '"?';
        $scope.showDeleteConfirm = true;
    };

    // ----- DEPARTMENT ACTIONS -----

    $scope.createDepartment = function () {
        if (!$scope.newDepartment.name) {
            $scope.showNotification('Vui lòng nhập tên phòng ban', 'warning');
            return;
        }
        BookstoreService.createDepartment($scope.newDepartment).then(function (resp) {
            if (resp.data && resp.data.success) {
                $scope.showNotification('Tạo phòng ban thành công', 'success');
                $scope.newDepartment = angular.copy($scope.defaultDepartment);
                $scope.loadDepartments();
            } else {
                $scope.showNotification(resp.data && resp.data.message ? resp.data.message : 'Không thể tạo phòng ban', 'danger');
            }
        }).catch(function (err) {
            $scope.showNotification('Lỗi tạo phòng ban', 'danger');
            console.error(err);
        });
    };

    $scope.editDepartment = function (dep) {
        $scope.isEditDepMode = true;
        $scope.editingDepartmentId = dep.departmentId;
        $scope.newDepartment = angular.copy(dep);
    };

    $scope.cancelEditDepartment = function () {
        $scope.isEditDepMode = false;
        $scope.editingDepartmentId = null;
        $scope.newDepartment = angular.copy($scope.defaultDepartment);
    };

    $scope.updateDepartment = function () {
        if (!$scope.newDepartment.name) {
            $scope.showNotification('Vui lòng nhập tên phòng ban', 'warning');
            return;
        }

        BookstoreService.updateDepartment($scope.editingDepartmentId, $scope.newDepartment).then(function (resp) {
            if (resp.data && resp.data.success) {
                $scope.showNotification('Cập nhật phòng ban thành công', 'success');
                $scope.cancelEditDepartment();
                $scope.loadDepartments();
            } else {
                $scope.showNotification(resp.data && resp.data.message ? resp.data.message : 'Không thể cập nhật phòng ban', 'danger');
            }
        }).catch(function (err) {
            $scope.showNotification('Lỗi cập nhật phòng ban: ' + (err.data?.message || err.message), 'danger');
            console.error(err);
        });
    };

    $scope.confirmDeleteDepartment = function (dep) {
        // Prevent delete if has employees (optional check here, but backend should enforce too)
        if (dep.employeeCount > 0) {
            $scope.showNotification('Cảnh báo: Phòng ban này đang có ' + dep.employeeCount + ' nhân viên. Cân nhắc trước khi xóa.', 'warning');
        }

        $scope.deleteItemType = 'department';
        $scope.itemToDelete = dep;
        $scope.deleteMessage = 'Bạn có chắc chắn muốn xóa phòng ban "' + dep.name + '"?';
        $scope.showDeleteConfirm = true;
    };


    // Unified Confirm Action
    $scope.confirmDeleteAction = function () {
        if ($scope.deleteItemType === 'employee' && $scope.itemToDelete) {
            BookstoreService.deleteEmployee($scope.itemToDelete.employeeId).then(function (resp) {
                if (resp.data && resp.data.success) {
                    $scope.showNotification('Đã xóa nhân viên thành công', 'success');
                    $scope.loadEmployees();
                } else {
                    $scope.showNotification('Không thể xóa nhân viên: ' + (resp.data.message || ''), 'danger');
                }
            }).catch(function (err) {
                $scope.showNotification('Lỗi xóa nhân viên: ' + (err.data?.message || err.message), 'danger');
                console.error(err);
            });
        }
        else if ($scope.deleteItemType === 'department' && $scope.itemToDelete) {
            BookstoreService.deleteDepartment($scope.itemToDelete.departmentId).then(function (resp) {
                if (resp.data && resp.data.success) {
                    $scope.showNotification('Đã xóa phòng ban thành công', 'success');
                    $scope.loadDepartments();
                } else {
                    $scope.showNotification('Không thể xóa phòng ban: ' + (resp.data.message || ''), 'danger');
                }
            }).catch(function (err) {
                $scope.showNotification('Lỗi xóa phòng ban: ' + (err.data?.message || err.message), 'danger');
                console.error(err);
            });
        }

        $scope.showDeleteConfirm = false;
        $scope.itemToDelete = null;
    };


    // Init
    $scope.init = function () {
        if (!AuthService.isAdmin()) return;
        $scope.loadDepartments();
        $scope.loadAreas();
        $scope.loadEmployees();
    };

    $scope.init();
}]);
