var loginCtrl = angular.module('general');
loginCtrl.controller('loginCtrl', function ($scope, $rootScope, loginFactory, sessionUserFactory, $localStorage, $sessionStorage) {
    $('#show-list-href').removeClass('active');
    $rootScope.is_click = false;
    /** Begin __________ Đăng nhập hệ thống với tài khoản thường __________ **/
    $scope.login = function(user)
    {
        if (!user) return;
        var dataPost = new loginFactory.login();
        dataPost.username = user.username;
        dataPost.password = user.password;
        dataPost.$actionLogin(function (data){
            if (data.error_code == 0)
            {
                console.log(data.data.infoUser);
                $localStorage.infoUser = data.data.infoUser;
                console.log($localStorage.infoUser);
                $rootScope.username = $localStorage.infoUser.username;
                $('#myLogin').hide();
                $rootScope.is_login = true;
                 // window.location.reload();
            }
            else 
            {
                $scope.error_login = data.msg;
                $('#error-login').show();
            }
        });
    }
    /** End __________ Đăng nhập hệ thống với tài khoản thường __________ **/

    /** Begin __________ Đăng xuất hệ thống __________ **/
    $scope.logout = function()
    {
        $rootScope.is_login = false;
        loginFactory.logout.actionLogout(function (data){
        });
        sessionUserFactory.removeSessionUser('infoUser');
        sessionUserFactory.removeSessionUser('accessToken');
        window.location.reload();
    }
    /** End __________ Đăng xuất hệ thống __________ **/

    /** Begin __________ Đăng nhập hệ thống với tài khoản Facebook __________ **/

    function getUserData() {
        FB.api('/me', function(response) {
            // console.log(response);
            $('#myLogin').hide();
            $rootScope.sx = response;
        });
    }

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
                var dataPost = new loginFactory.fblogin();
                // console.log(dataPost);
                dataPost.access_token = response.authResponse.accessToken;
                dataPost.$actionLogin(function(data){
                    console.log(data);
                });
            }
        }, {scope: 'user_about_me,user_birthday,user_friends', return_scopes: true});
    });
    /** End __________ Đăng nhập hệ thống với tài khoản Facebook __________ **/
});




