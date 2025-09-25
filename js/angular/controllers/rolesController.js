// Admin Roles Management Controller
app.controller('AdminRolesController', ['$scope', 'BookstoreService', 'AuthService', function($scope, BookstoreService, AuthService) {
	if (!AuthService.isAdmin()) { return; }

	$scope.loading = false;
	$scope.error = null;
	$scope.roles = [];
	$scope.permissions = [];
	$scope.selectedRole = null;
	$scope.rolePermissions = [];
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

	$scope.load = function() {
		$scope.loading = true;
		$scope.error = null;
		Promise.all([
			BookstoreService.getRoles(),
			BookstoreService.getAllPermissions()
		]).then(function(results){
			var rolesRes = results[0];
			var permsRes = results[1];
			$scope.roles = (rolesRes.data && rolesRes.data.data) || [];
			$scope.permissions = (permsRes.data && permsRes.data.data) || [];
			if ($scope.roles.length) {
				$scope.selectRole($scope.roles[0]);
			}
		}).catch(function(err){
			$scope.error = err && err.data && err.data.message || 'Không thể tải role/permission.';
			$scope.addToast('danger', $scope.error);
		}).finally(function(){
			$scope.loading = false;
			$scope.$applyAsync();
		});
	};

	$scope.selectRole = function(role) {
		$scope.selectedRole = role;
		$scope.rolePermissions = [];
		BookstoreService.getRolePermissions(role.roleId).then(function(res){
			var data = res.data && res.data.data;
			$scope.rolePermissions = (data && data.permissions) || [];
		});
	};

	$scope.hasPermission = function(permissionId) {
		return ($scope.rolePermissions || []).some(function(p){ return p.permissionId === permissionId; });
	};

	$scope.togglePermission = function(permission) {
		if (!$scope.selectedRole) return;
		var roleId = $scope.selectedRole.roleId;
		var permissionId = permission.permissionId;
		var isAssigned = $scope.hasPermission(permissionId);
		var promise = isAssigned
			? BookstoreService.removePermissionFromRole(roleId, permissionId)
			: BookstoreService.assignPermissionToRole(roleId, permissionId);
		promise.then(function(){
			$scope.addToast('success', isAssigned ? 'Đã bỏ quyền.' : 'Đã gán quyền.');
			return BookstoreService.getRolePermissions(roleId);
		}).then(function(res){
			var data = res.data && res.data.data;
			$scope.rolePermissions = (data && data.permissions) || [];
		}).catch(function(err){
			$scope.error = err && err.data && err.data.message || 'Không thể cập nhật quyền cho role.';
			$scope.addToast('danger', $scope.error);
		});
	};

	$scope.load();
}]);


