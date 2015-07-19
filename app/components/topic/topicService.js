main.registerFtr('topicFactory', ['$resource',function ($resource) {
    var topicParent = $resource(
        'http://api-pin.vn/api/content/parent_topic',
        {},
        {
            getTopicParent : {
                method : 'POST',
                'isArray' : false
            }
        }
    );

    var topicChildren = $resource(
        'http://api-pin.vn/api/content/child_topics', 
        {},
        {
            getTopicChildren : {
                method : 'POST',
                isArray : false
            }
        }
    );

    var articles = $resource(
        'http://api-pin.vn/api/content/list_articles', 
        {}, 
        {
            getArticlesData : {
                method : 'POST',
                isArray : false
            }
        }
    );

    return {
        topicParent : topicParent,
        topicChildren : topicChildren,
        articles : articles
    };
}])