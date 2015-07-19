main.registerCtrl('topicCtrl', function($scope, $rootScope, $location, publicFactory)
{
    $scope.mainArticles = [];
    $scope.start_page = 0;
    $scope.limit_page = 2;

    $('.navbar-nav li').removeClass('active');
    $scope.topic_alias = $location.path().split('/')[2];
    console.log($scope.topic_alias);
    switch($scope.topic_alias)
    {
        /** Begin __________ Get all topics(categories) __________ **/
        case 'undefined' :
            $scope.cond_topics = {
                object : 'categories'
            }
            publicFactory.topic.get($scope.cond_topics, function(res){
                $scope.listTopics = res.data;
            });
            break;
        /** End __________ Get all topics(categories) __________ **/
        
        /** Begin __________ Get all articles in topic __________ **/
        default :
            $scope.cond_topics = {
                object : 'categories',
                topic_alias : $scope.topic_alias
            }
            publicFactory.topic.get($scope.cond_topics, function(res){
                // console.log(res.data);
                if (res.error_code == 0) $scope.listTopics = res.data;
                console.log($scope.listTopics);
            });
            $('#topic').addClass('active');
            break;
        /** End __________ Get all articles in topic __________ **/
    }

    $scope.loadMoreListArticles = function()
    {
        $scope.cond = {
            object : 'articles',
            topic_alias : $scope.topic_alias
        };
        publicFactory.topic.get($scope.cond,function(data){
            if (data.error_code == 0) $scope.mainArticles = $scope.mainArticles.concat(data.data);
        });
    }

    /** Begin __________ Get articles top in home __________ **/
    $scope.listTabArticles = [
        {id:1, typeTop:'newest', label:'Mới nhất', active:true},
        {id:2, typeTop:'viewest', label:'Nhiều nhất', active:false}, 
        {id:3, typeTop:'random', label:'Ngẫu nhiên', active:false}
    ];
    // Get articles top default
    $scope.cond_top = {
            object : 'articles',
            typeTop : 'newest'
        };
    publicFactory.article.get($scope.cond_top, function(data){
        $scope.topArticles = [];
        if (data.error_code == 0) $scope.topArticles = data.data;
    });
    // Switch articles top
    $scope.articlesLeft = function(condition)
    {
        $scope.cond_top.typeTop = condition; 
        publicFactory.article.get($scope.cond_top, function(data){
            $scope.topArticles = [];
            if (data.error_code == 0) $scope.topArticles = data.data;
        });
    }
    /** End __________ Get articles top in home __________ **/
    
    /** Begin __________ Suggest topics in home __________ **/
    $scope.cond_suggest_topics = {
        object : 'suggest_topics'
    }
    publicFactory.topic.get($scope.cond_suggest_topics, function(data){
        $scope.suggestTopicsHome = [];
        if (data.error_code == 0) $scope.suggestTopicsHome = data.data;
    });
    /** End __________ Suggest topics in home __________ **/

    $scope.hoveractive = function(id)
    {
        $("#list-drop-"+id).slideDown(200);
    }

    $scope.hovedeactive = function(id)
    {
        $("#list-drop-"+id).slideUp(200);
    }
});