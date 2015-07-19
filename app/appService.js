var appService = angular.module('general');
appService.factory('publicFactory', ['$resource', function($resource){
    // Get all parent topics
    var topic = $resource('/web/index.php/api/topic/:id.json');

    // Get all or a article
    var article = $resource('/web/index.php/api/article/:id.json');

    // Authenticate
    var login = $resource('web/index.php/api/login/:id.json');

    // User
    var user = $resource('web/index.php/api/user/:id.json');
    
    return {
        topic : topic,
        article : article,
        login : login,
        user : user
    };
}]);