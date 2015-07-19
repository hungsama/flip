var loginService = angular.module('general');

loginService.factory('loginFactory', ['$resource', function($resource){
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
    return {
        login : login,
        fblogin : fblogin,
        logout : logout,
        infouser :infouser
    };
}])
.factory('sessionUserFactory', ['$resource',function ($resource) {
    var setSessionUser = function (key, value)
    {
        return sessionStorage.setItem(key, value);
    }
    var getSessionUser = function (key)
    {
        return sessionStorage.getItem(key);
    }
    var removeSessionUser = function (key)
    {
        return sessionStorage.removeItem(key);
    }
    return {
        setSessionUser : setSessionUser,
        getSessionUser : getSessionUser, 
        removeSessionUser : removeSessionUser
    };
}]);

