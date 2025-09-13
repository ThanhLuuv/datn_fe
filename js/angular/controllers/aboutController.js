// About Controller
app.controller('AboutController', ['$scope', function($scope) {
    $scope.title = 'Giới thiệu';
    $scope.aboutInfo = {
        company: 'Công ty ABC',
        description: 'Chúng tôi là một công ty chuyên về phát triển phần mềm và ứng dụng web.',
        founded: '2020',
        team: [
            { name: 'Nguyễn Văn A', position: 'CEO', avatar: 'bi-person-circle' },
            { name: 'Trần Thị B', position: 'CTO', avatar: 'bi-person-circle' },
            { name: 'Lê Văn C', position: 'Developer', avatar: 'bi-person-circle' }
        ],
        technologies: [
            'HTML5', 'CSS3', 'JavaScript', 'AngularJS', 'Bootstrap', 'jQuery'
        ]
    };

    // Get current year
    $scope.currentYear = new Date().getFullYear();
}]);
