main.registerFtr('userFactory', ['$resource',function ($resource) {
    var login = $resource(
        'http://api-pin.vn/api/users/login',
        {}, 
        {
            actionLogin : {
                method : 'POST',
                isArray : false
            }
        }
    );

    var logout = $resource(
        'http://api-pin.vn/api/users/logout',
        {},
        {
            actionLogout : {
                method : 'POST',
                isArray : false
            }
        }
     );
    var fblogin = $resource(
        'http://api-pin.vn/api/users/fb_login',
        {},
        {
            actionLogin : {
                method : 'POST',
                isArray : false
            }
        }
    );

    var infouser = $resource('http://api-pin.vn/api/users/info/:id');

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

    var followsgeneral = $resource('http://api-pin.vn/api/users/followsGeneral', 
        {}, 
        {
            getFollowsGeneral : {
                method : 'POST',
                isArray : false
            }
    });

    var metopic = $resource(
        'http://api-pin.vn/api/content/child_topics', 
        {},
        {
            getmetopic : {
                method : 'POST',
                isArray : false
            }
        }
    );

    return {
        login : login,
        fblogin : fblogin,
        logout : logout,
        infouser :infouser,
        articles : articles,
        followsgeneral : followsgeneral,
        metopic : metopic
    };
}]);


