'use strict';
main.registerCtrl('homeCtrl', function ($scope, $rootScope, $location, publicFactory) {
    /** ===== Lấy danh sách bài viết chính cho trang chủ ===== **/
    $scope.mainArticles = [];
    $scope.start_page = 0;
    $scope.limit_page = 2;

    /** Begin __________ Scroll article in home __________ **/
    $scope.loadMoreListArticles = function()
    {
        $scope.cond = {object : 'articles'};
        publicFactory.article.get($scope.cond,function(data){
            if (data.error_code == 0) $scope.mainArticles = $scope.mainArticles.concat(data.data);
        });
    }
    /** End __________ Scroll article in home __________ **/
    
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

