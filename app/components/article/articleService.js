'use strict';
main.registerFtr('articleFactory', ['$resource', function ($resource) {
    var detail_article = $resource('http://api-pin.vn/api/content/detail_article/:id');
    return {
        article : detail_article
    };
}]);