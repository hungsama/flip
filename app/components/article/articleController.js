'use strict';
main.registerCtrl('artCtrl', function ($scope, $location, $http, $route,  $routeParams, articleFactory) {
    console.log($location.path().split('/'));
    articleFactory.article.get({id:$routeParams.id}, function(res) {
        if (res.error_code == 0) {
            $scope.detail = res.data.detail;
            console.log($scope.detail);
            $scope.suggest_articles = res.data.related;
        }
    });
    $scope.limitString = function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    }
});
