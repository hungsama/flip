'use strict';
main.registerFtr('homeFactory', ['$resource', function ($resource) {
    var articles = $resource(
        'http://api-pin.vn/api/content/list_articles', 
        {}
        ,
        {
            getArticlesData : {
                method : 'POST',
                isArray : false
            }
        });
    var topics = $resource(
        'http://api-pin.vn/api/content/suggest_topics', 
        {}
        ,
        {
            getSuggestTopics : {
                method : 'POST',
                isArray : false
            }
        });
    return {
        articles : articles,
        topics : topics
    };
}]);
