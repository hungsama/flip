main.directive('ckEditor', [function () {
    return {
        require: '?ngModel',
        restrict: 'C',
        link: function (scope, elm, attr, model) {
            var isReady = false;
            var data = [];
            var ck = CKEDITOR.replace(elm[0]);
            
            function setData() {
                if (!data.length) {
                    return;
                }
                
                var d = data.splice(0, 1);
                ck.setData(d[0] || '<span></span>', function () {
                    setData();
                    isReady = true;
                });
            }

            ck.on('instanceReady', function (e) {
                if (model) {
                    setData();
                }
            });
            
            elm.bind('$destroy', function () {
                ck.destroy(false);
            });

            if (model) {
                ck.on('change', function () {
                    scope.$apply(function () {
                        var data = ck.getData();
                        if (data == '<span></span>') {
                            data = null;
                        }
                        model.$setViewValue(data);
                    });
                });

                model.$render = function (value) {
                    if (model.$viewValue === undefined) {
                        model.$setViewValue(null);
                        model.$viewValue = null;
                    }

                    data.push(model.$viewValue);

                    if (isReady) {
                        isReady = false;
                        setData();
                    }
                };
            }
            
        }
    };
}]);
main.registerCtrl('userCtrl', function ($scope, $rootScope, $http, $route, $location, userFactory, publicFactory, sessionUserFactory, $localStorage, $sessionStorage){
    $('.navbar-nav > li').removeClass('active');
    $scope.username = '20test';
    $scope.user_id = 20;
    $scope.is_data == true;
    $scope.userArticles = []; 
    $scope.follows = {}; 
    $scope.start_page = 0;
    $scope.limit_page = 1;
    $scope.path = $location.path();
    switch ($scope.path)
    {
        case '/follows':
                var dataPost = new userFactory.followsgeneral();
                dataPost.user_id = $scope.user_id;
                dataPost.start_page = $scope.start_page;
                dataPost.limit_page = $scope.limit_page;
                dataPost.$getFollowsGeneral(function (data){
                $scope.start_page = $scope.start_page + $scope.limit_page;
                    if (data.error_code == 0) $scope.follows = data.data;
                });
                
                $('#follow').addClass('active');
                break;
        case '/me-topic':
                $scope.topics = [];
                var dataPost = new userFactory.metopic();
                dataPost.user_id = $scope.user_id;
                dataPost.start_page = $scope.start_page;
                dataPost.limit_page = $scope.limit_page;
                dataPost.$getmetopic(function (data){
                $scope.start_page = $scope.start_page + $scope.limit_page;
                    if (data.error_code == 0) $scope.topics = data.data;
                });
                break;
        default : // get info wall user
            $scope.loadMoreArticlesUser = function ()
            {
                var dataPost = new userFactory.articles();
                dataPost.user_id = $scope.user_id;
                dataPost.start_page = $scope.start_page;
                dataPost.limit_page = $scope.limit_page;
                dataPost.$getArticlesData(function (data){
                $scope.start_page = $scope.start_page + $scope.limit_page;
                    if (data.error_code == 0) $scope.userArticles = $scope.userArticles.concat(data.data);
                });
                $('.navbar-nav li').removeClass('active');
            }
            break;
    }

    /** ===== Đăng xuất hệ thống ===== **/
    $scope.logout = function()
    {
        userFactory.logout.actionLogout(function (data){
        });
        delete $localStorage.infouser;
    }

    userFactory.infouser.get({id:$scope.username}, function(data) {
        if (data.error_code == 0) {
            $scope.userinfo = data.data;
        }
    });
 
    /** ===== Đăng xuất nhập hệ thống bằng tài khoản facebook ===== **/
    window.fbAsyncInit = function() {
        //SDK loaded, initialize it
        FB.init({
          appId      : '1591658131059108',
          xfbml      : true,
          version    : 'v2.3'
        });
        // check user session and refresh it
        FB.getLoginStatus(function(response) {
            // console.log(response); 
            if (response.status === 'connected') {
                //user is authorized
                getUserData();
            } else {
                //user is not authorized
            }
        });
    };
 
    //load the JavaScript SDK
    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
     
        //add event listener to login button
    $("#loginBtn").click(function() {
        //do the login
        FB.login(function(response) {
            // console.log(response);
            if (response.authResponse) {
                //user just authorized your app
                // console.log(response.authResponse.accessToken);
                var dataPost = new userFactory.fblogin();
                // console.log(dataPost);
                dataPost.access_token = response.authResponse.accessToken;
                dataPost.$actionLogin(function(data){
                    console.log(data);
                });
            }
        }, {scope: 'user_about_me,user_birthday,user_friends', return_scopes: true});
    });
    
    /** Option CKEditor */
    $scope.option = {
        language: 'fr'
    };
}); 