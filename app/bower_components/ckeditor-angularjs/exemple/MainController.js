var app = angular.module('Exemple', ['ngCke', 'ngSanitize'])


app.controller('ExempleController', function ($scope) {

    $scope.option = {
        language: 'fr'
    };

    $scope.test = 'TEST\n';

});