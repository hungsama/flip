'use strict';

var main = angular
.module('general', [
    'ngRoute',
    'ngResource',
    'ngSanitize',
    'infinite-scroll',
    'ngStorage',
    'ngCke'
])
.run(function($rootScope, $window) {

  $rootScope.$on('$routeChangeSuccess', function () {

    var interval = setInterval(function(){
      if (document.readyState == 'complete') {
        $window.scrollTo(0, 0);
        clearInterval(interval);
      }
    }, 200);

  });
})
.config(['$routeProvider', '$controllerProvider','$locationProvider', '$provide',
    function($routeProvider, $controllerProvider, $locationProvider, $provide) {
        // remember mentioned function for later use
        main.registerCtrl = $controllerProvider.register;
        main.registerFtr = $provide.factory;
        // my routers
        $routeProvider
            .when('/', {templateUrl: 'components/home/homeView.html'}) 
            .when('/topic', {templateUrl: 'components/topic/topicView.html'})
            .when('/topic/:name', {templateUrl: 'components/topic/detailTopicView.html'})
            .when('/article/:id', {templateUrl: 'components/article/articleView.html'})
            .when('/contact', {templateUrl: 'components/contact/contactView.html'})
            .when('/user/:name', {templateUrl: 'components/user/userView.html'})
            .when('/follows', {templateUrl: 'components/user/followingView.html'})
            .when('/me-topic', {templateUrl: 'components/user/metopicView.html'})
            .when('/me-info', {templateUrl: 'components/user/meinfoView.html'})
            .when('/create-new', {templateUrl: 'components/user/createnewView.html'})
            .when('/me-friends', {templateUrl: 'components/user/friendsView.html'})
            .when('/test', {templateUrl: 'components/test/testView.html'})
            .otherwise({redirectTo: '/'});
        $locationProvider.html5Mode(true);
    }
])
.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
})
.filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
})
.controller('navGeneral', function ($scope, $rootScope, $location, $localStorage, $sessionStorage, publicFactory) {
    /** Begin __________ get all categories __________ **/
    publicFactory.topic.get({object : 'categories'}, function(data){
        $scope.categories = data.data;
    });
    /** End __________ get all categories __________ **/

    /** Begin __________ Check user login __________ **/
    if ($localStorage.infoUser) {
        $rootScope.is_login = true;
        $rootScope.username = $localStorage.infoUser.username;
    }
    else $rootScope.is_login = false;
    /** End __________ Check user login __________ **/

    /** Begin __________ show/hide form login __________ **/
    $("body").click(function(event) {
        $('.box-setting').removeClass('active');
        $rootScope.is_click = false;
        $rootScope.is_click_notice = false;
    });
    
    $scope.list_link = function (event)
    {
        $('.box-setting').removeClass('active');
        if (!$scope.is_click){
            $('#show-list-href').addClass('active');
            $rootScope.is_click = true;
            $rootScope.is_click_notice = false;
        }
        else
        {
            $('#show-list-href').removeClass('active');
            $rootScope.is_click = false;
        }
        event.stopPropagation();
    }
    $scope.list_notice = function (event)
    {
        $('.box-setting').removeClass('active');
        if (!$scope.is_click_notice){
            $('#show-list-notice').addClass('active');
            $rootScope.is_click_notice = true;
            $rootScope.is_click = false;
        }
        else
        {
            $('#show-list-notice').removeClass('active');
            $rootScope.is_click_notice = false;
        }
        event.stopPropagation();
    }
    /** End __________ show/hide form login __________ **/
    $scope.testx = function()
    {
        var dataPost = new publicFactory.login();
        dataPost.username = 'NguyenDinhHung';
        dataPost.password = 'Hungpro';
        dataPost.object = 'login';
        dataPost.$save();
    }
})



