var testService = angular.module('general');
testService.factory('testFactory', function($resource){
    return $resource('/web/index.php/api/topic/:id.json');
});