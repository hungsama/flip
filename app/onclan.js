angular.module("App", ["ui.bootstrap", "mentio", "ui.router", "infinite-scroll", "ngCookies", "ngSanitize", "ui.keypress", "angularMoment", "ngFileUpload", "ngQuickDate", "textAngular", "sotos.crop-image"]);
angular.module("App").constant("APPVERSION", [0, 0, 48]);
angular.module("App").config(["$provide", function($provide) {
    $provide.decorator("taOptions", ["taRegisterTool", "$modal", "$window", "$delegate", function(taRegisterTool, $modal, $window, taOptions) {
        taOptions.toolbar = [
            ["h3", "h4", "h5", "h6", "p", "quote"],
            ["bold", "italics", "underline", "ul", "ol"],
            ["justifyLeft", "justifyCenter", "justifyRight"],
            ["insertLink", "insertImage"]
        ];
        taRegisterTool("uploadImage", {
            iconclass: "fa fa-camera",
            tooltiptext: "Upload image",
            action: function($deferred, restoreSelection) {
                var textAngular = this;
                var modalInstance = $modal.open({
                    templateUrl: "/views/image.upload.html",
                    size: "sm",
                    controller: "ImageUploadCtrl",
                    backdrop: "static"
                });
                modalInstance.result.then(function(photo) {
                    var imgUrl = photo[0].url;
                    textAngular.$editor().wrapSelection("insertHTML", "", true);
                    restoreSelection();
                    if (imgUrl && imgUrl !== "" && imgUrl !== "http://") {
                        textAngular.$editor().wrapSelection("insertImage", imgUrl, true);
                        textAngular.$editor().wrapSelection("insertHTML", "<br>", true)
                    }
                    removeElementsByClass("rangySelectionBoundary");
                    $deferred.resolve()
                });
                return false
            }
        });
        taRegisterTool("video", {
            iconclass: "fa fa-youtube-play",
            tooltiptext: "Insert link youtube",
            action: function($window) {
                var textAngular = this;
                var urlPrompt;
                urlPrompt = window.prompt("Insert link youtube", "http://");
                var check = urlPrompt.match(/youtube/);
                if (!check) return false;
                if (urlPrompt && urlPrompt !== "" && urlPrompt !== "http://") {
                    var ids = urlPrompt.match(/(\?|&)v=[^&]*/);
                    if (ids && ids.length > 0) {
                        var id = ids[0].substr(3);
                        var thumb = "https://i1.ytimg.com/vi/" + id + "/hqdefault.jpg";
                        var urlLink = "http://www.youtube.com/embed/" + ids[0].substr(3);
                        var link = '<a href="' + urlPrompt + '"><img src="' + thumb + '"/></a>';
                        return textAngular.$editor().wrapSelection("insertHTML", link, true)
                    } else {
                        return false
                    }
                } else {
                    return false
                }
            }
        });
        taRegisterTool("help", {
            iconclass: "fa fa-question",
            tooltiptext: "Toturial",
            action: function() {
                var textAngular = this;
                var modalInstance = $modal.open({
                    templateUrl: "/views/textangular.help.html",
                    controller: "TextAngularHelpCtrl",
                    windowClass: "text-angular-help",
                    backdrop: "static"
                });
                modalInstance.result.then(function(data) {});
                return false
            }
        });
        taOptions.toolbar[3].push("uploadImage");
        taOptions.toolbar[3].push("video");
        taOptions.toolbar[3].push("help");
        return taOptions
    }]);
    $provide.decorator("$exceptionHandler", function($delegate) {
        return function(exception, cause) {
            $delegate(exception, cause);
            ga("send", "event", "onClan error", exception.message, "URL: " + document.URL + " -> Stack: " + exception.stack, 0, true)
        }
    })
}]);
angular.module("App").config(function($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider, APPVERSION) {
    var getAppVersion = function() {
        return APPVERSION.join(".")
    };
    $urlRouterProvider.otherwise("error");
    $urlRouterProvider.when(/\/$/, function($match) {
        return $match["input"].replace(/\/+$/, "")
    });
    $stateProvider.state("newsfeed", {
        url: "/newsfeed/:filter",
        templateUrl: "/views/newsfeed.html"
    }).state("gamesuggest", {
        url: "/gamesuggest",
        templateUrl: "/views/new.game.suggest.html"
    }).state("profile", {
        url: "/profile",
        templateUrl: "/views/update.profile.html"
    }).state("playersuggest", {
        url: "/playersuggest",
        templateUrl: "/views/player.suggest.html"
    }).state("home", {
        url: "/",
        templateUrl: "/views/home.html",
        resolve: {
            resolve: function($q, $rootScope) {
                var defer = $q.defer();
                $rootScope.$watch("appReady", function(n, o) {
                    if (n || o) {
                        return defer.resolve()
                    }
                });
                return defer.promise
            }
        }
    }).state("games", {
        url: "/games/:order",
        templateUrl: "/views/games.html"
    }).state("game", {
        url: "/game/:gameId",
        templateUrl: "/views/gameDetail.html",
        "abstract": true,
        resolve: {
            game: function(Game, Post, $stateParams, $state) {
                return Game.getGameInfo($stateParams.gameId).success(function(data) {
                    if (!data.status) return $state.go("error");
                    return data
                })
            }
        },
        controller: "GameDetailCtrl"
    }).state("game.activity", {
        url: "",
        templateUrl: "/views/postwall.html"
    }).state("game.clan", {
        url: "/clans",
        templateUrl: "/views/listclan.html"
    }).state("game.tip", {
        url: "/tips",
        templateUrl: "/views/listtip.html"
    }).state("game.follower", {
        url: "/followers",
        templateUrl: "/views/game.follower.html"
    }).state("game.photo", {
        url: "/photos",
        templateUrl: "/views/listphoto.html"
    }).state("game.info", {
        url: "/info",
        templateUrl: "/views/game.info.html"
    }).state("game.events", {
        url: "/events",
        templateUrl: "/views/listevents.html",
        controller: "ListGameEventCtrl"
    }).state("game.videodetail", {
        url: "/video/:postId",
        templateUrl: "/views/game.video.html",
        resolve: {
            post: function(Post, $stateParams, $state) {
                return Post.getPost($stateParams.postId).success(function(data) {
                    if (!data.status) return $state.go("error");
                    return data
                })
            }
        },
        controller: "GameVideoDetail"
    }).state("game.live", {
        url: "/live",
        templateUrl: "/views/game.video.html",
        resolve: {
            post: function(Post, game) {
                if (!game.data.data.live) return false;
                return Post.getPost(game.data.data.live.postId).success(function(data) {
                    return data
                })
            }
        },
        controller: "GameVideoDetail"
    }).state("game.videos", {
        url: "/videos",
        templateUrl: "/views/game.videos.html",
        controller: "GameVideos"
    }).state("game.event", {
        url: "/event/:eventId",
        templateUrl: "/views/detailevent.html",
        controller: "DetailEventCtrl"
    }).state("followings", {
        url: "/followings",
        templateUrl: "/views/followings.html"
    }).state("followers", {
        url: "/followers",
        templateUrl: "/views/followers.html"
    }).state("clans", {
        url: "/clans/:order",
        templateUrl: "/views/clans.html"
    }).state("clan", {
        url: "/clan/:clanId",
        templateUrl: "/views/clanDetail.html",
        "abstract": true
    }).state("clan.activity", {
        url: "",
        templateUrl: "/views/postwall.html"
    }).state("clan.member", {
        url: "/members",
        templateUrl: "/views/clan.member.html"
    }).state("clan.info", {
        url: "/info",
        templateUrl: "/views/clan.info.html"
    }).state("clan.event", {
        url: "/events",
        templateUrl: "/views/clan.event.html"
    }).state("user", {
        url: "/user/:userId",
        templateUrl: "/views/user.html",
        "abstract": true,
        resolve: {
            user: function($stateParams, $state, User) {
                if (!$stateParams.userId) return false;
                return User.getUserInfo($stateParams.userId).success(function(data, status, header, config) {
                    if (!data.status) return $state.go("error");
                    return data
                })
            }
        },
        controller: "UserCtrl"
    }).state("user.activity", {
        url: "",
        templateUrl: "/views/postwall.html"
    }).state("user.game", {
        url: "/games",
        templateUrl: "/views/listgame.html"
    }).state("user.clan", {
        url: "/clans",
        templateUrl: "/views/listclan.html"
    }).state("user.photo", {
        url: "/photos",
        templateUrl: "/views/listphoto.html"
    }).state("user.friend", {
        url: "/friends",
        templateUrl: "/views/friends.html"
    }).state("user.info", {
        url: "/info",
        templateUrl: "/views/user.info.html"
    }).state("post", {
        url: "/post/:postId",
        templateUrl: "/views/post.html",
        resolve: {
            post: function(Post, $stateParams, $state) {
                return Post.getPost($stateParams.postId).success(function(data) {
                    if (!data.status) return $state.go("error");
                    return data
                })
            }
        },
        controller: "PostDetailCtrl"
    }).state("notification", {
        url: "/notifications",
        templateUrl: "/views/notification.html",
        resolve: {
            userInfo: function($q, $rootScope) {
                var defer = $q.defer();
                $rootScope.$watch("appReady", function(n, o) {
                    if (n || o) {
                        return defer.resolve()
                    }
                });
                return defer.promise
            }
        },
        controller: "NotificationCtrl"
    }).state("search", {
        url: "/search?filter&keyword",
        templateUrl: "/views/search.html"
    }).state("hashtag", {
        url: "/hashtag/:keyword",
        templateUrl: "/views/hashtag.html"
    }).state("alias", {
        url: "/alias/:aliasId",
        templateUrl: "/views/alias.html",
        resolve: {
            aliasData: function(User, $stateParams, $state) {
                return User.getAliasInfo($stateParams.aliasId).success(function(data) {
                    if (!data.status) return $state.go("error");
                    return data
                })
            }
        },
        controller: "AliasCtrl"
    }).state("upload", {
        url: "/upload",
        templateUrl: "/views/upload.html"
    }).state("conversations", {
        url: "/conversations",
        templateUrl: "/views/chat.html"
    }).state("conversations/", {
        url: "/conversations/:topicId",
        templateUrl: "/views/chat.html"
    }).state("tip", {
        url: "/tip/:tipId",
        templateUrl: "/views/tipdetail.html"
    }).state("policy", {
        url: "/policy",
        templateUrl: "/views/policy.html"
    }).state("term", {
        url: "/term",
        templateUrl: "/views/term.html"
    }).state("about", {
        url: "/about.html",
        templateUrl: "/views/about.html"
    }).state("aboutvn", {
        url: "/mang-xa-hoi-danh-cho-game-thu",
        templateUrl: "/views/about.vn.html"
    }).state("error", {
        url: "/error",
        templateUrl: "/views/error.html"
    }).state("onclanlagi", {
        url: "/onclan-la-gi",
        templateUrl: "/views/onclan.lagi.html"
    });
    $httpProvider.defaults.headers.post = {
        "Content-Type": "application/x-www-form-urlencoded"
    };
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    }).hashPrefix("!")
});
angular.module("App").factory("sessionExpired", function($q, $window) {
    return {
        responseError: function(response) {
            if (response.status == 401) {
                $window.location = "/"
            }
            return $q.reject(response)
        }
    }
});
angular.module("App").factory("addRandomParam", function($q, $window) {
    return {
        request: function(config) {
            if (config.method != "GET") return config;
            if (config.url.match(/^\/ajax\/.+/)) {
                if (typeof config.params == "undefined") config.params = {
                    _t: moment().unix()
                };
                else if (typeof config.params._t == "undefined") config.params["_t"] = moment().unix()
            }
            return config
        }
    }
});
angular.module("App").config(["$httpProvider", function($httpProvider) {
    $httpProvider.interceptors.push("sessionExpired");
    $httpProvider.interceptors.push("addRandomParam")
}]);
angular.module("App").run(function($rootScope, User, $cookies, $http, $location, $state, $window, $timeout, APPVERSION) {
    $http.get("/ajax/index.php/user/getlocation").success(function(data) {
        if (data) $rootScope.country = data
    });
    $rootScope.getAppVersion = function() {
        return APPVERSION.join(".")
    };
    $rootScope.isMobile = false;
    $rootScope.device = "pc";
    $rootScope.currentPage = "";
    $rootScope.stickers = [];
    $rootScope.networkState = true;
    var parser = new UAParser;
    var device = parser.getDevice();
    var os = parser.getOS();
    if (device.type != undefined) {
        if (device.type == "mobile") {
            $rootScope.isMobile = true;
            $rootScope.device = "mobile"
        } else if (device.type == "tablet") {
            $rootScope.isMobile = true;
            $rootScope.device = "tablet"
        }
    } else {
        if (parser.getUA().match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/gi)) {
            $rootScope.isMobile = true;
            $rootScope.device = "mobile"
        }
    }
    if ($rootScope.isMobile) {
        $rootScope.txtLength = 200;
        $rootScope.cmtLength = 50
    } else {
        $rootScope.txtLength = 500;
        $rootScope.cmtLength = 200
    }
    if (os && typeof os.name != "undefined") $rootScope.os = os.name;
    $rootScope.baseURL = window.location.protocol + "//" + window.location.host + "/";
    $rootScope.loggedIn = true;
    $rootScope.currentState = $state.current;
    $rootScope.me = {};
    $rootScope.content = {
        text: "",
        photos: []
    };
    $rootScope.photoSelect = {};
    $rootScope.sharedPost = {};
    $rootScope.postFollow = {};
    $rootScope.isComment = false;
    $rootScope.gameId = false;
    $rootScope.currentPage = "";
    $rootScope.pullRunning = false;
    $rootScope.recentChats = null;
    $rootScope.recentChatIds = [];
    $rootScope.boxChats = {};
    $rootScope.totalUnreadChat = 0;
    $rootScope.listBuddies = [];
    $rootScope.listBuddieIds = [];
    $rootScope.appReady = false;
    $rootScope.notifications = [];
    $rootScope.totalUnreadNoti = 0;
    $rootScope.searchFilter = "games";
    if (typeof Audio != "undefined") $rootScope.notiSound = new Audio("/images/noti.mp3");
    else $rootScope.notiSound = {
        play: function() {},
        pause: function() {}
    };
    $rootScope.windowHeight = $window.innerHeight;
    $rootScope.windowWidth = $window.innerWidth;
    angular.element($window).bind("resize", function() {
        $rootScope.windowHeight = $window.innerHeight;
        $rootScope.windowWidth = $window.innerWidth;
        $timeout(function() {
            $rootScope.$apply()
        }, 200)
    });
    $rootScope.timeoutFav1;
    $rootScope.timeoutFav2;
    $rootScope.watchNoti = function(newVal, oldVal) {
        var totalNoti = $rootScope.totalUnreadNoti + $rootScope.totalUnreadChat;
        if (!totalNoti) {
            $timeout.cancel($rootScope.timeoutFav1);
            $timeout.cancel($rootScope.timeoutFav2);
            $rootScope.favicon = "";
            return
        }
        var favicon1 = function() {
            $rootScope.favicon = "";
            $rootScope.timeoutFav1 = $timeout(favicon2, 500)
        };
        var favicon2 = function() {
            $rootScope.favicon = "/img/onClan-hover.ico";
            $rootScope.timeoutFav2 = $timeout(favicon1, 500)
        };
        favicon1()
    };
    $rootScope.$watch("totalUnreadNoti", $rootScope.watchNoti);
    $rootScope.$watch("totalUnreadChat", $rootScope.watchNoti);
    $rootScope.hashCode = function(str) {
        var hash = 0;
        if (str.length == 0) return hash;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash
        }
        return hash
    }
});
angular.module("App").controller("rootCtrl", function($scope, $rootScope, $http, $cookies, $templateCache, $location, $window, $modal, User, Game, Post, Notification, $state, $q, $upload, $timeout, $stateParams) {
    $rootScope.showMenuSideBar = false;
    $rootScope.remind = false;
    $rootScope.closeRemind = function() {
        $rootScope.remind = false
    };
    $rootScope.showLoginBox = function() {
        if ($rootScope.loggedIn) return;
        $rootScope.remind = false;
        var modalInstance = $modal.open({
            size: "sm",
            templateUrl: "/views/signin.html?v=" + $rootScope.getAppVersion(),
            controller: "LoginCtrl"
        });
        modalInstance.result.then(function(data) {
            if (typeof data != "undefined" && data == "success") $rootScope.$broadcast("login-success", {})
        })
    };
    $scope.chooseCover = function(keySuccess) {
        if (typeof keySuccess == "undefined") return;
        var modalInstance = $modal.open({
            templateUrl: "/views/cover.html?v=" + $rootScope.getAppVersion(),
            backdrop: "static",
            resolve: {
                keySuccess: function() {
                    return keySuccess
                }
            },
            controller: "CoverUploadCtrl"
        });
        modalInstance.result.then(function(data) {
            if (typeof data.status != "undefined" && data.status) {
                $rootScope.$broadcast(data.keySuccess, {
                    image: data.image
                })
            }
        })
    };
    $scope.chooseAvatar = function(keySuccess) {
        if (typeof keySuccess == "undefined") return;
        var modalInstance = $modal.open({
            templateUrl: "/views/avatar.html?v=" + $rootScope.getAppVersion(),
            backdrop: "static",
            resolve: {
                keySuccess: function() {
                    return keySuccess
                }
            },
            controller: "AvatarUploadCtrl"
        });
        modalInstance.result.then(function(data) {
            if (typeof data.status != "undefined" && data.status) {
                $rootScope.$broadcast(data.keySuccess, {
                    image: data.image
                })
            }
        })
    };
    $scope.goNotification = function() {
        if ($rootScope.isMobile) return $state.go("notification");
        else return
    };
    $scope.goConversation = function() {
        if ($rootScope.isMobile) return $state.go("conversations");
        else return
    };
    $rootScope.goNewsfeed = function() {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        return $state.go("newsfeed", {
            filter: "all"
        })
    };
    $scope.toggleSidebarMenu = function(status) {
        if (typeof status != "undefined") $rootScope.showMenuSideBar = status;
        else $rootScope.showMenuSideBar = !$rootScope.showMenuSideBar
    };
    $scope.getLetterAvatar = function(name) {
        if (typeof name == undefined) return "";
        var code = name.toUpperCase().charCodeAt(0);
        if (code >= 65 && code <= 90) {
            var img = "letters_s-" + (code - 64) + ".png";
            var colors = ["blue", "green", "light_blue", "light_orange", "light_red", "pink", "violet", "yellow"];
            return "/images/letters/" + colors[Math.floor(Math.random() * 8)] + "/" + img
        }
        return ""
    };
    $scope.logout = function() {
        $http.post("/ajax/index.php/account/logout").success(function(data, status, header, config) {
            if (!data.error) {
                $rootScope.loggedIn = false;
                $rootScope.me = {};
                $window.location.reload()
            }
        }).error(function(data, status, header, config) {})
    };
    $scope.hideBox = function(id) {
        $modalInstance.dismiss("cancel")
    };
    $scope.pullCallback = function(data) {
        var handlePullData = function(data) {
            var databak = data;
            try {
                data = angular.fromJson(data)
            } catch (e) {
                return false
            }
            if (data.type == "MESSAGE") {
                data = data.data;
                if (data.type != "text" && data.type != "sticky" && data.type != "image" && data.type != "voice" && data.type != "left" && data.type != "add_user" && data.type != "kick_user") {
                    return false
                }
                $scope.$broadcast("receive-new-msg", data);
                if (data.type == "add_user" && !data.userId) return;
                if (data.type == "left" && data.userId == $rootScope.me.userId) {
                    var idx = _.indexOf($rootScope.recentChatIds, data.topicId);
                    if (idx == -1) return;
                    delete $rootScope.recentChats[idx];
                    delete $rootScope.recentChatIds[idx];
                    for (id in $rootScope.boxChats) {
                        if (!$rootScope.boxChats.hasOwnProperty(id)) continue;
                        if (id == data.topicId) {
                            delete $rootScope.boxChats[id];
                            break
                        }
                    }
                    if ($state.$current.name == "conversations/" && $stateParams.topicId == data.topicId) $state.go("conversations", {}, {
                        location: "replace"
                    });
                    return
                }
                if (data.type == "kick_user" && data.userId == $rootScope.me.userId) {
                    if (data.text) alert(data.text);
                    var idx = _.indexOf($rootScope.recentChatIds, data.topicId);
                    if (idx == -1) return;
                    delete $rootScope.recentChats[idx];
                    delete $rootScope.recentChatIds[idx];
                    for (id in $rootScope.boxChats) {
                        if (!$rootScope.boxChats.hasOwnProperty(id)) continue;
                        if (id == data.topicId) {
                            delete $rootScope.boxChats[id];
                            break
                        }
                    }
                    if ($state.$current.name == "conversations/" && $stateParams.topicId == data.topicId) $state.go("conversations", {}, {
                        location: "replace"
                    });
                    return
                }
                if (data.type == "kick_user" || data.type == "left") {
                    var idx = _.indexOf($rootScope.recentChatIds, data.topicId);
                    if (idx == -1) return;
                    if (typeof $rootScope.recentChats[idx].users[data.userId] !== "undefined") delete $rootScope.recentChats[idx].users[data.userId];
                    return
                }
                if (data.type == "add_user") {
                    var idx = _.indexOf($rootScope.recentChatIds, data.topicId);
                    if (idx > -1) {
                        $scope.getListUserChat(data.topicId, function(users) {
                            $rootScope.recentChats[idx].users = users
                        })
                    }
                }
                idx = _.indexOf($rootScope.recentChatIds, data.topicId);
                if ($rootScope.boxChats[data.topicId]) {
                    $rootScope.boxChats[data.topicId].mini = false
                } else if (idx >= 0 && ($state.current.name != "conversations/" || $state.params.topicId != data.topicId)) {
                    if ($rootScope.windowWidth >= 768) $scope.openBoxChat(data.topicId)
                }
                if (idx >= 0) {
                    if (data.from.userId && data.from.userId != $rootScope.me.userId || data.from.aliasId && data.from.aliasId != $rootScope.recentChats[idx].aliasId) {
                        if (!$rootScope.recentChats[idx].unread) {
                            $rootScope.totalUnreadChat++;
                            $rootScope.notiSound.play();
                            $rootScope.recentChats[idx].unread = true
                        }
                    }
                    if (!$rootScope.recentChats[idx].history) {
                        $scope.getChatHistory(data.topicId, 20);
                        return true
                    }
                    $rootScope.recentChats[idx].history.total++;
                    $rootScope.recentChats[idx].history.messages.push(data);
                    if ((data.from.userId && data.from.userId != $rootScope.me.userId || data.from.aliasId && data.from.aliasId != $rootScope.recentChats[idx].aliasId) && !$rootScope.recentChats[idx].unread) {
                        $rootScope.totalUnreadChat++;
                        $rootScope.notiSound.play();
                        $rootScope.recentChats[idx].unread = true
                    }
                    if (data.type == "image") data.text = data.from.fullname + " sent an image";
                    else if (data.type == "sticky") data.text = data.from.fullname + " sent a sticky";
                    else if (data.type == "voice") data.text = data.from.fullname + " sent a voice message";
                    if (data.from.userId) {
                        $rootScope.recentChats[idx].lastMsg = {
                            text: data.text || "",
                            timestamp: moment().format("YYYY-MM-DDTHH:mm:ssZZ"),
                            userId: data.from.userId,
                            fullname: data.from.fullname
                        }
                    } else {
                        $rootScope.recentChats[idx].lastMsg = {
                            text: data.text || "",
                            timestamp: moment().format("YYYY-MM-DDTHH:mm:ssZZ"),
                            aliasId: data.from.aliasId,
                            fullname: data.from.fullname
                        }
                    }
                    $rootScope.recentChatIds.splice(idx, 1);
                    $rootScope.recentChatIds.unshift(data.topicId);
                    removed = $rootScope.recentChats.splice(idx, 1);
                    $rootScope.recentChats.unshift(removed[0]);
                    return true
                }
                $http.get("/ajax/index.php/chat/topic/" + data.topicId).success(function(d, status, header, config) {
                    if (d.error) return false;
                    d.lastMsg = {
                        text: data.text,
                        timestamp: moment().format("YYYY-MM-DDTHH:mm:ssZZ"),
                        userId: data.from.userId,
                        fullname: data.from.fullname
                    };
                    $rootScope.recentChats.unshift(d);
                    $rootScope.recentChatIds.unshift(data.topicId);
                    return handlePullData(databak)
                }).error(function(data, status, header, config) {})
            } else if (data.type == "NOTIFICATION") {
                data = data.data;
                if (!data.action || !data.objects || !data.from) return false;
                data.read = false;
                $rootScope.notifications.unshift(data);
                $rootScope.totalUnreadNoti++;
                $rootScope.notiSound.play();
                if (data.objects.postId != undefined && data.objects.commentId != undefined) {
                    $rootScope.$broadcast("noti-comment", data.objects)
                }
            }
        };
        for (var i = 0; i < data.length; i++) {
            handlePullData(data[i])
        }
    };
    $scope.getListUserChat = function(topicId, callback) {
        $http.get("/ajax/index.php/chat/listusers/" + topicId).success(function(data, status, header, config) {
            if (data.error) return false;
            users = {};
            for (var i = 0; i < data.users.length; i++) {
                if (data.users[i].aliasId) {
                    users[data.users[i].aliasId] = data.users[i]
                } else users[data.users[i].userId] = data.users[i]
            }
            callback(users)
        }).error(function(data, status, header, config) {})
    };
    $scope.openBoxChat = function(topicId, skipGetUser) {
        if ($rootScope.boxChats[topicId]) {
            $rootScope.boxChats[topicId].mini = false;
            $rootScope.boxChats[topicId].focus = true
        } else if (Object.keys($rootScope.boxChats).length > 2) {
            for (id in $rootScope.boxChats) {
                if (!$rootScope.boxChats.hasOwnProperty(id)) continue;
                delete $rootScope.boxChats[id];
                break
            }
            $rootScope.boxChats[topicId] = {
                mini: false,
                focus: true
            }
        } else {
            $rootScope.boxChats[topicId] = {
                mini: false,
                focus: true
            }
        }
        if (skipGetUser) return true;
        idx = _.indexOf($rootScope.recentChatIds, topicId);
        if (!$rootScope.recentChats[idx].users) {
            $scope.getListUserChat(topicId, function(users) {
                $rootScope.recentChats[idx].users = users;
                for (var i in users) {
                    if (users[i].userId && users[i].userId == $rootScope.me.userId && users[i].aliasId) {
                        $rootScope.recentChats[idx].aliasId = users[i].aliasId;
                        break
                    }
                }
            })
        }
    };
    $scope.initChat = function(userId) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        idx = _.indexOf($rootScope.listBuddieIds, userId);
        if (idx > -1 && $rootScope.listBuddies[idx].topicId) return $scope.openBoxChat($rootScope.listBuddies[idx].topicId);
        return $http.get("/ajax/index.php/chat/initchat/" + userId).success(function(data, status, header, config) {
            if (_.indexOf($rootScope.recentChatIds, data.topicId) == -1) {
                data.lastMsg = {
                    text: "",
                    timestamp: moment().format("YYYY-MM-DDTHH:mm:ssZZ"),
                    userId: $rootScope.me.userId,
                    fullname: $rootScope.me.fullname
                };
                var users = data.users;
                data.users = {};
                for (var i = 0; i < users.length; i++) {
                    if (users[i].aliasId) {
                        data.users[users[i].aliasId] = users[i]
                    } else data.users[users[i].userId] = users[i];
                    if (typeof users[i].userId != "undefined" && users[i].userId == $rootScope.me.userId) data.me = users[i]
                }
                $rootScope.recentChats.unshift(data);
                $rootScope.recentChatIds.unshift(data.topicId)
            }
            if ($rootScope.windowWidth < 768) $state.go("conversations/", {
                topicId: data.topicId
            });
            else $scope.openBoxChat(data.topicId, true)
        }).error(function(data, status, header, config) {})
    };
    $scope.initChatAlias = function(aliasId) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        return $http.get("/ajax/index.php/chat/initchatalias/" + aliasId).success(function(data, status, header, config) {
            if (_.indexOf($rootScope.recentChatIds, data.topicId) == -1) {
                data.lastMsg = {
                    text: "",
                    timestamp: moment().format("YYYY-MM-DDTHH:mm:ssZZ"),
                    fullname: $rootScope.me.fullname
                };
                var users = data.users;
                data.users = {};
                for (var i = 0; i < users.length; i++) {
                    if (users[i].userId && users[i].userId == $rootScope.me.userId) {
                        data.lastMsg.aliasId = users[i].aliasId;
                        data.aliasId = users[i].aliasId
                    }
                    if (users[i].aliasId) {
                        data.users[users[i].aliasId] = users[i]
                    } else data.users[users[i].userId] = users[i];
                    if (typeof users[i].userId != "undefined" && users[i].userId == $rootScope.me.userId) data.me = users[i]
                }
                $rootScope.recentChats.unshift(data);
                $rootScope.recentChatIds.unshift(data.topicId)
            }
            if ($rootScope.windowWidth < 768) $state.go("conversations/", {
                topicId: data.topicId
            });
            else $scope.openBoxChat(data.topicId)
        }).error(function(data, status, header, config) {})
    };
    $scope.markChatAsRead = function(topicId) {
        idx = _.indexOf($rootScope.recentChatIds, topicId);
        if (idx < 0) return false;
        if (!$rootScope.recentChats[idx].unread) return false;
        $rootScope.recentChats[idx].unread = false;
        if ($rootScope.totalUnreadChat > 0) $rootScope.totalUnreadChat--
    };
    $scope.getRecentChat = function() {
        return $http.get("/ajax/index.php/chat/recent", {
            params: {
                limit: 150
            }
        }).success(function(data, status, header, config) {
            if (!data.status) return false;
            data = data.data;
            $rootScope.recentChatIds = _.pluck(data.topics, "topicId");
            $rootScope.recentChats = data.topics
        })
    };
    $scope.loadingHistory = [];
    $scope.loadingHistoryError = [];
    $scope.getChatHistory = function(topicId, limit) {
        var deferred = $q.defer();
        var idx = _.indexOf($rootScope.recentChatIds, topicId);
        if (idx < 0) {
            deferred.reject();
            return deferred.promise
        }
        if (_.indexOf($scope.loadingHistory, topicId) >= 0) {
            deferred.reject();
            return deferred.promise
        }
        var cursor = $rootScope.recentChats[idx].history ? $rootScope.recentChats[idx].history.cursor : "";
        if (!cursor.length && $rootScope.recentChats[idx].history) {
            deferred.reject();
            return deferred.promise
        }
        if (!limit) limit = 20;
        $scope.loadingHistory.push(topicId);
        $scope.loadingHistoryError.splice(_.indexOf($scope.loadingHistoryError, topicId), 1);
        $http.get("/ajax/index.php/chat/history", {
            params: {
                topicId: topicId,
                limit: limit,
                cursor: cursor
            }
        }).success(function(data, status, header, config) {
            $scope.loadingHistory.splice(_.indexOf($scope.loadingHistory, topicId), 1);
            if (data.error) {
                deferred.reject();
                $scope.loadingHistoryError.push(topicId);
                $scope.loadingHistory.splice(_.indexOf($scope.loadingHistory, topicId), 1);
                return false
            }
            if (!$rootScope.recentChats[idx].history) $rootScope.recentChats[idx].history = {
                total: 0,
                cursor: "",
                messages: []
            };
            $rootScope.recentChats[idx].history.total += data.count;
            $rootScope.recentChats[idx].history.cursor = data.cursor;
            $rootScope.recentChats[idx].history.messages = data.messages.reverse().concat($rootScope.recentChats[idx].history.messages);
            deferred.resolve()
        }).error(function(data, status, header, config) {
            deferred.reject();
            $scope.loadingHistoryError.push(topicId);
            $scope.loadingHistory.splice(_.indexOf($scope.loadingHistory, topicId), 1)
        });
        return deferred.promise
    };
    $scope.isLoadingHistory = function(topicId) {
        return _.indexOf($scope.loadingHistory, topicId) > -1
    };
    $scope.chatSendMsg = function(topicId, msg) {
        if (!msg.length) return false;
        idx = _.indexOf($rootScope.recentChatIds, topicId);
        if (idx < 0) return false;
        var topic = $rootScope.recentChats[idx];
        var params = {
            tid: topicId,
            ppub: $rootScope.recentChats[idx].pathPub,
            text: msg
        };
        if (topic.aliasId) {
            params.aid = topic.aliasId;
            params.fn = topic.users[topic.aliasId].fullname
        }
        return $http.post("/ajax/index.php/chat/sendMsg", serializeData(params))
    };
    $scope.showMessageImage = function(url) {
        var modalInstance = $modal.open({
            templateUrl: "/views/msg_photo_modal.html?v=" + $rootScope.getAppVersion(),
            controller: "MsgModalCtrl",
            resolve: {
                photoUrl: function() {
                    return url
                }
            }
        });
        modalInstance.result.then(function(data) {})
    };
    $scope.openGiftCode = function(giftcode) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        if (!giftcode.avail) {
            alert("Sorry, no code available right now, please come back later");
            return false
        }
        var modalInstance = $modal.open({
            templateUrl: "/views/giftcode.html?v=" + $rootScope.getAppVersion(),
            controller: "GiftCodeCtrl",
            backdrop: "static",
            resolve: {
                giftcode: function() {
                    return giftcode
                }
            }
        });
        modalInstance.result.then(function(data) {
            $scope.giftcode = !data
        })
    };
    $scope.openListJoinedEvent = function(event) {
        var modalInstance = $modal.open({
            templateUrl: "/views/event.user.html?v=" + $rootScope.getAppVersion(),
            controller: "EventUserCtrl",
            backdrop: "static",
            resolve: {
                event: function() {
                    return event
                }
            }
        });
        modalInstance.result.then(function(data) {})
    };
    $scope.updateAliasUser = function(gameId) {
        Game.getAlias(gameId).success(function(data, status, header, config) {
            if (data.status) {
                var aliasInfo = data.data;
                if (data.data.alias != undefined) {
                    aliasInfo.gameId = gameId
                } else {
                    aliasInfo = {
                        alias: "",
                        avatar: "",
                        cover: "",
                        gameId: gameId
                    }
                }
                var modalInstance = $modal.open({
                    templateUrl: "/views/alias.box.html?v=" + $rootScope.getAppVersion(),
                    controller: "AliasBoxCtrl",
                    backdrop: "static",
                    resolve: {
                        aliasInfo: function() {
                            return aliasInfo
                        }
                    }
                });
                modalInstance.result.then(function(data) {
                    if (data != "cancel") {
                        var newData = data;
                        $rootScope.$broadcast("update-alias-success", newData)
                    }
                })
            }
        }).error(function(data, status, header, config) {})
    };
    $scope.getAliasInfo = function(aliasId) {
        User.getAliasInfo(aliasId).success(function(data, status, header, config) {
            $rootScope.$broadcast("update-alias-success", data.data)
        }).error(function(data, status, header, config) {})
    };
    $scope.copyPostLink = function(onclanUrl) {
        var modalInstance = $modal.open({
            templateUrl: "/views/link.post.html?v=" + $rootScope.getAppVersion(),
            controller: "CopyPostLinkCtrl",
            backdrop: "static",
            resolve: {
                onclanUrl: function() {
                    return onclanUrl
                }
            }
        });
        modalInstance.result.then(function(data) {})
    };
    $scope.shareLinkTip = function(onclanUrl) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        var modalInstance = $modal.open({
            templateUrl: "/views/tipshare.box.html?v=" + $rootScope.getAppVersion(),
            controller: "ShareTipCtrl",
            backdrop: "static",
            resolve: {
                onclanUrl: function() {
                    return onclanUrl
                }
            }
        });
        modalInstance.result.then(function(data) {})
    };
    $scope.openTipEditBox = function(tip) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        var modalInstance = $modal.open({
            templateUrl: "/views/tip.edit.html?v=" + $rootScope.getAppVersion(),
            controller: "TipEditCtrl",
            backdrop: "static",
            resolve: {
                tip: function() {
                    return tip
                }
            }
        });
        modalInstance.result.then(function(data) {
            var tip = data;
            if (data.tipId != undefined) {
                $rootScope.$broadcast("update-tip-success", tip)
            }
        })
    };
    $scope.openPhotoBox = function(photoId) {
        var modalInstance = $modal.open({
            templateUrl: "/views/photo.html?v=" + $rootScope.getAppVersion(),
            controller: "PhotoCtrl",
            size: "lg",
            windowClass: "dialog-photo",
            resolve: {
                photoId: function() {
                    return photoId
                }
            }
        });
        modalInstance.result.then(function(data) {})
    };
    $rootScope.acceptJoinClanNoti = function(index) {
        var noti = $rootScope.notifications[index];
        var clanId = noti.objects.clanId;
        var userId = noti.from.userId;
        Notification.acceptJoinClan(clanId, userId).success(function(data) {
            if (data.data) {
                if (!noti.read) {
                    Notification.markRead(noti.notificationId).success(function(data) {
                        if (data.data) {
                            Notification.deleteNoti(noti.notificationId).success(function(data, status, header, config) {
                                if ($rootScope.totalUnreadNoti) $rootScope.totalUnreadNoti--;
                                $rootScope.notifications.splice(index, 1)
                            }).error(function(data, status, header, config) {})
                        }
                    })
                } else {
                    Notification.deleteNoti(noti.notificationId).success(function(data, status, header, config) {
                        $rootScope.notifications.splice(index, 1)
                    }).error(function(data, status, header, config) {})
                }
            } else {}
        })
    };
    $rootScope.rejectClanNoti = function(index) {
        var noti = $rootScope.notifications[index];
        var clanId = noti.objects.clanId;
        var userId = noti.from.userId;
        Notification.rejectClan(clanId, userId).success(function(data) {
            if (data.data) {
                if (!noti.read) {
                    Notification.markRead(noti.notificationId).success(function(data) {
                        if (data.data) {
                            Notification.deleteNoti(noti.notificationId).success(function(data, status, header, config) {
                                if ($rootScope.totalUnreadNoti) $rootScope.totalUnreadNoti--;
                                $rootScope.notifications.splice(index, 1)
                            }).error(function(data, status, header, config) {})
                        }
                    })
                } else {
                    Notification.deleteNoti(noti.notificationId).success(function(data, status, header, config) {
                        $rootScope.notifications.splice(index, 1)
                    }).error(function(data, status, header, config) {})
                }
            } else {}
        })
    };
    $rootScope.followUserNoti = function(index) {
        var noti = $rootScope.notifications[index];
        if (!noti.read) {
            Notification.markRead(noti.notificationId).success(function(data) {
                if (data.data) {
                    $rootScope.notifications[index].read = true;
                    if ($rootScope.totalUnreadNoti) $rootScope.totalUnreadNoti--
                }
            })
        }
        User.follow(noti.from.userId).success(function(data) {
            if (data.status) {
                $rootScope.notifications[index].from.followed = true
            }
        })
    };
    $rootScope.selectNoti = function(index) {
        var noti = $rootScope.notifications[index];
        if (!noti.read) {
            Notification.markRead(noti.notificationId).success(function(data) {
                if (data.data) {
                    $rootScope.notifications[index].read = true;
                    if ($rootScope.totalUnreadNoti) $rootScope.totalUnreadNoti--
                }
            })
        }
        if (noti.objects.videoId) {
            var post = Post.getPost(noti.objects.videoId).success(function(data) {
                if (data.status) {
                    var gameId = data.data.to.slug || data.data.to.gameId;
                    return $state.go("game.videodetail", {
                        gameId: gameId,
                        postId: noti.objects.videoId
                    })
                }
                return $state.go("error")
            }).error(function() {
                return $state.go("error")
            });
            return
        }
        if (noti.objects.photoId != undefined) {
            return $scope.openPhotoBox(noti.objects.photoId)
        }
        if (noti.objects.tipId != undefined) {
            return $state.go("tip", {
                tipId: noti.objects.tipId
            })
        }
        if (noti.objects.postId != undefined) {
            return $location.path("/post/" + noti.objects.postId)
        }
        if (noti.objects.eventId != undefined) {
            return $location.path("/game/" + noti.objects.gameId + "/event/" + noti.objects.eventId)
        }
        if (noti.objects.gameId != undefined) {
            return $location.path("/game/" + noti.objects.gameId)
        }
        if (noti.objects.clanId != undefined) {
            return $location.path("/clan/" + noti.objects.clanId)
        }
        if (noti.action == "follow") {
            return $location.path("/user/" + noti.from.userId)
        }
    };
    $rootScope.markAsReadAllNoti = function() {
        $http.post("/ajax/index.php/notification/markReadAll").success(function() {
            $rootScope.notifications.forEach(function(noti, i) {
                noti.read = true
            });
            $rootScope.totalUnreadNoti = 0
        })
    };
    $rootScope.deleteNotice = function(index) {
        var noti = $rootScope.notifications[index];
        Notification.deleteNoti(noti.notificationId).success(function(data, status, header, config) {
            if (!noti.read) {
                if ($rootScope.totalUnreadNoti) $rootScope.totalUnreadNoti--
            }
            $rootScope.notifications.splice(index, 1)
        }).error(function(data, status, header, config) {})
    };
    $scope.changeState = function(state, params) {
        $state.go(state, params)
    };
    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams, $filter) {
        if (typeof toState.templateUrl !== "undefined") {
            $templateCache.remove(toState.templateUrl)
        }
        if (typeof fromState.templateUrl !== "undefined") {
            $templateCache.remove(fromState.templateUrl)
        }
        var text = $rootScope.content.text;
        $rootScope.showMenuSideBar = false;
        text = text.replace(/(<br>|&nbsp;)/g, "");
        if (text.trim() || $rootScope.content.photos.length > 0) {
            var confirm = window.confirm("You haven't finished your post yet. Do you want to leave without finishing?");
            if (!confirm) {
                window.history.back();
                event.preventDefault()
            } else {
                $rootScope.content.text = "";
                var f = fromState.name.split(".");
                var t = toState.name.split(".");
                if (f[0] != t[0]) $rootScope.pageTitle = "";
                if ($rootScope.content.photos.length > 0) {
                    for (key in $rootScope.content.photos) {
                        var photoId = $rootScope.content.photos[key].photoId;
                        Post.deletePhoto(photoId).success(function(data, status, header, config) {}).error(function(data, status, header, config) {})
                    }
                    $rootScope.content.photos = []
                }
            }
        } else {
            var f = fromState.name.split(".");
            var t = toState.name.split(".");
            if (f[0] != t[0]) $rootScope.pageTitle = ""
        }
    });
    $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
        $rootScope.remind = false;
        $rootScope.currentState = toState;
        $rootScope.previousState = fromState;
        if ($cookies.onclan) {} else {
            $rootScope.loggedIn = false
        }
    });
    $scope.deletePhoto = function() {};
    $scope.init = function() {
        User.getUserInfo("me").success(function(data) {
            if (data.status) {
                $rootScope.loggedIn = true;
                $rootScope.$broadcast("get-user-info-success", {});
                $rootScope.me = data.data;
                if (!$rootScope.recentChats) {
                    $scope.getRecentChat().then(function() {
                        $rootScope.appReady = true
                    })
                } else $rootScope.appReady = true;
                User.pull($scope.pullCallback)
            } else {
                $rootScope.loggedIn = false;
                $rootScope.appReady = true
            }
        }).error(function() {
            $rootScope.appReady = true
        })
    };
    $scope.$on("login-success", function(event, args) {
        $rootScope.appReady = false;
        $scope.init()
    });
    $scope.init();
    $scope.shareLinkToFb = function(url) {
        $timeout(function() {
            $window.FB.ui({
                method: "share",
                href: url
            }, function(response) {})
        }, 10)
    };
    $scope.chatSendPhoto = function(topic, files, event) {
        if (!files.length) return false;
        var idx = _.indexOf($rootScope.recentChatIds, topic.topicId);
        var params = {
            tid: topic.topicId,
            ppub: topic.pathPub
        };
        if (topic.aliasId) {
            params.aid = topic.aliasId;
            params.fn = topic.users[topic.aliasId].fullname
        }
        $rootScope.recentChats[idx].sendingPhoto = true;
        $upload.upload({
            url: "/ajax/index.php/chat/sendPhoto",
            data: params,
            file: files
        }).progress(function() {}).success(function(data) {
            $rootScope.recentChats[idx].sendingPhoto = false;
            if (!data.status) return false
        }).error(function() {
            $rootScope.recentChats[idx].sendingPhoto = false
        })
    };
    $scope.moment = function(timestamp) {
        return moment(timestamp)
    };
    $scope.chatAddPeople = function(topic) {
        var modalInstance = $modal.open({
            templateUrl: "/views/select_friend_modal.html?v=" + $rootScope.getAppVersion(),
            controller: "SelectFriendCtrl",
            backdrop: "static",
            resolve: {
                excludes: function() {
                    return Object.keys(topic.users)
                }
            }
        });
        modalInstance.result.then(function(data) {
            if (topic.type == "user") {
                if (topic.subType !== undefined && topic.subType != "user_user") return;
                for (var i in topic.users) {
                    data[i] = topic.users[i]
                }
                return $scope.createGroupChat(data)
            }
            if (topic.type != "group") return;
            $http.post("/ajax/index.php/chat/addPeople", serializeData({
                topicId: topic.topicId,
                users: Object.keys(data).join(",")
            })).success(function(data) {
                if (!data.status) return false;
                var idx = _.indexOf($rootScope.recentChatIds, topic.topicId);
                for (var i = 0; i < data.data.count; i++) {
                    $rootScope.recentChats[idx].users.push(data.data.users[i])
                }
            }).error(function() {})
        })
    };
    $scope.selectFriendCreateGroupChat = function() {
        var modalInstance = $modal.open({
            templateUrl: "/views/select_friend_modal.html?v=" + $rootScope.getAppVersion(),
            controller: "SelectFriendCtrl",
            backdrop: "static",
            resolve: {
                excludes: null
            }
        });
        modalInstance.result.then(function(data) {
            return $scope.createGroupChat(data)
        })
    };
    $scope.createGroupChat = function(users) {
        var count = Object.keys(users).length;
        if (!count) return false;
        if (count == 1) {
            return $scope.initChat(Object.keys(users)[0])
        }
        $http.post("/ajax/index.php/chat/group", serializeData({
            users: Object.keys(users).join(",")
        })).success(function(data) {
            if (!data.status) return false;
            data = data.data;
            data.role = "creator";
            $rootScope.recentChatIds.unshift(data.topicId);
            var users = data.users;
            data.users = {};
            for (var i in users) {
                if (users[i].aliasId) data.users[users[i].aliasId] = users[i];
                else data.users[users[i].userId] = users[i];
                if (users[i].userId && users[i].userId == $rootScope.me.userId) {
                    data.aliasId = users[i].aliasId;
                    data.me = users[i];
                    if (users[i].creator) data.role = "creator";
                    else if (users[i].role) data.role = users[i].role
                }
            }
            $rootScope.recentChats.unshift(data);
            if ($state.$current.name == "conversations/" || $state.$current.name == "conversations") $state.go("conversations/", {
                topicId: data.topicId
            });
            else $scope.openBoxChat(data.topicId)
        }).error(function() {})
    };
    $scope.leaveChat = function(topic) {
        var confirm = $window.confirm("Are you sure?");
        if (!confirm) return false;
        $http.post("/ajax/index.php/chat/leave", serializeData({
            topicId: topic.topicId
        })).success(function(data) {
            if (!data.status) return false;
            var idx = _.indexOf($rootScope.recentChatIds, topic.topicId);
            $rootScope.recentChatIds.splice(idx, 1);
            $rootScope.recentChats.splice(idx, 1);
            for (id in $rootScope.boxChats) {
                if (!$rootScope.boxChats.hasOwnProperty(id)) continue;
                if (id == topic.topicId) {
                    delete $rootScope.boxChats[id];
                    break
                }
            }
            if ($state.$current.name == "conversations" || $state.$current.name == "conversations/") $state.go("conversations")
        }).error(function() {
            alert("Something went wrong, please try again later")
        })
    }
});
angular.module("App").controller("SelectFriendCtrl", function($scope, $modalInstance, $http, $q, excludes) {
    $scope.close = function() {
        $modalInstance.dismiss("cancel")
    };
    $scope.selected = {};
    $scope.search = {
        keyword: "",
        result: []
    };
    $scope.timer = 0;
    $scope.canceller = $q.defer();
    $scope.searching = false;
    $scope.select = function(idx) {
        var u = $scope.search.result[idx];
        $scope.selected[u.userId] = u
    };
    $scope.unselect = function(userId) {
        delete $scope.selected[userId]
    };
    $scope.searchBuddy = function(keyword) {
        if (!keyword.length) {
            clearTimeout($scope.timer);
            $scope.canceller.resolve();
            $scope.search.result = [];
            return
        }
        clearTimeout($scope.timer);
        $scope.timer = setTimeout(function() {
            $scope.canceller.resolve();
            $scope.canceller = $q.defer();
            $scope.searching = true;
            $http.get("/ajax/index.php/search/buddies/" + encodeURIComponent(keyword), {
                timeout: $scope.canceller.promise
            }).success(function(data) {
                $scope.searching = false;
                if (!data.status) return false;
                if (!excludes || !excludes.length) $scope.search.result = data.data.results;
                else {
                    angular.forEach(data.data.results, function(u, i) {
                        if (_.indexOf(excludes, u.userId) == -1) $scope.search.result.push(u)
                    })
                }
            }).error(function() {
                $scope.searching = false
            })
        }, 300)
    };
    $scope.submit = function() {
        $modalInstance.close($scope.selected)
    }
});
angular.module("App").controller("ChatListUserCtrl", function($scope, $modalInstance, topic, User) {
    $scope.users = topic.users;
    $scope.role = topic.role;
    $scope.close = function() {
        $modalInstance.dismiss("cancel")
    };
    $scope.follow = function(userId) {
        User.follow(userId).success(function(data) {
            if (!data.status) return;
            $scope.users[userId].followed = true
        })
    };
    $scope.unfollow = function(userId) {
        User.unFollow(userId).success(function(data) {
            if (!data.status) return;
            $scope.users[userId].followed = false
        })
    }
});
angular.module("App").controller("MsgModalCtrl", function($scope, $modalInstance, photoUrl) {
    $scope.photoUrl = photoUrl;
    $scope.fullscreen = function() {
        var element = document.getElementsByClassName("modal-body");
        if (element[0].requestFullScreen) {
            element[0].requestFullscreen()
        } else if (element[0].mozRequestFullScreen) {
            element[0].mozRequestFullScreen()
        } else if (element[0].webkitRequestFullscreen) {
            element[0].webkitRequestFullscreen()
        } else if (element[0].msRequestFullscreen) {
            element[0].msRequestFullscreen()
        }
    };
    $scope.close = function() {
        $modalInstance.dismiss("cancel")
    }
});
angular.module("App").controller("MsgCtrl", ["$scope", "$rootScope", "$window", "$http", function($scope, $rootScope, $window, $http) {
    $scope.init = function(msg) {
        $scope.msg = msg;
        if (msg.type == "voice") {
            $scope.msg.loading = false;
            $scope.msg.voice = new Audio(msg.url);
            $scope.msg.voice.preload = "none";
            $scope.msg.voice.addEventListener("ended", function() {
                $scope.msg.voice.pause();
                $scope.$apply()
            });
            $scope.msg.voice.addEventListener("play", function() {
                $rootScope.$broadcast("voice-play", {
                    msgId: $scope.msg.messageId
                })
            });
            $scope.msg.voice.addEventListener("pause", function() {});
            $scope.msg.voice.addEventListener("timeupdate", function() {
                $scope.seekbarWidth = parseInt(45 * ($scope.msg.voice.currentTime / $scope.msg.voice.duration));
                $scope.$apply()
            });
            $scope.msg.voice.addEventListener("canplay", function() {
                $scope.msg.loading = false;
                $scope.$apply()
            });
            $scope.msg.voice.addEventListener("progress", function() {});
            $scope.msg.voice.addEventListener("waiting", function() {
                $scope.msg.loading = true;
                $scope.$apply()
            });
            $scope.msg.voice.addEventListener("error", function() {
                $scope.msg.loading = false;
                $scope.$apply()
            })
        } else if ($scope.msg.type == "sticky") {
            if ($window.localStorage[$scope.msg.emojiId]) $scope.msg.url = $window.localStorage[$scope.msg.emojiId];
            else {
                $http.get("/ajax/index.php/chat/emojis/" + $scope.msg.emojiId).success(function(data) {
                    if (!data.status) return;
                    for (var i = 0; i < data.data.emojis.length; i++) {
                        $window.localStorage[data.data.emojis[i].emojiId] = data.data.emojis[i].url;
                        if (data.data.emojis[i].emojiId == $scope.msg.emojiId) $scope.msg.url = data.data.emojis[i].url
                    }
                })
            }
        }
    };
    $scope.playPause = function(action) {
        if (!action) action = $scope.msg.voice.paused ? "play" : "pause";
        if (action == "pause") {
            $scope.msg.voice.pause()
        } else if (action == "play") {
            $scope.msg.loading = true;
            $scope.msg.voice.play()
        }
    };
    $scope.$on("voice-play", function(e, arg) {
        if ($scope.msg.type != "voice") return;
        if (arg.msgId == $scope.msg.messageId) return;
        $scope.playPause("pause");
        $scope.$apply()
    })
}]);
angular.module("App").controller("LoginCtrl", function($scope, $rootScope, $http, $location, $state, $modalInstance, $modal, User, AuthService) {
    $scope.error = "";
    $scope.state = "";
    $scope.method = AuthService.method;
    $scope.token = AuthService.token;
    $scope.email = AuthService.email;
    $scope.loginAppota = function() {
        if ($scope.state == "loading") return false;
        $scope.method = "appota";
        AuthService.method = "appota";
        $scope.state = "loading";
        $scope.error = "";
        $http.post("/ajax/index.php/account/login", serializeData({
            username: $scope.username,
            password: $scope.password
        })).success(function(data, status, header, config) {
            if (data.userId) {
                $scope.state = "success";
                $rootScope.loggedIn = true;
                User.getUserInfo("me").success(function(data) {
                    if (data.status) {
                        $rootScope.me = data.data;
                        User.pull($scope.$parent.pullCallback);
                        $modalInstance.close("success");
                        if ($rootScope.me.totalFollowedGame == 0) {
                            $location.path("gamesuggest")
                        } else {
                            if ($state.current.name == "home" || $state.current.name == "games") $location.path("/newsfeed/all")
                        }
                    } else {
                        $scope.state = "error";
                        $scope.error = "Failed to get user's info"
                    }
                })
            } else {
                $scope.error = data.error;
                $scope.state = "error"
            }
        }).error(function(data, status, header, config) {
            $scope.error = "System busy now, please try again later!";
            $scope.state = "error"
        })
    };
    $scope.loginFacebook = function(token) {
        if (!token) {
            window.open("https://www.facebook.com/v2.0/dialog/oauth?response_type=token&display=popup&scope=user_birthday,user_friends,email,public_profile&client_id=345079625589229&auth_type=rerequest&redirect_uri=" + $rootScope.baseURL + "ajax/index.php/account/redirect/fb", "_blank ", "width=600,height=400");
            return true
        }
        AuthService.method = "facebook";
        $scope.method = AuthService.method;
        $scope.state = "loading";
        $scope.error = "";
        AuthService.token = token;
        $scope.token = token;
        $http.post("/ajax/index.php/account/login_facebook", serializeData({
            token: token
        })).success(function(data, status, header, config) {
            if (data.userId) {
                $scope.state = "success";
                $rootScope.loggedIn = true;
                $rootScope.$broadcast("login-success", {});
                User.getUserInfo("me").success(function(data) {
                    if (data.status) {
                        $rootScope.me = data.data;
                        User.pull($scope.$parent.pullCallback);
                        $modalInstance.close("success");
                        if ($rootScope.me.totalFollowedGame == 0) {
                            $location.path("gamesuggest")
                        } else {
                            if ($state.current.name == "home" || $state.current.name == "games") $location.path("/newsfeed/all")
                        }
                    } else {
                        $scope.state = "error";
                        $scope.error = "Failed to get user's info"
                    }
                })
            } else {
                if (data.error == "15") {
                    $http.get("https://graph.facebook.com/v2.0/me?fields=name,email&access_token=" + token).success(function(data) {
                        if (!data.email) {
                            $scope.error = "Cannot connect to your facebook account";
                            $scope.state = "error";
                            return
                        }
                        AuthService.email = data.email;
                        $scope.email = data.email;
                        $scope.fullname = data.name;
                        $scope.switchForm("signup")
                    }).error(function() {
                        $scope.error = "Cannot connect to your facebook account";
                        $scope.state = "error";
                        return
                    });
                    return $scope.signupFacebook(token);
                    return
                }
                $scope.error = data.error;
                $scope.state = "error"
            }
        }).error(function(data, status, header, config) {
            $scope.error = "System busy now, please try again later!";
            $scope.state = "error"
        })
    };
    $scope.loginGoogle = function(token) {
        if (!token) {
            window.open("https://accounts.google.com/o/oauth2/auth?redirect_uri=" + $rootScope.baseURL + "ajax/index.php/account/redirect/google&response_type=token&client_id=45068113097-a8b2m08uv4onji9s8neehbkg944dm0aj.apps.googleusercontent.com&scope=profile+email&approval_prompt=force", "_blank", "width=600,height=580");
            return true
        }
        AuthService.method = "google";
        $scope.method = "google";
        $scope.state = "loading";
        $scope.error = "";
        $scope.token = token;
        $http.post("/ajax/index.php/account/login_google", serializeData({
            token: token
        })).success(function(data, status, header, config) {
            if (data.userId) {
                $scope.state = "success";
                $rootScope.loggedIn = true;
                $rootScope.$broadcast("login-success", {});
                User.getUserInfo("me").success(function(data) {
                    if (data.status) {
                        $rootScope.me = data.data;
                        User.pull($scope.$parent.pullCallback);
                        $modalInstance.close("success");
                        if ($rootScope.me.totalFollowedGame == 0) {
                            $location.path("gamesuggest")
                        } else {
                            if ($state.current.name == "home" || $state.current.name == "games") $location.path("/newsfeed/all")
                        }
                    } else {
                        $scope.state = "error";
                        $scope.error = "Failed to get user's info"
                    }
                })
            } else {
                if (data.error == "15") {
                    $http.get("https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" + token).success(function(data) {
                        if (!data.email) {
                            $scope.error = "Cannot connect to your google account";
                            $scope.state = "error";
                            return
                        }
                        AuthService.email = data.email;
                        $scope.email = data.email;
                        $scope.fullname = data.given_name + " " + data.family_name;
                        $scope.switchForm("signup")
                    }).error(function() {
                        $scope.error = "Cannot connect to your google account";
                        $scope.state = "error";
                        return
                    });
                    return
                }
                $scope.error = data.error;
                $scope.state = "error"
            }
        }).error(function(data, status, header, config) {
            $scope.error = "System busy now, please try again later!";
            $scope.state = "error"
        })
    };
    $scope.signupAppota = function() {
        if ($scope.state == "loading") return false;
        $scope.state = "loading";
        $scope.error = "";
        $http.post("/ajax/index.php/account/register", serializeData({
            username: $scope.username,
            password: $scope.password,
            email: $scope.email
        })).success(function(data, status, header, config) {
            if (data.userId) {
                $scope.state = "success";
                $rootScope.error = "Check your mailbox to active account";
                $rootScope.loggedIn = true;
                $rootScope.$broadcast("login-success", {});
                User.getUserInfo("me").success(function(data) {
                    if (data.status) {
                        $rootScope.me = data.data;
                        $modalInstance.close("success");
                        User.pull($scope.$parent.pullCallback);
                        if ($rootScope.me.totalFollowedGame == 0) {
                            $location.path("gamesuggest")
                        } else {
                            if ($state.current.name == "home" || $state.current.name == "games") $location.path("/newsfeed/all")
                        }
                    } else {
                        $scope.state = "error";
                        $scope.error = "Failed to get user's info"
                    }
                })
            } else {
                $scope.error = data.error;
                $scope.state = "error"
            }
        }).error(function(data, status, header, config) {
            $scope.error = "System busy now, please try again later!";
            $scope.state = "error"
        })
    };
    $scope.signupGoogle = function(token) {
        $scope.state = "loading";
        $scope.error = "";
        $http.post("/ajax/index.php/account/register_google", serializeData({
            token: token,
            username: $scope.username,
            email: $scope.email,
            password: $scope.password
        })).success(function(data, status, header, config) {
            if (data.userId) {
                $scope.state = "success";
                $rootScope.loggedIn = true;
                $rootScope.$broadcast("login-success", {});
                User.getUserInfo("me").success(function(data) {
                    if (data.status) {
                        $rootScope.me = data.data;
                        User.pull($scope.$parent.pullCallback);
                        $modalInstance.close("success");
                        if ($rootScope.me.totalFollowedGame == 0) {
                            $location.path("gamesuggest")
                        } else {
                            if ($state.current.name == "home" || $state.current.name == "games") $location.path("/newsfeed/all")
                        }
                    } else {
                        $scope.state = "error";
                        $scope.error = "Failed to get user's info"
                    }
                })
            } else {
                $scope.error = data.error;
                $scope.state = "error"
            }
        }).error(function(data, status, header, config) {
            $scope.error = "System busy now, please try again later!";
            $scope.state = "error"
        })
    };
    $scope.signupFacebook = function(token) {
        $scope.state = "loading";
        $scope.error = "";
        $http.post("/ajax/index.php/account/register_facebook", serializeData({
            token: token,
            username: $scope.username,
            email: $scope.email,
            password: $scope.password
        })).success(function(data, status, header, config) {
            if (data.userId) {
                $scope.state = "success";
                $rootScope.loggedIn = true;
                $rootScope.$broadcast("login-success", {});
                User.getUserInfo("me").success(function(data) {
                    if (data.status) {
                        $rootScope.me = data.data;
                        User.pull($scope.$parent.pullCallback);
                        $modalInstance.close("success");
                        if ($rootScope.me.totalFollowedGame == 0) {
                            $location.path("gamesuggest")
                        } else {
                            if ($state.current.name == "home" || $state.current.name == "games") $location.path("/newsfeed/all")
                        }
                    } else {
                        $scope.state = "error";
                        $scope.error = "Failed to get user's info"
                    }
                })
            } else {
                $scope.error = data.error;
                $scope.state = "error"
            }
        }).error(function(data, status, header, config) {
            $scope.error = "System busy now, please try again later!";
            $scope.state = "error"
        })
    };
    $scope.switchForm = function(to) {
        $scope.closeModal();
        var modalInstance = $modal.open({
            size: "sm",
            templateUrl: "/views/" + to + ".html?v=" + $rootScope.getAppVersion(),
            controller: "LoginCtrl"
        });
        modalInstance.result.then(function(data) {})
    };
    $scope.closeModal = function() {
        $modalInstance.close("cancel")
    }
});
angular.module("App").controller("ChatSideBarCtrl", function($scope, $rootScope, $http, User) {
    User.getFriend().success(function(data, status, header, config) {
        if (!data.status) return false;
        for (var i = 0; i < data.data.buddies.length; i++) {
            $rootScope.listBuddies = data.data.buddies;
            $rootScope.listBuddieIds = _.pluck(data.data.buddies, "userId")
        }
    }).error(function(data, status, header, config) {})
});
angular.module("App").controller("BoxChatCtrl", function($scope, $rootScope, $http, User) {
    $scope.inputMsg = "";
    $scope.toggleBoxChat = function(topicId) {
        $rootScope.boxChats[topicId].mini = $rootScope.boxChats[topicId].mini ? false : true
    };
    $scope.closeBoxChat = function(topicId) {
        for (id in $rootScope.boxChats) {
            if (!$rootScope.boxChats.hasOwnProperty(id)) continue;
            if (id == topicId) {
                delete $rootScope.boxChats[id];
                break
            }
        }
    };
    $scope.init = function(topicId) {
        $scope.topicId = topicId;
        $scope.mini = false;
        $scope.focus = false
    }
});
angular.module("App").controller("SideBarCtrl", function($scope, $rootScope, $cookieStore, $location) {
    $scope.listFeed = [{
        name: "All",
        "value ": ""
    }, {
        name: "Followings",
        value: "followings"
    }, {
        name: "Games",
        value: "games"
    }];
    $scope.listOrderGame = [{
        name: "Hot",
        value: "hot"
    }, {
        name: "New",
        value: "new"
    }];
    $scope.selectFeed = function(index) {
        var filter = $scope.listFeed[index].value;
        $location.path("/home/" + filter)
    };
    $scope.selectOrderGame = function(index) {
        var order = $scope.listOrderGame[index].value;
        $location.path("/games/" + order)
    };
    $scope.listOrderClan = [{
        name: "My clan",
        value: ""
    }, {
        name: "Hot",
        value: "hot"
    }, {
        name: "New",
        value: "new"
    }];
    $scope.selectOrderClan = function(index) {
        var filter = $scope.listOrderClan[index].value;
        $location.path("/clans/" + filter)
    }
});
angular.module("App").controller("ConversationCtrl", function($scope, $rootScope, $location, $stateParams, $state, $http, $window, $modal, $upload) {
    if (!$rootScope.loggedIn && $state.$current.name != "game.live" && $state.$current.name != "game.videodetail") {
        $state.go("home");
        return
    }
    $scope.isboxchat = false;
    $scope.input = {
        text: "",
        pressEnterToSend: false
    };
    $scope.sendQueue = [];
    $scope.sendedIds = [];
    $scope.receivedIds = [];
    if ($window.localStorage.pets == "true") $scope.input.pressEnterToSend = true;
    $scope.showListChat = false;
    $scope.editing = false;
    $scope.openStickerBox = false;
    $scope.toggleStickerBox = function(status, event) {
        if (event) event.stopPropagation();
        if (status == "on") $scope.openStickerBox = true;
        else if (status == "off") $scope.openStickerBox = false;
        else $scope.openStickerBox = !$scope.openStickerBox
    };
    $scope.toggleEditTopic = function() {
        if (!$scope.editing) $scope.topic.newName = $scope.topic.name;
        else $scope.topic.newName = "";
        $scope.editing = !$scope.editing
    };
    $scope.chatShowListPeople = function(topic) {
        var modalInstance = $modal.open({
            templateUrl: "/views/chat_list_user_modal.html?v=" + $rootScope.getAppVersion(),
            controller: "ChatListUserCtrl",
            backdrop: "static",
            scope: $scope,
            resolve: {
                topic: function() {
                    return topic
                }
            }
        })
    };
    $scope.updateTopic = function() {
        if (!$scope.topic.newName) {
            $scope.editing = false;
            return
        }
        $http.post("/ajax/index.php/chat/updateInfo", serializeData({
            topicId: $scope.topic.topicId,
            name: $scope.topic.newName
        })).success(function(data) {
            $scope.editing = false;
            if (!data.status) {
                $scope.topic.newName = "";
                return
            }
            $scope.topic.name = $scope.topic.newName;
            $scope.topic.newName = ""
        }).error(function() {
            $scope.topic.newName = "";
            $scope.editing = false
        })
    };
    $scope.toggleEnterToSend = function() {
        $window.localStorage.pets = $scope.input.pressEnterToSend
    };
    $scope.toggleListChat = function() {
        $scope.showListChat = $scope.showListChat ? false : true
    };
    $scope.sendMsgByPressEnter = function(e) {
        if (!$scope.input.pressEnterToSend) return false;
        e.preventDefault();
        $scope.sendMsg()
    };
    $scope.sendMsg = function(msg) {
        if (msg === undefined) msg = $scope.input.text;
        if (!msg.length) return;
        var msg = {
            type: "text",
            text: msg,
            from: {
                fullname: $scope.topic.me.fullname,
                avatar: $scope.topic.me.avatar
            },
            timestamp: moment().format("YYYY-MM-DDTHH:mm:ssZZ"),
            messageId: ""
        };
        if ($scope.topic.me.aliasId) msg.from.aliasId = $scope.topic.me.aliasId;
        else msg.from.userId = $scope.topic.me.userId;
        $scope.sendQueue.push(msg);
        $scope.input.text = "";
        $scope.$parent.markChatAsRead($scope.topicId)
    };
    $scope.sendSticky = function(emoji) {
        var msg = {
            type: "sticky",
            text: "",
            from: {
                fullname: $scope.topic.me.fullname,
                avatar: $scope.topic.me.avatar
            },
            url: emoji.url,
            emojiId: emoji.emojiId,
            timestamp: moment().format("YYYY-MM-DDTHH:mm:ssZZ"),
            messageId: ""
        };
        if ($scope.topic.me.aliasId) msg.from.aliasId = $scope.topic.me.aliasId;
        else msg.from.userId = $scope.topic.me.userId;
        $scope.sendQueue.push(msg);
        $scope.toggleStickerBox("off")
    };
    $scope.selectEmoji = function(emoji) {
        $scope.input.text += emoji
    };
    $scope.initBox = function(topicId) {
        $scope.topicId = topicId;
        var idx = _.indexOf($rootScope.recentChatIds, $scope.topicId);
        if (idx == -1) {
            $state.go("home", {}, {
                location: "replace"
            });
            return
        }
        $scope.topic = $rootScope.recentChats[idx];
        if ($state.$current.name == "conversations/") $rootScope.pageTitle = $scope.topic.name + " | onClan";
        if (!$scope.topic.history) {
            $scope.$parent.getChatHistory($scope.topicId)
        }
        $scope.topic.url = "";
        if ($scope.topic.type == "clan") $scope.topic.url = $state.href("clan.activity", {
            clanId: $scope.topicId
        });
        if (!$scope.topic.users) {
            $scope.$parent.getListUserChat($scope.topicId, function(users) {
                $rootScope.recentChats[idx].users = users;
                for (var i in users) {
                    if (users[i].userId && users[i].userId == $rootScope.me.userId) {
                        $rootScope.recentChats[idx].aliasId = users[i].aliasId;
                        $rootScope.recentChats[idx].me = users[i];
                        $scope.topic.me = users[i];
                        if (users[i].creator) $scope.topic.role = "creator";
                        else if (users[i].role) $scope.topic.role = users[i].role;
                        if ($scope.topic.type != "user") break
                    }
                }
                if ($scope.topic.type == "user") {
                    _users = angular.copy(users);
                    delete _users[i];
                    i = Object.keys(_users)[0];
                    if (users[i].aliasId) $scope.topic.url = $state.href("alias", {
                        aliasId: users[i].aliasId
                    });
                    else $scope.topic.url = $state.href("user.activity", {
                        userId: users[i].username || users[i].userId
                    })
                }
            })
        }
    };
    $scope.init = function() {
        $scope.$watch("appReady", function(newVal, oldVal) {
            if (newVal) {
                if (!$stateParams.topicId) {
                    if ($rootScope.recentChatIds.length) {
                        $state.go("conversations/", {
                            topicId: $rootScope.recentChatIds[0]
                        }, {
                            location: "replace"
                        })
                    }
                    return true
                }
                var idx = _.indexOf($rootScope.recentChatIds, $stateParams.topicId);
                if (idx > -1) return $scope.initBox($stateParams.topicId);
                $http.get("/ajax/index.php/chat/topic/" + $stateParams.topicId).success(function(data) {
                    if (data.error) {
                        $state.go("home", {}, {
                            location: "replace"
                        });
                        return
                    }
                    if (!data.lastMsg) data.lastMsg = {};
                    if (typeof data.alias != "undefined") data.aliasId = data.alias.aliasId;
                    $rootScope.recentChats.unshift(data);
                    $rootScope.recentChatIds.unshift(data.topicId);
                    return $scope.initBox($stateParams.topicId)
                }).error(function() {
                    $state.go("error");
                    return
                })
            }
        })
    };
    $scope.removeUser = function(userId, fullname) {
        var confirm = $window.confirm("Remove " + fullname + " from conversation?");
        if (!confirm) return;
        $http.post("/ajax/index.php/chat/removeUser", serializeData({
            uid: userId,
            tid: $scope.topic.topicId
        })).success(function(data) {
            if (!data.status) return false;
            delete $scope.topic.users[userId];
            var idx = _.indexOf($rootScope.recentChatIds, $scope.topic.topicId);
            if (idx <= -1) return;
            delete $rootScope.recentChats[idx].users[userId]
        }).error(function() {})
    };
    $scope.sendPhoto = function(files, event) {
        if (!files.length) return false;
        var params = {
            tid: $scope.topic.topicId,
            ppub: $scope.topic.pathPub
        };
        if ($scope.topic.aliasId) {
            params.aid = $scope.topic.aliasId;
            params.fn = $scope.topic.me.fullname
        }
        $scope.topic.sendingPhoto = true;
        $upload.upload({
            url: "/ajax/index.php/chat/sendPhoto",
            data: params,
            file: files
        }).progress(function() {}).success(function(data) {
            $scope.topic.sendingPhoto = false;
            if (!data.status) return false
        }).error(function() {
            $scope.topic.sendingPhoto = false
        })
    };
    $scope.$watch("sendQueue.length", function(newVal, oldVal) {
        if (!newVal) return;
        if ($scope.sending) return;
        $scope.sending = true;
        if ($scope.sendQueue[0].type == "text") {
            $scope.$parent.chatSendMsg($scope.topicId, $scope.sendQueue[0].text).success(function(data) {
                var idx = _.indexOf($scope.receivedIds, data.data.messageId);
                if (idx > -1) {
                    $scope.sending = false;
                    $scope.sendQueue.shift();
                    $scope.receivedIds.splice(idx, 1);
                    return
                }
                $scope.sendedIds.push(data.data.messageId)
            }).error(function() {
                $scope.sending = false;
                $scope.sendQueue.shift()
            })
        } else if ($scope.sendQueue[0].type == "sticky") {
            var params = {
                tid: $scope.topicId,
                ppub: $scope.topic.pathPub,
                url: $scope.sendQueue[0].url,
                id: $scope.sendQueue[0].emojiId
            };
            if ($scope.topic.aliasId) {
                params.aid = $scope.topic.aliasId;
                params.fn = $scope.topic.me.fullname
            }
            $http.post("/ajax/index.php/chat/sendSticky", serializeData(params)).success(function(data) {
                var idx = _.indexOf($scope.receivedIds, data.data.messageId);
                if (idx > -1) {
                    $scope.sending = false;
                    $scope.sendQueue.shift();
                    $scope.receivedIds.splice(idx, 1);
                    return
                }
                $scope.sendedIds.push(data.data.messageId)
            }).error(function() {
                $scope.sending = false;
                $scope.sendQueue.shift()
            })
        }
    });
    $scope.$on("receive-new-msg", function(event, data) {
        var idx = _.indexOf($scope.sendedIds, data.messageId);
        if (idx > -1) {
            $scope.sending = false;
            $scope.sendQueue.shift();
            $scope.sendedIds.splice(idx, 1);
            return
        }
        if (data.from.aliasId && data.from.aliasId == $scope.me.aliasId) $scope.receivedIds.push(data.messageId);
        else if (data.from.userId && data.from.userId == $scope.me.userId) $scope.receivedIds.push(data.messageId)
    });
    $scope.archiveChat = function() {};
    $scope.deleteHistory = function() {};
    $scope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
        if ($state.includes("conversations/") && ($scope.input.text || $scope.sendQueue.length > 0)) {
            if (!confirm("Are you sure want to leave this page?")) {
                event.preventDefault();
                return false
            }
        }
    })
});
angular.module("App").controller("ErrorCtrl", function($scope, $rootScope, $location, $state) {
    $scope.isLoaded = false;
    if ($scope.isLoaded == false) {
        $scope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
            $scope.isLoaded = true;
            if (fromState.name) {
                $state.go(fromState, fromParams, {
                    location: "replace",
                    notify: false
                })
            }
        })
    }
    $rootScope.currentPage = "error"
});
angular.module("App").controller("UserFollowerCtrl", ["$scope", "$rootScope", "$modalInstance", "User", "userId", function($scope, $rootScope, $modalInstance, User, userId) {
    $scope.userId = userId;
    $scope.followers = [];
    $scope.totalFollower = 0;
    $scope.cursorFollower = "";
    $scope.busyFollower = false;
    $scope.loadmore = true;
    $scope.loadMoreFollower = function() {
        if ($scope.busyFollower == true) return;
        if (!$scope.loadmore) return;
        $scope.busyFollower = true;
        User.getListFollower($scope.userId, $scope.cursorFollower).success(function(data) {
            if (data.status) {
                $scope.totalFollower = data.data.total;
                var items = data.data.followers;
                if (items.length > 0) {
                    for (i = 0; i < items.length; i++) {
                        $scope.followers.push(items[i])
                    }
                    $scope.cursorFollower = data.data.cursor
                } else {
                    $scope.loadmore = false
                }
                $scope.busyFollower = false
            }
        })
    };
    $scope.loadMoreFollower();
    $scope.follow = function(index) {
        var userId = $scope.followers[index].userId;
        User.follow(userId).success(function(data) {
            if (data.status) {
                $scope.followers[index].followed = true
            }
        })
    };
    $scope.unFollow = function(index) {
        var userId = $scope.followers[index].userId;
        User.follow(userId).success(function(data) {
            if (data.status) {
                $scope.followers[index].followed = false
            }
        })
    };
    $scope.closeModal = function() {
        $modalInstance.close()
    };
    $scope.dismissModal = function() {
        $modalInstance.dismiss()
    }
}]);
angular.module("App").controller("UserFollowingCtrl", ["$scope", "$rootScope", "$modalInstance", "User", "userId", function($scope, $rootScope, $modalInstance, User, userId) {
    $scope.userId = userId;
    $scope.followings = [];
    $scope.loadmore = true;
    $scope.totalFollowing = 0;
    $scope.cursorFollowing = "";
    $scope.busyFollowing = false;
    $scope.loadMoreFollowing = function() {
        if ($scope.busyFollowing == true) return;
        if (!$scope.loadmore) return;
        $scope.busyFollowing = true;
        User.getListFollowing($scope.userId, $scope.cursorFollowing).success(function(data) {
            if (data.status) {
                $scope.totalFollowing = data.data.total;
                var items = data.data.followings;
                if (items.length > 0) {
                    for (i = 0; i < items.length; i++) {
                        $scope.followings.push(items[i])
                    }
                    $scope.cursorFollowing = data.data.cursor
                } else {
                    $scope.loadmore = false
                }
                $scope.busyFollowing = false
            }
        })
    };
    $scope.loadMoreFollowing();
    $scope.follow = function(index) {
        var userId = $scope.followings[index].userId;
        User.follow(userId).success(function(data) {
            if (data.status) {
                $scope.followings[index].followed = true
            }
        })
    };
    $scope.unFollow = function(index) {
        var userId = $scope.followings[index].userId;
        User.follow(userId).success(function(data) {
            if (data.status) {
                $scope.followings.splice(index, 1)
            }
        })
    };
    $scope.closeModal = function() {
        $modalInstance.close()
    };
    $scope.dismissModal = function() {
        $modalInstance.dismiss()
    }
}]);
angular.module("App").controller("ListLikeCtrl", ["$scope", "$rootScope", "$modalInstance", "User", "Post", "postIdLike", function($scope, $rootScope, $modalInstance, User, Post, postIdLike) {
    $scope.likes = [];
    $scope.cursorLike = "";
    $scope.busyLike = false;
    $scope.loadLike = true;
    $scope.loadMoreListLiked = function() {
        if ($scope.busyLike) return;
        if (!$scope.loadLike) return;
        $scope.busyLike = true;
        Post.getListLiked(postIdLike, $scope.cursorLike).success(function(data) {
            if (data.status) {
                var items = data.data.likes;
                if (items.length > 0) {
                    for (i = 0; i < items.length; i++) {
                        if ($rootScope.me.userId == items[i].userId) items[i].followed = true;
                        if (typeof items[i].aliasId != "undefined") {
                            items[i].isAlias = true
                        } else {
                            items[i].isUser = true
                        }
                        $scope.likes.push(items[i])
                    }
                    $scope.cursorLike = data.data.cursor
                } else {
                    $scope.loadLike = false
                }
                $scope.busyLike = false
            }
        })
    };
    $scope.loadMoreListLiked();
    $scope.closeModal = function() {
        $modalInstance.close()
    };
    $scope.$on("$stateChangeSuccess", function(oldState, newState) {
        if (oldState != newState) $scope.closeModal()
    })
}]);
angular.module("App").controller("ListLikeTipCtrl", ["$scope", "$rootScope", "$modalInstance", "User", "Tip", "tipIdLike", function($scope, $rootScope, $modalInstance, User, Tip, tipIdLike) {
    $scope.likes = [];
    $scope.cursorLike = "";
    $scope.busyLike = false;
    $scope.loadLike = true;
    $scope.loadMoreListLiked = function() {
        if ($scope.busyLike) return;
        if (!$scope.loadLike) return;
        $scope.busyLike = true;
        Tip.getListLiked(tipIdLike, $scope.cursorLike).success(function(data) {
            if (data.status) {
                var items = data.data.likes;
                if (items.length > 0) {
                    for (i = 0; i < items.length; i++) {
                        if ($rootScope.me.userId == items[i].userId) items[i].followed = true;
                        if (typeof items[i].aliasId != "undefined") {
                            items[i].isAlias = true
                        } else {
                            items[i].isUser = true
                        }
                        $scope.likes.push(items[i])
                    }
                    $scope.cursorLike = data.data.cursor
                } else {
                    $scope.loadLike = false
                }
                $scope.busyLike = false
            }
        })
    };
    $scope.loadMoreListLiked();
    $scope.closeModal = function() {
        $modalInstance.close()
    };
    $scope.$on("$stateChangeSuccess", function(oldState, newState) {
        if (oldState != newState) $scope.closeModal()
    })
}]);
angular.module("App").controller("ListLikePhotoCtrl", ["$scope", "$rootScope", "$modalInstance", "User", "Photo", "photoId", function($scope, $rootScope, $modalInstance, User, Photo, photoId) {
    $scope.photoId = photoId;
    $scope.likes = [];
    $scope.cursorLike = "";
    $scope.busyLike = false;
    $scope.loadLike = true;
    $scope.loadMoreListLiked = function() {
        if ($scope.busyLike) return;
        if (!$scope.loadLike) return;
        $scope.busyLike = true;
        Photo.getListLiked($scope.photoId, $scope.cursorLike).success(function(data) {
            if (data.status) {
                var items = data.data.likes;
                if (items.length > 0) {
                    for (i = 0; i < items.length; i++) {
                        if ($rootScope.me.userId == items[i].userId) items[i].followed = true;
                        if (typeof items[i].aliasId != "undefined") {
                            items[i].isAlias = true
                        } else {
                            items[i].isUser = true
                        }
                        $scope.likes.push(items[i])
                    }
                    $scope.cursorLike = data.data.cursor
                } else {
                    $scope.loadLike = false
                }
                $scope.busyLike = false
            }
        })
    };
    $scope.loadMoreListLiked();
    $scope.closeModal = function() {
        $modalInstance.close()
    };
    $scope.$on("$stateChangeSuccess", function(oldState, newState) {
        if (oldState != newState) $scope.closeModal()
    })
}]);
angular.module("App").controller("ListShareCtrl", ["$scope", "$rootScope", "$modalInstance", "User", "Post", "postIdShare", function($scope, $rootScope, $modalInstance, User, Post, postIdShare) {
    $scope.shares = [];
    $scope.cursorShare = "";
    $scope.busyShare = false;
    $scope.loadShare = true;
    $scope.loadMoreListShared = function() {
        if ($scope.busyShare) return;
        if (!$scope.loadShare) return;
        $scope.busyShare = true;
        Post.getListShared(postIdShare, $scope.cursorShare).success(function(data) {
            if (data.status) {
                var items = data.data.shares;
                if (items.length > 0) {
                    for (i = 0; i < items.length; i++) {
                        if ($rootScope.me.userId == items[i].userId) items[i].followed = true;
                        if (typeof items[i].aliasId != "undefined") {
                            items[i].isAlias = true
                        } else {
                            items[i].isUser = true
                        }
                        $scope.shares.push(items[i])
                    }
                    $scope.cursorShare = data.data.cursor
                } else {
                    $scope.loadShare = false
                }
                $scope.busyShare = false
            }
        })
    };
    $scope.loadMoreListShared();
    $scope.closeModal = function() {
        $modalInstance.close()
    };
    $scope.$on("$stateChangeSuccess", function(oldState, newState) {
        if (oldState != newState) $scope.closeModal()
    })
}]);
angular.module("App").controller("ListLikeEventCtrl", ["$scope", "$rootScope", "$modalInstance", "User", "Event", "event", function($scope, $rootScope, $modalInstance, User, Event, event) {
    $scope.likes = [];
    $scope.event = event;
    $scope.cursorLike = "";
    $scope.busyLike = false;
    $scope.loadLike = true;
    $scope.loadMoreListLiked = function() {
        if ($scope.busyLike) return;
        if (!$scope.loadLike) return;
        $scope.busyLike = true;
        Event.getListLiked($scope.event.gameId, $scope.event.eventId).success(function(data) {
            if (data.status) {
                var items = data.data.users;
                if (items.length > 0) {
                    for (i = 0; i < items.length; i++) {
                        if ($rootScope.me.userId == items[i].userId) items[i].followed = true;
                        if (typeof items[i].aliasId != "undefined") {
                            items[i].isAlias = true
                        } else {
                            items[i].isUser = true
                        }
                        $scope.likes.push(items[i])
                    }
                    $scope.cursorLike = data.data.cursor
                } else {
                    $scope.loadLike = false
                }
                $scope.busyLike = false
            }
        })
    };
    $scope.loadMoreListLiked();
    $scope.closeModal = function() {
        $modalInstance.close()
    };
    $scope.$on("$stateChangeSuccess", function(oldState, newState) {
        if (oldState != newState) $scope.closeModal()
    })
}]);
angular.module("App").controller("ListFriendCtrl", ["$scope", "$rootScope", "$modalInstance", "$timeout", "User", function($scope, $rootScope, $modalInstance, $timeout, User) {
    $scope.keyword = "";
    $scope.userTags = [];
    $scope.obj = {};
    $scope.isWith = false;
    $scope.selectUserTag = function(userId, fullname) {
        $scope.isWith = true;
        if (typeof $scope.obj[userId] == "undefined") {
            $scope.userTags.push({
                userId: userId,
                fullname: fullname
            });
            $scope.obj[userId] = true
        }
    };
    $scope.close = function() {
        $modalInstance.dismiss("cancel")
    };
    $scope.tag = function() {
        $modalInstance.close($scope.userTags)
    };
    $scope.removeUserTag = function(index) {
        delete $scope.obj[$scope.userTags[index].userId];
        $scope.userTags.splice(index, 1);
        if ($scope.userTags.length == 0) {
            $scope.isWith = false
        }
    };
    $scope.$watch("keyword", function() {
        if (!$scope.keyword) {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        } else {
            User.searchFriend({
                keyword: $scope.keyword
            }).success(function(data) {
                $scope.friends = data.data.results
            })
        }
    })
}]);
angular.module("App").controller("ListGiftCodeCtrl", ["$scope", "Giftcode", function($scope, Giftcode) {
    Giftcode.getList().success(function(data, status, header, config) {
        if (data.status) {
            $scope.giftcodes = data.data.giftcodes
        }
    }).error(function(data, status, header, config) {})
}]);
angular.module("App").controller("ListSuggestGameCtrl", ["$scope", "Game", function($scope, Game) {
    $scope.suggestGames = [];
    $scope.gameSugParams = {
        limit: 20,
        offset: 0
    };
    Game.getGameSuggest($scope.gameSugParams).success(function(data) {
        if (data.status) {
            var items = data.data.games;
            if (items.length > 0) {
                var count = 0;
                for (var i = 0; i < items.length; i++) {
                    if (typeof items[i].slug != "undefined" && items[i].slug) {
                        items[i].link = "/game/" + items[i].slug
                    } else {
                        items[i].link = "/game/" + items[i].gameId
                    }
                    if (count < 3) {
                        if ($scope.page != "game" && $scope.page != "clan") {
                            count++;
                            $scope.suggestGames.push(items[i])
                        } else {
                            if ($scope.page == "game" && $scope.gameId != items[i].slug) {
                                count++;
                                $scope.suggestGames.push(items[i])
                            } else if ($scope.page == "clan" && $scope.clan.gameId != items[i].gameId) {
                                count++;
                                $scope.suggestGames.push(items[i])
                            }
                        }
                    } else {
                        break
                    }
                }
            }
        }
    }).error(function(data, status, header, config) {})
}]);
angular.module("App").controller("ListSuggestUserCtrl", ["$scope", "$rootScope", "$state", "User", function($scope, $rootScope, $state, User) {
    $scope.users = [];
    var params = {};
    $scope.getUsers = function() {
        if ($scope.page != "game" && !$rootScope.loggedIn) return;
        if ($scope.page == "game") {
            if ($scope.gameId != undefined && $scope.gameId) {
                params.gameId = $scope.gameId
            }
        }
        User.getUserSuggestion(params).success(function(data) {
            if (data.status) {
                $scope.users = [];
                if (params.gameId != undefined) {
                    $scope.users = data.data.followers
                } else {
                    var listUsers = data.data.users;
                    for (key in listUsers) {
                        if ($scope.user != undefined) {
                            if (listUsers[key].userId != $scope.user.userId) {
                                $scope.users.push(listUsers[key])
                            }
                        } else {
                            $scope.users.push(listUsers[key])
                        }
                    }
                }
            }
        })
    };
    $scope.getUsers();
    $scope.busy = false;
    $scope.follow = function(index) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        if ($scope.busy) return;
        $scope.busy = true;
        var userId = $scope.users[index].userId;
        User.follow(userId).success(function(data) {
            $scope.busy = false;
            if (data.status) {
                $scope.users.splice(index, 1)
            } else {}
        }).error(function() {
            $scope.busy = false
        })
    }
}]);
angular.module("App").controller("OnclanLaGiCtrl", function($scope, $rootScope) {
    $rootScope.pageTitle = "onClan là gì";
    $rootScope.pageDesc = " "
});
angular.module("App").controller("StickerBoxCtrl", function($scope, $http, $rootScope, $window) {
    $scope.emojis = [];
    $scope.shop = [];
    $scope.activeSticker = 0;
    if (!$rootScope.stickers.length) {
        $http.get("/ajax/index.php/chat/stickers", {
            cache: true
        }).success(function(data) {
            if (!data.status) return;
            $rootScope.stickers = data.data.stickers;
            for (var i = 0; i < $rootScope.stickers.length; i++) {
                for (var j = 0; j < $rootScope.stickers[i].emojis.length; j++) {
                    $window.localStorage[$rootScope.stickers[i].emojis[j].emojiId] = $rootScope.stickers[i].emojis[j].url
                }
            }
        }).error(function() {})
    }
    $scope.selectEmojiSet = function(stickerId, emojis) {
        if (emojis) {
            $scope.emojis = emojis;
            $scope.activeSticker = stickerId
        } else {
            $scope.emojis = [];
            $scope.activeSticker = 0
        }
    };
    $scope.showShop = function() {
        $scope.activeSticker = "shop";
        if (!$scope.shop.length) {
            $http.get("/ajax/index.php/chat/shop", {
                cache: true
            }).success(function(data) {
                if (!data.status) return;
                $scope.shop = data.data.items
            }).error(function() {})
        }
    };
    $scope.buySticker = function(stickerId) {
        var bought = false;
        $rootScope.stickers.forEach(function(s) {
            if (s.stickerId == stickerId) {
                bought = true;
                return
            }
        });
        if (bought) {
            $scope.shop.forEach(function(sticker, i) {
                if (sticker.stickerId == stickerId) {
                    $scope.shop[i].bought = true;
                    return
                }
            })
        }
        $http.post("/ajax/index.php/chat/buySticker", serializeData({
            stickerId: stickerId
        })).success(function(data) {
            if (!data.status) {
                if (data.errorCode == "183") {
                    alert("You need gem to buy this item")
                }
                return
            }
            var sticker;
            var idx;
            $scope.shop.forEach(function(s, i) {
                if (s.stickerId == stickerId) {
                    sticker = s;
                    idx = i;
                    return
                }
            });
            sticker = {
                name: sticker.name,
                stickerId: stickerId,
                emojis: data.data.emojis,
                icon: data.data.icon
            };
            $rootScope.stickers.push(sticker);
            $scope.shop[idx].bought = true
        }).error(function() {})
    }
});
angular.module("App").controller("LiveChatBoxCtrl", function($scope, $rootScope, $http, $q, $timeout) {
    $scope.clientId = "";
    $scope.offset = "";
    $scope.token = "";
    $scope.messages = [];
    if ($scope.$parent.game.alias) {
        $scope.alias = $scope.$parent.game.alias
    }
    $scope.init = function(post) {
        $scope.pulling = false;
        $scope.topicId = post.postId;
        $scope.ppub = post.chat.pathPub;
        $scope.canceller = $q.defer();
        if (!$scope.pulling && $rootScope.me.userId) $scope.pull()
    };
    $scope.pull = function() {
        if (!$scope.pulling) {
            $scope.pulling = true;
            $http.get("/ajax/index.php/chat/live", {
                params: {
                    c: $scope.topicId,
                    i: $scope.clientId,
                    o: $scope.offset,
                    t: $scope.token
                },
                timeout: $scope.canceller.promise
            }).success(function(data) {
                $scope.pulling = false;
                if (data.client_id) $scope.clientId = data.client_id;
                if (data.token) $scope.token = data.token;
                if (data.offset) $scope.offset = data.offset;
                if (data.data) $scope.handlePullData(data.data);
                $scope.pull()
            }).error(function() {
                if ($scope.pulling != "canceled") $scope.pulling = false;
                $timeout(function() {
                    $scope.pull()
                }, 1e3)
            })
        }
    };
    $scope.handlePullData = function(data) {
        data.forEach(function(d, i) {
            try {
                d = angular.fromJson(d)
            } catch (e) {
                return false
            }
            if (d.type != "MESSAGE") return;
            $scope.messages.push(d.data)
        })
    };
    $scope.sendMsg = function(text, event) {
        event.preventDefault();
        var params = {
            ppub: $scope.ppub,
            tid: $scope.topicId,
            text: text
        };
        if ($scope.alias) {
            params.aid = $scope.alias.aliasId;
            params.fn = $scope.alias.alias
        }
        $http.post("/ajax/index.php/chat/sendMsg", serializeData(params)).success(function(data, status, header, config) {
            if (data.type != "MESSAGE") return false
        }).error(function(data, status, header, config) {})
    };
    $scope.sendSticky = function(emoji) {
        var params = {
            tid: $scope.topicId,
            ppub: $scope.ppub,
            url: emoji.url,
            id: emoji.emojiId
        };
        if ($scope.alias) {
            params.aid = $scope.alias.aliasId;
            params.fn = $scope.alias.alias
        }
        $http.post("/ajax/index.php/chat/sendSticky", serializeData(params)).success(function(data, status, header, config) {
            if (data.type != "MESSAGE") return false
        }).error(function(data, status, header, config) {});
        $scope.toggleStickerBox("off")
    };
    $scope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
        $scope.canceller.resolve();
        $scope.pulling = "canceled"
    });
    $scope.$on("login-success", function(event, data) {
        $scope.pull()
    })
});
angular.module("App").controller("CoverUploadCtrl", function($scope, $timeout, $modalInstance, keySuccess) {
    $scope.showSave = false;
    $scope.imageOut = "";
    $scope.options = {
        type: "cover",
        image: null,
        viewSizeWidth: 500,
        viewSizeHeight: 500,
        viewSizeFixed: true,
        viewShowFixedBtn: true,
        viewShowRotateBtn: false,
        viewShowCropTool: false,
        outputImageWidth: 500,
        outputImageHeight: 200,
        outputImageRatioFixed: true,
        outputImageType: "jpeg",
        outputImageSelfSizeCrop: false,
        watermarkType: "image",
        watermarkImage: null,
        watermarkText: null,
        watermarkTextFont: "Arial",
        watermarkTextFillColor: "rgba(0,0, 0, 0.8)",
        watermarkTextStrokeColor: "rgba(0,0, 0, 0.8)",
        watermarkTextStrokeLineWidth: 1,
        inModal: true
    };
    $scope.cropImage = function() {
        $scope.$broadcast("cropImage");
        $scope.showSave = true;
        $timeout(function() {
            if (keySuccess == "cover-aliasbox-update-success") {
                var data = {
                    status: true,
                    keySuccess: keySuccess,
                    image: $scope.options.image
                };
                $modalInstance.close(data)
            }
        }, 100)
    };
    $scope.saveImage = function() {
        $scope.$broadcast("cropImageSave")
    };
    $scope.cropImageShow = function() {
        $scope.$broadcast("cropImageShow")
    };
    $scope.dismiss = function() {
        $modalInstance.dismiss("cancel")
    };
    $scope.save = function() {
        var data = {
            status: true,
            keySuccess: keySuccess,
            image: $scope.options.image
        };
        $modalInstance.close(data)
    }
});
angular.module("App").controller("AvatarUploadCtrl", function($scope, $timeout, $modalInstance, keySuccess) {
    $scope.showSave = false;
    $scope.imageOut = "";
    $scope.options = {
        type: "avatar",
        image: null,
        viewSizeWidth: 300,
        viewSizeFixed: true,
        viewShowFixedBtn: true,
        viewShowRotateBtn: false,
        viewShowCropTool: false,
        outputImageWidth: 200,
        outputImageHeight: 200,
        outputImageRatioFixed: true,
        outputImageType: "jpeg",
        outputImageSelfSizeCrop: false,
        watermarkType: "image",
        watermarkImage: null,
        watermarkText: null,
        watermarkTextFont: "Arial",
        watermarkTextFillColor: "rgba(0,0, 0, 0.8)",
        watermarkTextStrokeColor: "rgba(0,0, 0, 0.8)",
        watermarkTextStrokeLineWidth: 1,
        inModal: true
    };
    $scope.cropImage = function() {
        $scope.$broadcast("cropImage");
        $scope.showSave = true;
        $timeout(function() {
            if (keySuccess == "avatar-aliasbox-update-success") {
                var data = {
                    status: true,
                    keySuccess: keySuccess,
                    image: $scope.options.image
                };
                $modalInstance.close(data)
            }
        }, 100)
    };
    $scope.saveImage = function() {
        $scope.$broadcast("cropImageSave")
    };
    $scope.cropImageShow = function() {
        $scope.$broadcast("cropImageShow")
    };
    $scope.dismiss = function() {
        $modalInstance.dismiss("cancel")
    };
    $scope.save = function() {
        var data = {
            status: true,
            keySuccess: keySuccess,
            image: $scope.options.image
        };
        $modalInstance.close(data)
    }
});
angular.module("App").controller("AboutVnCtrl", ["$scope", "$rootScope", function($scope, $rootScope) {
    $rootScope.pageTitle = "onClan - Mạng xã hội cho game thủ mobile";
    $rootScope.pageDesc = ""
}]);
angular.module("App").controller("AboutCtrl", ["$scope", "$rootScope", function($scope, $rootScope) {
    $rootScope.pageDesc = ""
}]);
angular.module("App").controller("PolicyCtrl", ["$scope", "$rootScope", function($scope, $rootScope) {
    $rootScope.pageTitle = "Privacy Policy | onClan";
    $rootScope.pageDesc = ""
}]);
angular.module("App").controller("TermCtrl", ["$scope", "$rootScope", function($scope, $rootScope) {
    $rootScope.pageTitle = "Term of uses | onClan";
    $rootScope.pageDesc = ""
}]);
angular.module("App").controller("TextAngularHelpCtrl", function($scope, $modalInstance) {
    $scope.dismiss = function() {
        $modalInstance.dismiss("cancel")
    };
    $scope.close = function() {
        $modalInstance.close("close")
    }
});

function serializeData(data) {
    if (!angular.isObject(data)) {
        return data == null ? "" : data.toString()
    }
    var buffer = [];
    for (var name in data) {
        if (!data.hasOwnProperty(name)) {
            continue
        }
        var value = data[name];
        buffer.push(encodeURIComponent(name) + "=" + encodeURIComponent(value == null ? "" : value))
    }
    var source = buffer.join("&").replace(/%20/g, "+");
    return source
}

function html_entity_decode(str) {
    try {
        var ta = document.createElement("textarea");
        ta.innerHTML = str;
        return ta.value
    } catch (e) {}
    try {
        var d = document.createElement("div");
        d.innerHTML = str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (typeof d.innerText != "undefined") return d.innerText
    } catch (e) {}
}

function processTxt(text) {
    text = text.replace(/<input.*?[^id]id="(.*?)".*?[^value]value="(.*?)"(|.*?[^>])>(\s)?/gi, "[[@$1:$2]] ");
    text = text.replace(/<div>(<br>|<br\/>)/gi, "\n");
    text = text.replace(/<div>/gi, "\n");
    text = text.replace(/<br([^>]+)?>/g, "\n");
    text = text.replace(/<([^>]+)>/gi, "");
    text = html_entity_decode(text);
    text = text.replace(/&nbsp;/g, " ");
    return text
}
Array.prototype.insert = function(index, item) {
    this.splice(index, 0, item)
};

function removeElementsByClass(className) {
    var elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0])
    }
}
var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {
    if (obj == null) return true;
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false
    }
    return true
}
angular.module("App").factory("AuthService", function() {
    var AuthService = {
        method: "",
        token: "",
        email: ""
    };
    return AuthService
});
(function() {
    angular.module("App").controller("GamesCtrl", GamesCtrl);
    GamesCtrl.$inject = ["$scope", "$rootScope", "$stateParams", "$location"];

    function GamesCtrl($scope, $rootScope, $stateParams, $location) {
        $rootScope.currentPage = "games";
        if ($stateParams.order) {
            $scope.order = $stateParams.order
        } else {
            $scope.order = "hot"
        }
        $scope.gameUrl = "/ajax/index.php/games/getlistgame";
        $scope.gameParams = {
            order: $scope.order
        }
    }
})();
(function() {
    angular.module("App").controller("ListGameCtrl", ListGameCtrl);
    ListGameCtrl.$inject = ["$scope", "$rootScope", "$stateParams", "Game"];

    function ListGameCtrl($scope, $rootScope, $stateParams, Game) {
        $scope.games = [];
        $rootScope.pageTitle = "Games | onClan";
        $rootScope.pageDesc = "";
        $scope.cursor = "";
        $scope.busy = false;
        $scope.loadmore = true;
        $scope.hasLoaded = false;
        $scope.nextPage = function() {
            if ($scope.busy) return;
            if (!$scope.loadmore) return;
            $scope.busy = true;
            $scope.$parent.gameParams.cursor = $scope.cursor;
            Game.nextPage($scope.gameUrl, $scope.$parent.gameParams).success(function(data) {
                if (data.status) {
                    $scope.hasLoaded = true;
                    var items = data.data.games;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            items[i].download = {};
                            if (typeof items[i].slug != "undefined" && items[i].slug) {
                                items[i].isSlug = true
                            } else {
                                items[i].isGameId = true
                            }
                            if (!$rootScope.isMobile) {
                                angular.forEach(items[i].urls, function(value, key) {
                                    if (key == "ios") {
                                        items[i].download.ios = true
                                    } else if (key == "android") {
                                        items[i].download.android = true
                                    } else if (key == "wp") {
                                        items[i].download.wp = true
                                    }
                                })
                            } else {
                                angular.forEach(items[i].urls, function(value, key) {
                                    if ($rootScope.os.toLowerCase() == "ios" && key == "ios") {
                                        items[i].download.ios = true
                                    } else if ($rootScope.os.toLowerCase() == "android" && key == "android") {
                                        items[i].download.android = true
                                    } else if ($rootScope.os.toLowerCase() == "symbian" && key == "wp") {
                                        items[i].download.wp = true
                                    }
                                })
                            }
                            $scope.games.push(items[i])
                        }
                        $scope.cursor = data.data.cursor
                    } else {
                        $scope.loadmore = false
                    }
                }
                $scope.busy = false
            })
        };
        $scope.follow = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.games[index].busy) return;
            $scope.games[index].busy = true;
            Game.follow($scope.games[index].gameId).success(function(data) {
                $scope.games[index].busy = false;
                if (data.status) {
                    $scope.games[index].followed = true;
                    $scope.games[index].totalFollower++
                }
            }).error(function(data, status, header, config) {
                $scope.games[index].busy = false
            })
        };
        $scope.unFollow = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.games[index].busy) return;
            $scope.games[index].busy = true;
            Game.unFollow($scope.games[index].gameId).success(function(data) {
                $scope.games[index].busy = false;
                if (data.status) {
                    $scope.games[index].followed = false;
                    $scope.games[index].totalFollower--
                }
            }).error(function(data, status, header, config) {
                $scope.games[index].busy = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("GameDetailCtrl", GameDetailCtrl);
    GameDetailCtrl.$inject = ["$scope", "$rootScope", "$window", "$modal", "$stateParams", "$state", "$location", "Game", "User", "game"];

    function GameDetailCtrl($scope, $rootScope, $window, $modal, $stateParams, $state, $location, Game, User, game) {
        $rootScope.currentPage = "games";
        $scope.events = [];
        $scope.eventCursor = "";
        $scope.alias = {
            aliasId: ""
        };
        $scope.hasAlias = false;
        $scope.error = {
            status: false,
            msg: ""
        };
        $scope.show = false;
        $scope.url = "/ajax/index.php/games/wall";
        $scope.page = "game";
        $scope.urlGetClan = "/ajax/index.php/games/clan";
        init();
        $scope.$on("login-success", function(e, args) {
            getGame()
        });

        function init() {
            if (game.data.status) {
                $scope.show = true;
                $scope.game = game.data.data;
                $scope.gameId = $scope.game.gameId;
                $scope.params = {
                    gameId: $scope.gameId
                };
                $scope.clanParams = {
                    gameId: $scope.gameId
                };
                $scope.photoParams = {
                    url: "/ajax/index.php/games/photo",
                    gameId: $scope.gameId
                };
                $scope.game.onclanUrl = $state.href("game", {
                    gameId: $scope.game.gameId
                }, {
                    absolute: true
                });
                updatePageTitle($state.current);
                $scope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
                    updatePageTitle(toState)
                });
                if ($scope.game.slug && $scope.game.slug != $stateParams.gameId) {
                    $state.go($state.$current.name, {
                        gameId: $scope.game.slug
                    }, {
                        location: "replace",
                        notify: false
                    });
                    return
                }
                $scope.game.showMore = true;
                $scope.game.download = {};
                $scope.game.hasAnnouncement = false;
                if ($scope.game.alias != undefined) {
                    $scope.alias = $scope.game.alias;
                    $scope.hasAlias = true
                }
                if ($scope.game.giftcode) {
                    $scope.game.giftcode.game = {
                        gameId: $scope.game.gameId,
                        icon: $scope.game.icon,
                        slug: $scope.game.slug,
                        name: $scope.game.name
                    }
                }
                if ($scope.game.announcement != undefined) $scope.game.hasAnnouncement = true;
                if (!$rootScope.isMobile) {
                    angular.forEach($scope.game.urls, function(value, key) {
                        if (key == "ios") {
                            $scope.game.download.ios = true
                        } else if (key == "android") {
                            $scope.game.download.android = true
                        } else if (key == "wp") {
                            $scope.game.download.wp = true
                        }
                    })
                } else {
                    if (typeof $rootScope.os !== "undefined") {
                        angular.forEach($scope.game.urls, function(value, key) {
                            if ($rootScope.os.toLowerCase() == "ios" && key == "ios") {
                                $scope.game.download.ios = true
                            } else if ($rootScope.os.toLowerCase() == "android" && key == "android") {
                                $scope.game.download.android = true
                            } else if ($rootScope.os.toLowerCase() == "symbian" && key == "wp") {
                                $scope.game.download.wp = true
                            }
                        })
                    }
                }
                $rootScope.$broadcast("get-alias-success", {});
                getLastEvent()
            } else {
                $state.go("error");
                return
            }
        }

        function getGame() {
            Game.getGameInfo($scope.gameId).success(function(data) {
                if (game.data.status) {
                    $scope.show = true;
                    $scope.game = game.data.data;
                    $scope.gameId = $scope.game.gameId;
                    $scope.params = {
                        gameId: $scope.gameId
                    };
                    $scope.clanParams = {
                        gameId: $scope.gameId
                    };
                    $scope.photoParams = {
                        url: "/ajax/index.php/games/photo",
                        gameId: $scope.gameId
                    };
                    $scope.game.onclanUrl = $state.href("game", {
                        gameId: $scope.game.gameId
                    }, {
                        absolute: true
                    });
                    updatePageTitle($state.current);
                    $scope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
                        updatePageTitle(toState)
                    });
                    if ($scope.game.slug && $scope.game.slug != $stateParams.gameId) {
                        $state.go($state.$current.name, {
                            gameId: $scope.game.slug
                        }, {
                            location: "replace",
                            notify: false
                        });
                        return
                    }
                    $scope.game.showMore = true;
                    $scope.game.download = {};
                    $scope.game.hasAnnouncement = false;
                    if ($scope.game.alias != undefined) {
                        $scope.alias = $scope.game.alias;
                        $scope.hasAlias = true
                    }
                    if ($scope.game.giftcode) {
                        $scope.game.giftcode.game = {
                            gameId: $scope.game.gameId,
                            icon: $scope.game.icon,
                            slug: $scope.game.slug,
                            name: $scope.game.name
                        }
                    }
                    if ($scope.game.announcement != undefined) $scope.game.hasAnnouncement = true;
                    if (!$rootScope.isMobile) {
                        angular.forEach($scope.game.urls, function(value, key) {
                            if (key == "ios") {
                                $scope.game.download.ios = true
                            } else if (key == "android") {
                                $scope.game.download.android = true
                            } else if (key == "wp") {
                                $scope.game.download.wp = true
                            }
                        })
                    } else {
                        if (typeof $rootScope.os !== "undefined") {
                            angular.forEach($scope.game.urls, function(value, key) {
                                if ($rootScope.os.toLowerCase() == "ios" && key == "ios") {
                                    $scope.game.download.ios = true
                                } else if ($rootScope.os.toLowerCase() == "android" && key == "android") {
                                    $scope.game.download.android = true
                                } else if ($rootScope.os.toLowerCase() == "symbian" && key == "wp") {
                                    $scope.game.download.wp = true
                                }
                            })
                        }
                    }
                    $rootScope.$broadcast("get-alias-success", {});
                    getLastEvent()
                } else {
                    $state.go("error");
                    return
                }
            })
        }

        function updatePageTitle(state) {
            if (state.name == "game.clan") {
                $rootScope.pageTitle = "Clans of " + $scope.game.name + " | onClan";
                $rootScope.pageDesc = " "
            } else if (state.name == "game.tip") {
                $rootScope.pageTitle = "Tips for " + $scope.game.name + " | onClan";
                $rootScope.pageDesc = "Tips for " + $scope.game.name + " - " + $scope.game.desc.substr(0, 200) + "...";
                $rootScope.pageDesc = $scope.game.name + " Tips - " + $scope.game.desc.substr(0, 200) + "..."
            } else if (state.name == "game.photo") {
                $rootScope.pageTitle = "Photos of " + $scope.game.name + " | onClan";
                $rootScope.pageDesc = " "
            } else if (state.name == "game.events") {
                $rootScope.pageTitle = "Events of " + $scope.game.name + " | onClan";
                $rootScope.pageDesc = " "
            } else if (state.name == "game.follower") {
                $rootScope.pageTitle = $scope.game.name + "'s Followers | onClan";
                $rootScope.pageDesc = " "
            } else if (state.name == "game.live") {
                $rootScope.pageTitle = "Live Stream " + $scope.game.name + " | onClan";
                $rootScope.pageDesc = " "
            } else {
                $rootScope.pageTitle = $scope.game.name + " | onClan";
                $rootScope.pageDesc = $scope.game.name + " - " + $scope.game.desc.substr(0, 200) + "..."
            }
        }
        $scope.joinClan = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var clanId = $scope.clans[index].clanId;
            Game.joinClan(clanId).success(function(data) {
                if (data.status) {
                    $scope.clan.memberStatus = data.data.memberStatus;
                    if (data.data.memberStatus == "pending") {
                        alert("Your request has sent. Please wait for clan admin respond")
                    }
                }
            })
        };
        $scope.followGame = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.game.busyFollow) return;
            $scope.game.busyFollow = true;
            Game.follow($scope.gameId).success(function(data) {
                $scope.game.busyFollow = false;
                if (data.status) {
                    $scope.game.followed = true;
                    $scope.game.totalFollower++
                }
            }).error(function(data, status, header, config) {
                $scope.game.busyFollow = false
            })
        };
        $scope.unFollowGame = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.game.busyFollow) return;
            $scope.game.busyFollow = true;
            Game.unFollow($scope.gameId).success(function(data) {
                $scope.game.busyFollow = false;
                if (data.status) {
                    $scope.game.followed = false;
                    $scope.game.totalFollower--
                }
            }).error(function() {
                $scope.game.busyFollow = false
            })
        };
        $scope.showMoreInfo = function() {
            $scope.game.shortDesc = $scope.game.desc;
            $scope.game.showMore = false
        };
        $scope.addClan = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return false
            }
            if (!$scope.game.followed) {
                alert("Please follow this game!");
                return false
            }
            var modalInstance = $modal.open({
                templateUrl: "/views/clan.add.html?v=" + $rootScope.getAppVersion(),
                controller: "CreateClanCtrl",
                resolve: {
                    gameId: function() {
                        return $scope.game.gameId
                    }
                }
            });
            modalInstance.result.then(function(data) {})
        };

        function getLastEvent() {
            Game.getEvents($scope.game.gameId, 1, "").success(function(data) {
                if (data.status) {
                    if (data.data.events) $scope.game.lastEvent = data.data.events[0];
                    if (!$scope.game.announcement && data.data.events.length) {
                        $scope.game.announcement = {
                            text: $scope.game.lastEvent.name,
                            url: "/game/" + $scope.game.slug + "/events"
                        }
                    }
                }
                $scope.busy = false
            }).error(function(data) {})
        }
        $scope.getGameGiftcode = function(giftcode) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return false
            }
            if (!$scope.game.followed) {
                alert("Please follow this game to get giftcode.");
                return false
            } else {
                $scope.openGiftCode(giftcode)
            }
        };
        $scope.openCreateEventModal = function() {
            var eventGameId = "";
            if ($scope.page == "game") {
                eventGameId = $scope.gameId
            } else {
                eventGameId = $scope.clan.game.gameId
            }
            var modalInstance = $modal.open({
                templateUrl: "/views/create_event_modal.html?v=" + $rootScope.getAppVersion(),
                controller: "CreateEventCtrl",
                backdrop: "static",
                resolve: {
                    eventGameId: function() {
                        return eventGameId
                    }
                }
            });
            modalInstance.result.then(function(data) {
                var newEvent = data;
                if ($scope.events != undefined) {
                    newEvent.gameId = $scope.game.gameId;
                    newEvent.textCm = "";
                    newEvent.focus = false;
                    newEvent.isLoading = false;
                    if (newEvent.totalComment > 0) {
                        newEvent.showComment = true
                    } else {
                        newEvent.showComment = false
                    }
                    var moreComment = false;
                    newEvent.comments = {
                        data: [],
                        cursor: "",
                        moreComment: moreComment
                    };
                    $scope.events.unshift(newEvent)
                }
            })
        }
    }
})();
(function() {
    angular.module("App").controller("GameFollowerCtrl", GameFollowerCtrl);
    GameFollowerCtrl.$inject = ["$scope", "$rootScope", "Game", "$stateParams"];

    function GameFollowerCtrl($scope, $rootScope, Game, $stateParams) {
        $scope.gameId = $stateParams.gameId;
        $scope.followers = [];
        $scope.totalFollower = 0;
        $scope.loadmoreFollower = true;
        $scope.cursorFollower = "";
        $scope.busyFollower = false;
        $scope.followerLoaded = false;
        $scope.loadMoreFollower = function() {
            if ($scope.busyFollower == true) return;
            if (!$scope.loadmoreFollower) return;
            $scope.busyFollower = true;
            Game.getListFollower($scope.gameId, $scope.cursorFollower).success(function(data) {
                if (data.status) {
                    $scope.totalFollower = data.data.total;
                    $scope.followerLoaded = true;
                    var items = data.data.followers;
                    if (items.length > 0) {
                        for (i = 0; i < items.length; i++) {
                            if (typeof items[i].followed != "undefined") {
                                items[i].notMe = true
                            } else {
                                items[i].notMe = false
                            }
                            if (typeof items[i].aliasId != "undefined") {
                                items[i].isAlias = true
                            } else {
                                items[i].isUser = true
                            }
                            $scope.followers.push(items[i])
                        }
                        $scope.cursorFollower = data.data.cursor
                    } else {
                        $scope.loadmoreFollower = false
                    }
                    $scope.busyFollower = false
                }
            })
        }
    }
})();
(function() {
    angular.module("App").controller("CreateClanCtrl", CreateClanCtrl);
    CreateClanCtrl.$inject = ["$modal", "$modalInstance", "$scope", "$timeout", "$rootScope", "Game", "$stateParams", "gameId"];

    function CreateClanCtrl($modal, $modalInstance, $scope, $timeout, $rootScope, Game, $stateParams, gameId) {
        gameId = gameId;
        $scope.obj = {
            image: "",
            cover: ""
        };
        $scope.myclan = {
            image: "",
            cover: "",
            status: "open",
            notification: true
        };
        $scope.chooseCover = function(keySuccess) {
            if (typeof keySuccess == "undefined") return;
            var modalInstance = $modal.open({
                templateUrl: "/views/cover.html?v=" + $rootScope.getAppVersion(),
                backdrop: "static",
                resolve: {
                    keySuccess: function() {
                        return keySuccess
                    }
                },
                controller: "CoverUploadCtrl"
            });
            modalInstance.result.then(function(data) {
                if (typeof data.status != "undefined" && data.status) {
                    $rootScope.$broadcast(data.keySuccess, {
                        image: data.image
                    })
                }
            })
        };
        $scope.createClan = function() {
            $scope.error = "";
            $scope.success = "";
            var name = $scope.myclan.name;
            var language = $scope.myclan.language;
            var desc = $scope.myclan.desc;
            var status = $scope.myclan.status;
            var cover = $scope.myclan.cover;
            var notification = $scope.myclan.notification;
            if (notification) {
                notification = 1
            } else {
                notification = 0
            }
            var paramCreates = {
                gameId: gameId,
                name: name,
                language: language,
                desc: desc,
                status: status,
                notification: notification,
                cover: cover
            };
            $scope.loading = true;
            Game.createClan(paramCreates).success(function(data) {
                $scope.loading = false;
                if (data.status) {
                    $scope.myclan = {
                        cover: "",
                        status: "open",
                        notification: true
                    };
                    $scope.obj.cover = "";
                    $scope.success = "Create successful";
                    $timeout(function() {
                        $modalInstance.close("success")
                    }, 1e3)
                } else {
                    if (typeof data.status != "undefined") {
                        $scope.error = data.message
                    } else {
                        $scope.error = "Server's busy. Please try again!"
                    }
                }
            })
        };
        $scope.closeBox = function() {
            $modalInstance.dismiss("cancel")
        }
    }
})();
(function() {
    angular.module("App").controller("ClanCoverCtrl", ClanCoverCtrl);
    ClanCoverCtrl.$inject = ["$scope", "$rootScope", "$location", "$http", "User"];

    function ClanCoverCtrl($scope, $rootScope, $location, $http, User) {
        $scope.keySuccess = "cover-create-clan-success";
        $scope.$on($scope.keySuccess, function(e, data) {
            if (typeof data.image !== "undefined") {
                updateClanCover(data.image)
            }
        });

        function updateClanCover(image) {
            var file = image;
            $scope.myclan.coverUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "cover",
                file: file
            })).success(function(data, status, header, config) {
                $scope.myclan.coverUploading = false;
                if (data.status) {
                    $scope.myclan.cover = data.data.photoId;
                    $scope.myclan.coverUrl = data.data.url
                } else if (!data.status) {
                    alert("Sorry, Connect's timeout, Please try again!");
                    return
                }
            }).error(function(data, status, header, config) {
                $scope.alias.coverUploading = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("GameVideoDetail", GameVideoDetail);
    GameVideoDetail.$inject = ["$scope", "$rootScope", "$state", "$q", "$timeout", "post", "User"];

    function GameVideoDetail($scope, $rootScope, $state, $q, $timeout, post, User) {
        init();
        $scope.error = {
            status: false,
            msg: ""
        };
        $scope.show = false;
        $scope.friends = [];
        $scope.getFriend = function() {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        };
        if ($rootScope.loggedIn) $scope.getFriend();
        $scope.mentionCm = "";
        $scope.macros = {};
        $scope.people = [];
        $scope.searchPeople = function(term) {
            var keyword = term;
            if (!keyword) return;
            var buddies = [];
            User.searchFriend({
                keyword: keyword
            }).then(function(res) {
                buddies = res.data.data.results;
                $scope.people = buddies;
                return $q.when(buddies)
            })
        };
        $scope.getPeopleText = function(item) {
            if (typeof item.aliasId != "undefined") {
                var id = item.aliasId
            } else {
                var id = item.userId
            }
            return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
        };
        $scope.getPeopleTextRaw = function(item) {
            return "@" + item.fullname
        };

        function init() {
            if (post.data.status) {
                $scope.show = true;
                $scope.detailPost = post.data.data;
                if ($scope.detailPost.to.aliasId != undefined) $scope.getAliasInfo($scope.detailPost.to.aliasId);
                if ($scope.detailPost.to.gameId != undefined) {
                    $scope.$broadcast("get-post-success", $scope.detailPost.to.gameId)
                }
            } else {
                $state.go("error")
            }
            $scope.loading = false
        }
        $scope.$on("update-alias-success", function(e, data) {
            var newData = data;
            $scope.alias = newData;
            $scope.option = {
                useAlias: 1
            }
        });
        $timeout(function() {
            if (!$rootScope.loggedIn) {
                $rootScope.remind = true
            }
        }, 2e4)
    }
})();
(function() {
    angular.module("App").controller("GameVideos", GameVideos);
    GameVideos.$inject = ["$scope", "$rootScope", "$state", "Game"];

    function GameVideos($scope, $rootScope, $state, Game) {
        $scope.videos = [];
        $scope.cursor = "";
        $scope.loading = false;
        $scope.hasLoaded = true;
        $scope.limit = 9;
        $scope.getVideos = function() {
            if ($scope.loading) return false;
            if (!$scope.hasLoaded) return false;
            var params = {
                gameId: $scope.game.gameId,
                cursor: $scope.cursor,
                limit: $scope.limit
            };
            $scope.loading = true;
            Game.getListVideo(params).success(function(data, status, header, config) {
                $scope.loading = false;
                if (data.status) {
                    var videos = data.data.videos;
                    for (var i = 0; i < videos.length; i++) {
                        $scope.videos.push(videos[i])
                    }
                    $scope.cursor = data.data.cursor;
                    if (videos.length < $scope.limit) $scope.hasLoaded = false
                }
            }).error(function(data, status, header, config) {
                $scope.hasLoaded = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("LeaderBoardCtrl", LeaderBoardCtrl);
    LeaderBoardCtrl.$inject = ["$scope", "$rootScope", "Game", "User"];

    function LeaderBoardCtrl($scope, $rootScope, Game, User) {
        $scope.leaderboards = [];
        $scope.players = [];
        $scope.titleLeaderboard = "";
        $scope.busy = false;
        var params = {};
        getLeaderBoard();

        function getLeaderBoard() {
            params.gameId = $scope.gameId;
            Game.getLeaderBoard(params).success(function(data) {
                if (data.status) {
                    $scope.leaderboards = data.data.leaderboards;
                    var count = $scope.leaderboards.length;
                    if (count > 0) {
                        getLeaderboardPlayer(0)
                    }
                }
            }).error(function(data, status, header, config) {});
        }

        function getLeaderboardPlayer(index) {
            if ($scope.busy) return false;
            $scope.titleLeaderboard = $scope.leaderboards[index].name;
            var params = {
                gameId: $scope.leaderboards[index].gameId,
                leaderboardId: $scope.leaderboards[index].leaderboardId
            };
            $scope.busy = true;
            $scope.players = [];
            Game.getLeaderBoardPlayer(params).success(function(data) {
                $scope.busy = false;
                if (data.status) {
                    $scope.players = data.data.players
                }
            }).error(function(data, status, header, config) {
                $scope.busy = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("ListVideoCtrl", ListVideoCtrl);
    ListVideoCtrl.$inject = ["$scope", "$http", "$stateParams"];

    function ListVideoCtrl($scope, $http, $stateParams) {
        $scope.currentPostId = $stateParams.postId;
        $scope.init = function(gameId) {
            $http.get("/ajax/index.php/games/videos", {
                params: {
                    gameId: gameId
                }
            }).success(function(data) {
                if (!data.status) return;
                $scope.videos = data.data.videos
            }).error(function() {})
        }
    }
})();
(function() {
    angular.module("App").controller("HomeCtrl", HomeCtrl);
    HomeCtrl.$inject = ["$scope", "$rootScope", "$http", "$state", "$location"];

    function HomeCtrl($scope, $rootScope, $http, $state, $location) {
        downloadAndroid();
        if ($rootScope.loggedIn && !$rootScope.previousState.name) return $state.go("newsfeed", {
            filter: "all"
        });

        function downloadAndroid() {
            if (typeof $rootScope.os !== "undefined" && $rootScope.os.match(/android/gi) !== null) {
                var confirm = window.confirm("Download and install the latest version of onClan to join the first niche social network for gamers");
                if (confirm) {
                    return window.location.href = "https://play.google.com/store/apps/details?id=com.appota.onclan"
                } else return false
            }
        }
    }
})();
(function() {
    angular.module("App").controller("GameSuggestCtrl", GameSuggestCtrl);
    GameSuggestCtrl.$inject = ["$scope", "$rootScope", "Game", "$cacheFactory", "$timeout"];

    function GameSuggestCtrl($scope, $rootScope, Game, $cacheFactory, $timeout) {
        var number = randomInt(1, 6);
        $scope.coverUrl = "cover-" + number;
        $rootScope.currentPage = "home";
        $scope.gameTops = [];
        $scope.gameBottoms = [];
        getGameSuggest();

        function randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min)
        }

        function getGameSuggest() {
            var params = {
                limit: 20,
                offset: 0
            };
            Game.getGameSuggest(params).success(function(data) {
                if (data.status) {
                    var items = data.data.games;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            if (typeof items[i].slug != "undefined" && items[i].slug) {
                                items[i].link = "/game/" + items[i].slug
                            } else {
                                items[i].link = "/game/" + items[i].gameId
                            }
                            items[i].download = {};
                            if (!$rootScope.isMobile) {
                                angular.forEach(items[i].urls, function(value, key) {
                                    if (key == "ios") {
                                        items[i].download.ios = true
                                    } else if (key == "android") {
                                        items[i].download.android = true
                                    } else if (key == "wp") {
                                        items[i].download.wp = true
                                    }
                                })
                            } else {
                                angular.forEach(items[i].urls, function(value, key) {
                                    if ($rootScope.os.toLowerCase() == "ios" && key == "ios") {
                                        items[i].download.ios = true
                                    } else if ($rootScope.os.toLowerCase() == "android" && key == "android") {
                                        items[i].download.android = true
                                    } else if ($rootScope.os.toLowerCase() == "symbian" && key == "wp") {
                                        items[i].download.wp = true
                                    }
                                })
                            }
                            if (i < 6) {
                                $scope.gameBottoms.push(items[i])
                            } else {
                                $scope.gameTops.push(items[i])
                            }
                        }
                    }
                }
            })
        }
    }
})();
(function() {
    angular.module("App").controller("HomeClanCtrl", HomeClanCtrl);
    HomeClanCtrl.$inject = ["$scope", "$rootScope", "Clan", "Post"];

    function HomeClanCtrl($scope, $rootScope, Clan, Post) {
        $scope.clans = [];
        $scope.url = "/ajax/index.php/clan";
        $scope.params = {
            limit: 6,
            offset: 0
        };
        getClanSuggest();

        function getClanSuggest() {
            Clan.getSuggest($scope.params).success(function(data) {
                if (data.status) {
                    var items = data.data.clans;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            items[i].posts = [];
                            $scope.clans.push(items[i])
                        }
                        var count = $scope.clans.length;
                        for (var j = 0; j < count; j++) {
                            getPost(j)
                        }
                    }
                }
            })
        }
        var getPost = function(index) {
            var url = "/ajax/index.php/clan/wall";
            var clanId = $scope.clans[index].clanId;
            var params = {
                clanId: clanId,
                cursor: ""
            };
            Post.nextPage(url, params, {
                cache: 10
            }).success(function(data) {
                if (data.status) {
                    var items = data.data.posts;
                    if (items.length > 0) {
                        var count = 0;
                        for (var i = 0; i < items.length; i++) {
                            if (count == 2) {
                                return
                            }
                            if (items[i].content.text != "") {
                                count++;
                                if (count == 1) $scope.clans[index].postTime = items[i].unixTimestamp * 1e3;
                                if (items[i].by.aliasId != undefined) {
                                    items[i].byAlias = true
                                } else {
                                    items[i].byUser = true
                                }
                                $scope.clans[index].posts.push(items[i])
                            }
                        }
                    }
                }
            })
        };
        $scope.joinClan = function(index) {
            if ($rootScope.loggedIn) {
                var clanId = $scope.clans[index].clanId;
                Clan.joinClan(clanId).success(function(data) {
                    if (data.status) {
                        if (data.data.memberStatus == "joined") {
                            $scope.clans[index].role = "member"
                        } else if (data.data.memberStatus == "pending") {
                            alert("Your request has sent. Please wait for clan admin respond")
                        }
                    } else {
                        alert(data.message)
                    }
                })
            } else {
                $scope.showLoginBox()
            }
        };
        $scope.unJoinClan = function(index) {
            if ($rootScope.loggedIn) {
                var clanId = $scope.clans[index].clanId;
                Clan.leaveClan(clanId).success(function(data) {
                    if (data.status) {
                        $scope.clans[index].role = "guest"
                    } else {
                        alert(data.message)
                    }
                })
            } else {
                $scope.showLoginBox()
            }
        }
    }
})();
(function() {
    angular.module("App").controller("HomeTipCtrl", HomeTipCtrl);
    HomeTipCtrl.$inject = ["$scope", "$rootScope", "$location", "$stateParams", "Tip"];

    function HomeTipCtrl($scope, $rootScope, $location, $stateParams, Tip) {
        $scope.posts = [];
        getSuggest();

        function getSuggest() {
            var params = {
                limit: 6
            };
            Tip.getSuggest(params).success(function(data) {
                if (data.status) {
                    var items = data.data.tips;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].by.aliasId != undefined) {
                                items[i].byAlias = true
                            } else {
                                items[i].byUser = true
                            }
                            $scope.posts.push(items[i])
                        }
                        $scope.cursor = data.data.cursor
                    }
                }
            })
        }
        $scope.likePost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox()
            }
            var tipId = $scope.posts[index].tipId;
            Tip.likePost(tipId).success(function(data, status, header, config) {
                if (data.status) {
                    $scope.posts[index].totalLike++;
                    $scope.posts[index].liked = true
                }
            }).error(function(data, status, header, config) {})
        };
        $scope.unlikePost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox()
            }
            var tipId = $scope.posts[index].tipId;
            Tip.unlikePost(tipId).success(function(data) {
                if (data.status) {
                    $scope.posts[index].totalLike--;
                    $scope.posts[index].liked = false
                }
            }).error(function(data, status, header, config) {})
        }
    }
})();
(function() {
    angular.module("App").controller("NewGameSuggestCtrl", NewGameSuggestCtrl);
    NewGameSuggestCtrl.$inject = ["$scope", "$location", "$rootScope", "$http", "$q", "Game"];

    function NewGameSuggestCtrl($scope, $location, $rootScope, $http, $q, Game) {
        $rootScope.currentPage = "gamesuggest";
        $scope.games = [];
        $scope.cursor = "";
        $scope.limit = 10;
        $scope.busy = false;
        $scope.hasFollow = false;
        getNewGameSuggest();

        function getNewGameSuggest() {
            if ($scope.busy) return;
            $scope.busy = true;
            var params = {
                limit: $scope.limit,
                cursor: $scope.cursor
            };
            Game.getGameSuggest(params).success(function(data) {
                $scope.busy = false;
                if (data.status) {
                    var items = data.data.games;
                    if (items.length > 0) {
                        $scope.cursor = data.data.cursor;
                        for (var i = 0; i < items.length; i++) {
                            items[i].download = {};
                            if (!$rootScope.isMobile) {
                                angular.forEach(items[i].urls, function(value, key) {
                                    if (key == "ios") {
                                        items[i].download.ios = true
                                    } else if (key == "android") {
                                        items[i].download.android = true
                                    } else if (key == "wp") {
                                        items[i].download.wp = true
                                    }
                                })
                            } else {
                                angular.forEach(items[i].urls, function(value, key) {
                                    if ($rootScope.os.toLowerCase() == "ios" && key == "ios") {
                                        items[i].download.ios = true
                                    } else if ($rootScope.os.toLowerCase() == "android" && key == "android") {
                                        items[i].download.android = true
                                    } else if ($rootScope.os.toLowerCase() == "symbian" && key == "wp") {
                                        items[i].download.wp = true
                                    }
                                })
                            }
                            $scope.games.push(items[i])
                        }
                    }
                }
            }).error(function(data, status, header, config) {
                $scope.busy = false
            })
        }
        $scope.followGame = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.games[index].busy) return;
            $scope.hasFollow = true;
            $scope.games[index].busy = true;
            var gameId = $scope.games[index].gameId;
            Game.follow(gameId).success(function(data) {
                $scope.games[index].busy = false;
                if (data.status) {
                    $scope.games[index].followed = true
                }
            }).error(function(data, status, header, config) {
                $scope.games[index].busy = false
            })
        };
        $scope.unFollowGame = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.games[index].busy) return;
            $scope.games[index].busy = true;
            var gameId = $scope.games[index].gameId;
            Game.unFollow(gameId).success(function(data) {
                $scope.games[index].busy = false;
                if (data.status) {
                    $scope.games[index].followed = false
                }
            }).error(function() {
                $scope.games[index].busy = false
            })
        };
        $scope.continue = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if (!$scope.hasFollow) {
                var cf = window.confirm("You should follow one of those games. Are you sure to continue?");
                if (!cf) return false
            }
            $location.path("playersuggest")
        }
    }
})();
(function() {
    angular.module("App").controller("PlayerSuggestCtrl", PlayerSuggestCtrl);
    PlayerSuggestCtrl.$inject = ["$scope", "$rootScope", "$location", "User"];

    function PlayerSuggestCtrl($scope, $rootScope, $location, User) {
        $rootScope.currentPage = "playersuggest";
        $scope.users = [];
        $scope.limit = 10;
        $scope.cursor = "";
        $scope.busy = false;
        $scope.hasFollow = false;
        getPlayerSuggest();

        function getPlayerSuggest() {
            if ($scope.busy) return;
            $scope.busy = true;
            $scope.params = {
                limit: $scope.limit,
                cursor: $scope.cursor
            };
            User.getUserSuggestion($scope.params).success(function(data) {
                $scope.busy = false;
                if (data.status) {
                    var users = data.data.users;
                    if (users.length > 0) {
                        $scope.cursor = data.data.cursor;
                        for (var i = 0; i < users.length; i++) {
                            $scope.users.push(users[i])
                        }
                    }
                }
            }).error(function(data, status, header, config) {
                $scope.busy = false
            })
        }
        $scope.follow = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.users[index].busy) return;
            $scope.users[index].busy = true;
            var userId = $scope.users[index].userId;
            User.follow(userId).success(function(data) {
                $scope.users[index].busy = false;
                if (data.status) {
                    $scope.hasFollow = true;
                    $scope.users[index].followed = true
                }
            }).error(function(data, status, header, config) {
                $scope.users[index].busy = false
            })
        };
        $scope.unFollow = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.users[index].busy) return;
            $scope.users[index].busy = true;
            var userId = $scope.users[index].userId;
            User.unFollow(userId).success(function(data) {
                $scope.users[index].busy = false;
                $scope.users[index].busy = true;
                if (data.status) {
                    $scope.users[index].followed = false
                }
            }).error(function(data, status, header, config) {
                $scope.users[index].busy = false
            })
        };
        $scope.continue = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if (!$scope.hasFollow) {
                var cf = window.confirm("You should follow one of those gamers. Are you sure to continue?");
                if (!cf) return false
            }
            $location.path("profile")
        }
    }
})();
(function() {
    angular.module("App").controller("ProfileCtrl", ProfileCtrl);
    ProfileCtrl.$inject = ["$scope", "$rootScope", "$location", "User"];

    function ProfileCtrl($scope, $rootScope, $location, User) {
        $rootScope.currentPage = "profile";
        $scope.user = angular.copy($rootScope.me);
        $scope.user.loading = false;
        $scope.error = {
            msg: ""
        };
        $scope.save = function() {
            $scope.error.msg = "";
            var update = false;
            var params = {};
            if ($scope.user.avatarId != undefined) {
                params.avatar = $scope.user.avatarId;
                update = true
            }
            if ($scope.user.coverId != undefined) {
                params.cover = $scope.user.coverId;
                update = true
            }
            if (update) {
                $scope.user.loading = true;
                User.updateInfo("me", params).success(function(data, status, header, config) {
                    $scope.user.loading = false;
                    if (data.status) {
                        angular.forEach(data.data, function(value, key) {
                            if (key == "avatar") {
                                $rootScope.me.avatar = value
                            } else if (key == "cover") {
                                $rootScope.me.cover = value
                            }
                        });
                        $location.path("newsfeed/all")
                    } else {
                        $scope.error.msg = data.message
                    }
                }).error(function(data, status, header, config) {
                    $scope.user.loading = false;
                    $scope.error.msg = "Server's busy! Please try again!"
                })
            } else {
                $location.path("newsfeed/all")
            }
        }
    }
})();
(function() {
    angular.module("App").controller("RightSuggestClanCtrl", RightSuggestClanCtrl);
    RightSuggestClanCtrl.$inject = ["$scope", "$rootScope", "Clan", "Post"];

    function RightSuggestClanCtrl($scope, $rootScope, Clan, Post) {
        $scope.clans = [];
        $scope.url = "/ajax/index.php/clan";
        $scope.params = {
            limit: 10,
            offset: 0
        };
        if ($scope.gameId != undefined && $scope.gameId) $scope.params.gameId = $scope.gameId;
        getClanSuggest();

        function getClanSuggest() {
            Clan.getSuggest($scope.params).success(function(data) {
                if (data.status) {
                    var items = data.data.clans;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            if ($scope.clan != undefined) {
                                if (items[i].clanId != $scope.clan.clanId) {
                                    $scope.clans.push(items[i])
                                }
                            } else {
                                $scope.clans.push(items[i])
                            }
                        }
                        var count = $scope.clans.length
                    }
                }
            })
        }
        $scope.getMember = function(index) {
            var clanId = $scope.clans[index].clanId;
            var cursor = "";
            Clan.getMember(clanId, cursor).success(function(data) {
                if (data.status) {
                    $scope.clans[index].members = data.data.members
                }
            }).error(function(data, header, status, config) {})
        };
        $scope.joinClan = function(index) {
            if ($rootScope.loggedIn) {
                var clanId = $scope.clans[index].clanId;
                if ($scope.clans[index].busy) return;
                $scope.clans[index].busy = true;
                Clan.joinClan(clanId).success(function(data) {
                    $scope.clans[index].busy = false;
                    if (data.status) {
                        if (data.data.memberStatus == "joined") {
                            $scope.clans[index].role = "member"
                        } else if (data.data.memberStatus == "pending") {
                            alert("Your request has sent. Please wait for clan admin respond")
                        }
                        $scope.clans.splice(index, 1)
                    } else {}
                })
            } else {
                $scope.showLoginBox()
            }
        }
    }
})();
(function() {
    angular.module("App").controller("NewsFeedCtrl", NewsFeedCtrl);
    NewsFeedCtrl.$inject = ["$scope", "$rootScope", "$state", "$location", "$stateParams"];

    function NewsFeedCtrl($scope, $rootScope, $state, $location, $stateParams) {
        if (!$rootScope.loggedIn) {
            return $state.go("home")
        }
        $scope.filter = $stateParams.filter;
        var listFilter = ["followings", "games", "all"];
        if (listFilter.indexOf($scope.filter) == -1) {
            return $state.go("error")
        }
        $rootScope.currentPage = "newsfeed";
        $scope.page = "newsfeed";
        if ($scope.filter != "all") {
            $scope.params = {
                filter: $scope.filter
            }
        } else {
            $scope.params = {}
        }
        $scope.url = "/ajax/index.php/home/getnewsfeed"
    }
})();
(function() {
    angular.module("App").controller("UserCtrl", UserCtrl);
    UserCtrl.$inject = ["$scope", "$rootScope", "$http", "$location", "$stateParams", "$sce", "$upload", "$modal", "$state", "$interval", "$timeout", "User", "Post", "user"];

    function UserCtrl($scope, $rootScope, $http, $location, $stateParams, $sce, $upload, $modal, $state, $interval, $timeout, User, Post, user) {
        $scope.userId = $stateParams.userId;
        $scope.coverKeySuccess = "user-cover-upload-success";
        $scope.avatarKeySuccess = "user-avatar-upload-success";
        $scope.show = false;
        $scope.error = {
            status: false,
            msg: ""
        };
        $scope.user = {};
        $scope.userInfo = {};
        $scope.alias = {
            aliasId: ""
        };
        init();
        $scope.clanParams = {
            userId: $scope.userId
        };
        $scope.urlGetClan = "/ajax/index.php/user/clan";
        $scope.photoParams = {
            url: "/ajax/index.php/user/getphoto",
            userId: $scope.userId
        };
        $scope.genders = [{
            name: "Undefined",
            value: ""
        }, {
            name: "Male",
            value: "male"
        }, {
            name: "Female",
            value: "female"
        }];
        $scope.url = "/ajax/index.php/user/wall";
        $scope.page = "user";
        $scope.params = {
            userId: $scope.userId
        };
        $scope.$on("login-success", function(e, args) {
            init()
        });
        $scope.$on($scope.coverKeySuccess, function(e, data) {
            uploadMyCover(data.image)
        });
        $scope.$on($scope.avatarKeySuccess, function(e, data) {
            uploadMyAvatar(data.image)
        });

        function init() {
            if (!user || !user.status) $location.path("error");
            if (user.data.status) {
                $scope.user = user.data.data;
                if ($scope.user.accountType == "game_studio") {
                    $scope.gameUrl = "/ajax/index.php/games/getlistgame";
                    $scope.gameParams = {
                        userId: $scope.userId,
                        devId: $scope.user.userId
                    }
                } else {
                    $scope.gameUrl = "/ajax/index.php/user/getgame";
                    $scope.gameParams = {
                        userId: $scope.userId
                    }
                }
                angular.copy($scope.user, $scope.userInfo);
                if ($scope.user.username && $scope.user.username != $stateParams.userId) {
                    $state.go($state.$current.name, {
                        userId: $scope.user.username
                    }, {
                        location: "replace",
                        notify: false
                    })
                }
                updatePageTitle($state.current);
                $scope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
                    updatePageTitle(toState)
                });
                $scope.show = true
            } else {
                $location.path("error")
            }
        }
        $scope.saveInfo = function() {
            var hasUpdate = false;
            $scope.msg = {};
            var infoUpdate = {};
            if ($scope.userInfo.fullname != $rootScope.me.fullname) {
                hasUpdate = true
            }
            if ($scope.userInfo.birthday != $rootScope.me.birthday) {
                infoUpdate.birthday = $scope.userInfo.birthday;
                hasUpdate = true
            }
            if ($scope.userInfo.phone != $rootScope.me.phone) {
                infoUpdate.phone = $scope.userInfo.phone;
                hasUpdate = true
            }
            if ($scope.userInfo.country != $rootScope.me.country) {
                infoUpdate.country = $scope.userInfo.country;
                hasUpdate = true
            }
            if ($scope.userInfo.fullname != $rootScope.me.fullname) {
                infoUpdate.fullname = $scope.userInfo.fullname;
                hasUpdate = true
            }
            if ($scope.userInfo.gender != $rootScope.me.gender) {
                infoUpdate.gender = $scope.userInfo.gender;
                hasUpdate = true
            }
            if (hasUpdate) {
                $scope.updating = true;
                User.updateInfo("me", infoUpdate).success(function(data) {
                    $scope.updating = false;
                    if (typeof data.status == "undefined") {
                        $scope.msg.error = "Server's busy. Please try again!";
                        return
                    }
                    if (data.status) {
                        $scope.msg.success = "Update successfully!";
                        angular.copy($scope.userInfo, $rootScope.me);
                        $timeout(function() {
                            $scope.msg = {}
                        }, 2e3)
                    } else {
                        if (typeof data.info != "undefined") $scope.msg.error = data.info;
                        else $scope.msg.error = "Invalid information!"
                    }
                })
            } else {
                $scope.msg.error = "Information has not changed!"
            }
        };

        function updatePageTitle(state) {
            if (state.name == "user.friend") $rootScope.pageTitle = $scope.user.fullname + "'s Friends | onClan";
            else if (state.name == "user.game") $rootScope.pageTitle = $scope.user.fullname + "'s Games | onClan";
            else if (state.name == "user.clan") $rootScope.pageTitle = $scope.user.fullname + "'s Clans | onClan";
            else if (state.name == "user.photo") $rootScope.pageTitle = $scope.user.fullname + "'s Photos | onClan";
            else $rootScope.pageTitle = $scope.user.fullname + " | onClan"
        }
        $scope.unFollow = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.user.busy) return;
            $scope.user.busy = true;
            User.unFollow($scope.userId).success(function(data) {
                $scope.user.busy = false;
                if (data.status) {
                    $scope.user.followed = false;
                    $scope.user.totalFollower--
                }
            }).error(function(data, status, header, config) {
                $scope.user.busy = false
            })
        };
        $scope.follow = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.user.busy) return;
            $scope.user.busy = true;
            User.follow($scope.userId).success(function(data) {
                $scope.user.busy = false;
                if (data.status) {
                    $scope.user.followed = true;
                    $scope.user.totalFollower++
                }
            }).error(function(data, status, header, config) {
                $scope.user.busy = false
            })
        };
        $scope.openMeBox = function() {
            var modalInstance = $modal.open({
                templateUrl: "/views/me.box.html?v=" + $rootScope.getAppVersion(),
                controller: "MeBoxCtrl"
            });
            modalInstance.result.then(function(data) {})
        };

        function uploadMyCover(image) {
            var file = image;
            $scope.user.coverUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "cover",
                file: file
            })).success(function(data, status, header, config) {
                $scope.user.coverUploading = false;
                if (data.status) {
                    User.updateInfo("me", {
                        cover: data.data.photoId
                    }).success(function(data, status, header, config) {
                        $scope.user.loading = false;
                        if (data.status) {
                            $scope.user.cover = data.data.cover;
                            $rootScope.me.cover = data.data.cover
                        } else {
                            alert("Sorry, Server's busy. Please try again!")
                        }
                    }).error(function(data, status, header, config) {
                        alert("Server's busy! Please try again!")
                    })
                } else if (!data.status) {
                    alert("Sorry, Server's busy. Please try again!")
                }
            }).error(function(data, status, header, config) {
                $scope.user.coverUploading = false
            })
        }

        function uploadMyAvatar(image) {
            var file = image;
            $scope.user.avatarUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "avatar",
                file: file
            })).success(function(data, status, header, config) {
                $scope.user.avatarUploading = false;
                if (data.status) {
                    User.updateInfo("me", {
                        avatar: data.data.photoId
                    }).success(function(data, status, header, config) {
                        $scope.user.loading = false;
                        if (data.status) {
                            $scope.user.avatar = data.data.avatar;
                            $rootScope.me.avatar = data.data.avatar
                        } else {
                            alert("Sorry, Connect's timeout, Please try again!")
                        }
                    }).error(function(data, status, header, config) {
                        alert("Server's busy! Please try again!")
                    })
                } else if (!data.status) {
                    alert("Sorry, Connect's timeout, Please try again!")
                }
            }).error(function(data, status, header, config) {
                $scope.user.avatarUploading = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("ProfileCtrl", ProfileCtrl);
    ProfileCtrl.$inject = ["$scope", "$rootScope", "$location", "$http", "$state", "User"];

    function ProfileCtrl($scope, $rootScope, $location, $http, $state, User) {
        $rootScope.currentPage = "profile";
        $scope.user = angular.copy($rootScope.me);
        $scope.user.loading = false;
        $scope.error = {
            msg: ""
        };
        $scope.coverKeySuccess = "user-cover-upload-success";
        $scope.avatarKeySuccess = "user-avatar-upload-success";
        $scope.$on($scope.coverKeySuccess, function(e, data) {
            uploadMyCover(data.image)
        });
        $scope.$on($scope.avatarKeySuccess, function(e, data) {
            uploadMyAvatar(data.image)
        });
        $scope.save = function() {
            $scope.error.msg = "";
            var update = false;
            var params = {};
            if ($scope.user.avatarId != undefined) {
                params.avatar = $scope.user.avatarId;
                update = true
            }
            if ($scope.user.coverId != undefined) {
                params.cover = $scope.user.coverId;
                update = true
            }
            if (update) {
                $scope.user.loading = true;
                User.updateInfo("me", params).success(function(data, status, header, config) {
                    $scope.user.loading = false;
                    if (data.status) {
                        angular.forEach(data.data, function(value, key) {
                            if (key == "avatar") {
                                $rootScope.me.avatar = value
                            } else if (key == "cover") {
                                $rootScope.me.cover = value
                            }
                        });
                        $location.path("newsfeed/all")
                    } else {
                        $scope.error.msg = data.message
                    }
                }).error(function(data, status, header, config) {
                    $scope.user.loading = false;
                    $scope.error.msg = "Server's busy! Please try again!"
                })
            } else {
                $location.path("newsfeed/all")
            }
        };

        function uploadMyCover(image) {
            var file = image;
            $scope.user.coverUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "cover",
                file: file
            })).success(function(data, status, header, config) {
                $scope.user.coverUploading = false;
                if (data.status) {
                    User.updateInfo("me", {
                        cover: data.data.photoId
                    }).success(function(data, status, header, config) {
                        $scope.user.loading = false;
                        if (data.status) {
                            $scope.user.cover = data.data.cover;
                            $rootScope.me.cover = data.data.cover
                        } else {
                            alert("Sorry, Server's busy. Please try again!")
                        }
                    }).error(function(data, status, header, config) {
                        alert("Server's busy! Please try again!")
                    })
                } else if (!data.status) {
                    alert("Sorry, Server's busy. Please try again!")
                }
            }).error(function(data, status, header, config) {
                $scope.user.coverUploading = false
            })
        }

        function uploadMyAvatar(image) {
            var file = image;
            $scope.user.avatarUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "avatar",
                file: file
            })).success(function(data, status, header, config) {
                $scope.user.avatarUploading = false;
                if (data.status) {
                    User.updateInfo("me", {
                        avatar: data.data.photoId
                    }).success(function(data, status, header, config) {
                        $scope.user.loading = false;
                        if (data.status) {
                            $scope.user.avatar = data.data.avatar;
                            $rootScope.me.avatar = data.data.avatar
                        } else {
                            alert("Sorry, Connect's timeout, Please try again!")
                        }
                    }).error(function(data, status, header, config) {
                        alert("Server's busy! Please try again!")
                    })
                } else if (!data.status) {
                    alert("Sorry, Connect's timeout, Please try again!")
                }
            }).error(function(data, status, header, config) {
                $scope.user.avatarUploading = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("MeBoxCtrl", MeBoxCtrl);
    MeBoxCtrl.$inject = ["$scope", "$rootScope", "$modalInstance", "User"];

    function MeBoxCtrl($scope, $rootScope, $modalInstance, User) {
        $scope.user = angular.copy($rootScope.me);
        $scope.user.loading = false;
        $scope.error = {
            msg: ""
        };
        $scope.dismiss = function() {
            $modalInstance.close("cancel")
        };
        $scope.save = function() {
            $scope.error.msg = "";
            update = false;
            var params = {};
            if ($scope.user.avatarId != undefined) {
                params.avatar = $scope.user.avatarId;
                update = true
            }
            if ($scope.user.coverId != undefined) {
                params.cover = $scope.user.coverId;
                update = true
            }
            if (update) {
                $scope.user.loading = true;
                User.updateInfo("me", params).success(function(data, status, header, config) {
                    $scope.user.loading = false;
                    if (data.status) {
                        angular.forEach(data.data, function(value, key) {
                            if (key == "avatar") {
                                $rootScope.me.avatar = value
                            } else if (key == "cover") {
                                $rootScope.me.cover = value
                            }
                        });
                        $modalInstance.close()
                    } else {
                        $scope.error.msg = data.message
                    }
                }).error(function(data, status, header, config) {
                    $scope.user.loading = false;
                    $scope.error.msg = "Server's busy! Please try again!"
                })
            } else {
                $scope.error.msg = "Infomation not change!"
            }
        }
    }
})();
(function() {
    angular.module("App").controller("FriendCtrl", FriendCtrl);
    FriendCtrl.$inject = ["$scope", "$rootScope", "$location", "User"];

    function FriendCtrl($scope, $rootScope, $location, User) {
        $scope.tabFollowing = true;
        $scope.tabFollower = false;
        $scope.searchFriend = {
            fullname: ""
        };
        $scope.selectTab = function(tab) {
            if (tab) {
                $scope.tabFollowing = true;
                $scope.tabFollower = false
            } else {
                $scope.tabFollowing = false;
                $scope.tabFollower = true
            }
        }
    }
})();
(function() {
    angular.module("App").controller("FollowingCtrl", FollowingCtrl);
    FollowingCtrl.$inject = ["$scope", "$rootScope", "User"];

    function FollowingCtrl($scope, $rootScope, User) {
        $scope.followings = [];
        $scope.cursorFollowing = "";
        $scope.busyFollowing = false;
        $scope.loadmore = true;
        $scope.followingLoaded = false;
        $scope.loadMoreFollowing = function() {
            if ($scope.$parent.searchFriend.fullname) return;
            if ($scope.busyFollowing == true) return;
            if (!$scope.loadmore) return;
            $scope.busyFollowing = true;
            User.getListFollowing($scope.userId, $scope.cursorFollowing).success(function(data, status, header, config) {
                if (data.status) {
                    $scope.followingLoaded = true;
                    $scope.totalFollowing = data.data.total;
                    var items = data.data.followings;
                    if (items.length > 0) {
                        for (i = 0; i < items.length; i++) {
                            $scope.followings.push(items[i])
                        }
                        $scope.cursorFollowing = data.data.cursor
                    } else {
                        $scope.loadmore = false
                    }
                    $scope.busyFollowing = false
                }
            })
        }
    }
})();
(function() {
    angular.module("App").controller("FollowerCtrl", FollowerCtrl);
    FollowerCtrl.$inject = ["$scope", "$rootScope", "User"];

    function FollowerCtrl($scope, $rootScope, User) {
        $scope.followers = [];
        $scope.cursorFollower = "";
        $scope.busyFollower = false;
        $scope.loadmore = true;
        $scope.followerLoaded = false;
        $scope.loadMoreFollower = function() {
            if ($scope.$parent.searchFriend.fullname) return;
            if ($scope.busyFollower == true) return;
            if (!$scope.loadmore) return;
            $scope.busyFollower = true;
            User.getListFollower($scope.userId, $scope.cursorFollower).success(function(data) {
                if (data.status) {
                    $scope.followerLoaded = true;
                    $scope.totalFollower = data.data.total;
                    var items = data.data.followers;
                    if (items.length > 0) {
                        for (i = 0; i < items.length; i++) {
                            $scope.followers.push(items[i])
                        }
                        $scope.cursorFollower = data.data.cursor
                    } else {
                        $scope.loadmore = false
                    }
                    $scope.busyFollower = false
                }
            })
        }
    }
})();
(function() {
    angular.module("App").controller("UserFollowCtrl", UserFollowCtrl);
    UserFollowCtrl.$inject = ["$scope", "$rootScope", "User"];

    function UserFollowCtrl($scope, $rootScope, User) {
        $scope.init = function(user) {
            $scope.user = user
        };
        $scope.unFollow = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.user.busy) return;
            $scope.user.busy = true;
            User.unFollow($scope.user.userId).success(function(data) {
                $scope.user.busy = false;
                if (data.status) {
                    $scope.user.followed = false
                }
            }).error(function(data, status, header, config) {
                $scope.user.busy = false
            })
        };
        $scope.follow = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.user.busy) return;
            $scope.user.busy = true;
            User.follow($scope.user.userId).success(function(data) {
                $scope.user.busy = false;
                if (data.status) {
                    $scope.user.followed = true
                }
            }).error(function(data, status, header, config) {
                $scope.user.busy = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("ClansCtrl", ClansCtrl);
    ClansCtrl.$inject = ["$scope", "$location", "$stateParams", "$rootScope", "Clan"];

    function ClansCtrl($scope, $location, $stateParams, $rootScope, Clan) {
        $scope.urlGetClan = "/ajax/index.php/clan/getlistclan";
        $scope.clanParams = {};
        $rootScope.currentPage = "clans";
        if ($location.path() == "/clans/me" && !$rootScope.loggedIn) {
            $location.path("/games/")
        }
        var arrOrder = ["hot", "new", "me"];
        if (arrOrder.indexOf($stateParams.order) != -1) {
            if ($stateParams.order != "me") {
                $scope.clanParams.order = $stateParams.order
            } else {
                $scope.clanParams.userId = "me";
                $scope.urlGetClan = "/ajax/index.php/user/clan"
            }
        } else {
            $location.path("/clans/hot")
        }
    }
})();
(function() {
    angular.module("App").controller("ClanCtrl", ClanCtrl);
    ClanCtrl.$inject = ["$scope", "$state", "$stateParams", "$rootScope", "$modal", "$location", "Clan", "User"];

    function ClanCtrl($scope, $state, $stateParams, $rootScope, $modal, $location, Clan, User) {
        $rootScope.currentPage = "clans";
        var clanId = $stateParams.clanId;
        $scope.clanId = $stateParams.clanId;
        $scope.clan = {};
        $scope.alias = {
            aliasId: ""
        };
        $scope.show = false;
        $rootScope.me.isAdmin = false;
        $scope.error = {
            status: false,
            msg: ""
        };
        $scope.url = "/ajax/index.php/clan/wall";
        $scope.page = "clan";
        $scope.params = {
            clanId: clanId
        };
        init();
        $scope.$on("login-success", function(e, args) {
            init()
        });

        function init() {
            Clan.getInfo(clanId).success(function(data) {
                if (data.status) {
                    $scope.show = true;
                    $scope.clan = data.data;
                    if ($scope.clan.status == "deactivated" && $rootScope.me.userId != $scope.clan.creator.userId) {
                        return $state.go("error")
                    }
                    $scope.clan.onclanUrl = $state.href("clan", {
                        clanId: $scope.clan.clanId
                    }, {
                        absolute: true
                    });
                    $scope.clan.gameUrl = $state.href("game", {
                        gameId: $scope.clan.game.gameId
                    });
                    if ($scope.clan.slug && $scope.clan.slug != $stateParams.clanId) {
                        $state.go($state.$current.name, {
                            clanId: $scope.clan.slug
                        }, {
                            location: "replace",
                            notify: false
                        })
                    }
                    $scope.updatePageTitle($state.current);
                    $scope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
                        $scope.updatePageTitle(toState)
                    });
                    $rootScope.pageDesc = $scope.clan.desc.substr(0, 200);
                    if (!$rootScope.pageDesc) $rootScope.pageDesc = " ";
                    $scope.clan.hasAnnouncement = false;
                    $scope.gameId = $scope.clan.gameId;
                    if ($scope.clan.alias != undefined) $scope.alias = $scope.clan.alias;
                    if ($scope.clan.memberStatus == "joined" || $scope.clan.status == "open") {
                        $scope.clan.isShow = true
                    }
                    if ($scope.clan.role == "admin" || $scope.clan.role == "creator") {
                        $rootScope.me.isAdmin = true
                    }
                    if ($scope.clan.status == "deactivated" && $scope.clan.role != "creator") {
                        $scope.clan.isShow = false
                    }
                    if ($scope.clan.game.announcement != undefined) {
                        $scope.clan.hasAnnouncement = true
                    }
                    $rootScope.$broadcast("get-alias-success", {})
                } else if (typeof data.errorCode != "undefined") {
                    $location.path("error")
                }
            })
        }
        $scope.updatePageTitle = function(state) {
            if (state.name == "clan.member") {
                $rootScope.pageTitle = "Members - " + $scope.clan.name + " | onClan";
                $rootScope.pageDesc = " "
            } else if (state.name == "clan.event") {
                $rootScope.pageTitle = $scope.clan.name + "'s Events | onClan";
                $rootScope.pageDesc = " "
            } else {
                $rootScope.pageTitle = "Clan " + $scope.clan.name + " - " + $scope.clan.game.name + " | onClan";
                $rootScope.pageDesc = "Clan " + $scope.clan.name + " - " + $scope.clan.desc
            }
        };
        $scope.joinClan = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return false
            }
            Clan.joinClan(clanId).success(function(data) {
                if (data.status) {
                    $scope.clan.memberStatus = data.data.memberStatus;
                    if (data.data.memberStatus == "pending") {
                        alert("Your request has sent. Please wait for clan admin respond");
                        return false
                    } else if (data.data.memberStatus == "joined") {
                        $scope.clan.totalMember++;
                        $scope.clan.role = "member";
                        if ($scope.clan.status == "close") $scope.clan.isShow = true
                    }
                }
            })
        };
        $scope.listMember = function() {
            var modalInstance = $modal.open({
                templateUrl: "/views/clanmember.html?v=" + $rootScope.getAppVersion(),
                controller: "ClanMemberCtrl",
                resolve: {
                    clanId: function() {
                        return $scope.clanId
                    }
                }
            });
            modalInstance.result.then(function(data) {})
        };
        $scope.invite = function() {
            var modalInstance = $modal.open({
                templateUrl: "/views/invitebox.html?v=" + $rootScope.getAppVersion(),
                controller: "ClanInviteCtrl",
                resolve: {
                    clanInviteId: function() {
                        return $scope.clan.clanId
                    }
                }
            });
            modalInstance.result.then(function(data) {})
        };
        $scope.clanInfo = function() {
            var modalInstance = $modal.open({
                templateUrl: "/views/claninfo.html?v=" + $rootScope.getAppVersion(),
                controller: "ClanInfoCtrl",
                resolve: {
                    clan: function() {
                        return $scope.clan
                    }
                }
            });
            modalInstance.result.then(function(data) {
                if (data.status != $scope.clan.status || data.notification != $scope.clan.notification) {
                    $scope.clan.status = data.status;
                    $scope.clan.notification = data.notification
                }
            })
        };
        $scope.leaveClan = function() {
            var confirm = window.confirm("Do you want to leave this clan?");
            if (!confirm) return false;
            Clan.leaveClan(clanId).success(function(data) {
                if (data.status) {
                    $scope.clan.totalMember--;
                    $scope.clan.memberStatus = "guest";
                    $scope.clan.role = "guest";
                    if ($scope.clan.status == "close") $scope.clan.isShow = false
                }
            })
        };
        $scope.activeClan = function() {
            Clan.updateInfo({
                method: "post",
                clanId: clanId,
                status: "open"
            }).success(function(data) {
                if (data.status) {
                    $scope.clan.status = "open";
                    $scope.clan.isShow = true
                }
            })
        };
        $scope.deactiveClan = function() {
            var confirm = window.confirm("Do you want to deactive this clan?");
            if (!confirm) return false;
            Clan.updateInfo({
                method: "post",
                clanId: clanId,
                status: "deactivated"
            }).success(function(data) {
                if (data.status) {
                    $scope.clan.status = "deactivated";
                    if ($scope.clan.role != "creator") $scope.clan.isShow = false
                }
            })
        };
        $scope.editClan = function() {
            var modalInstance = $modal.open({
                templateUrl: "/views/clan.edit.html?v=" + $rootScope.getAppVersion(),
                controller: "ClanEditCtrl",
                resolve: {
                    clanEdit: function() {
                        return $scope.clan
                    }
                }
            });
            modalInstance.result.then(function(data) {
                var newData = data;
                for (key in newData) {
                    $scope.clan[key] = newData[key]
                }
            })
        };
        $scope.updateClan = function(type) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.clan.role !== "creator" && $scope.clan.role !== "admin") return;
            var param = {
                method: "post",
                clanId: $scope.clan.clanId
            };
            if (type === "notification") {
                if ($scope.clan.notification === true) {
                    notification = 1
                } else {
                    notification = 0
                }
                param.notification = notification
            } else if (type == "status") {
                param.status = $scope.clan.status
            }
            Clan.updateInfo(param).success(function(data) {
                if (data.status) {}
            }).error(function() {})
        }
    }
})();
(function() {
    angular.module("App").controller("ClanEditCtrl", ClanEditCtrl);
    ClanEditCtrl.$inject = ["$scope", "$modalInstance", "Clan", "clanEdit"];

    function ClanEditCtrl($scope, $modalInstance, Clan, clanEdit) {
        $scope.clan = angular.copy(clanEdit);
        $scope.save = function() {
            if ($scope.clan.role !== "creator" && $scope.clan.role !== "admin") return;
            var update = false;
            var param = {
                method: "post",
                clanId: $scope.clan.clanId
            };
            if ($scope.clan.notification != clanEdit.notification) {
                var notification = 0;
                if ($scope.clan.notification) notification = 1;
                param.notification = notification;
                update = true
            }
            if ($scope.clan.desc != clanEdit.desc) {
                var notification = 0;
                param.desc = $scope.clan.desc;
                update = true
            }
            if ($scope.clan.status != clanEdit.status) {
                param.status = $scope.clan.status;
                update = true
            }
            if (update) {
                Clan.updateInfo(param).success(function(data) {
                    if (data.status) {
                        $modalInstance.close(data.data)
                    } else {
                        alert(data.message)
                    }
                }).error(function() {
                    alert("Update error! Try again later!")
                })
            } else {}
        };
        $scope.dismiss = function() {
            $modalInstance.dismiss()
        }
    }
})();
(function() {
    angular.module("App").controller("ClanInviteCtrl", ClanInviteCtrl);
    ClanInviteCtrl.$inject = ["$scope", "$modalInstance", "$timeout", "User", "Clan", "clanInviteId"];

    function ClanInviteCtrl($scope, $modalInstance, $timeout, User, Clan, clanInviteId) {
        $scope.clanId = clanInviteId;
        $scope.keyword = "";
        $scope.friendInvites = [];
        $scope.userInvites = {};
        $scope.success = "";
        $scope.showInvite = false;
        $scope.$watch("keyword", function() {
            if (!$scope.keyword) {
                User.getFriend().success(function(data) {
                    if (data.status) {
                        $scope.friendInvites = data.data.buddies
                    }
                })
            } else {
                User.searchFriend({
                    keyword: $scope.keyword
                }).success(function(data) {
                    $scope.friendInvites = data.data.results
                })
            }
        });
        $scope.inviteUser = function(userId, fullname) {
            var user = {
                userId: userId,
                fullname: fullname
            };
            $scope.userInvites[userId] = user;
            $scope.showInvite = true
        };
        $scope.removeUserInvite = function(userId) {
            if (typeof $scope.userInvites[userId] != "undefined") delete $scope.userInvites[userId];
            if (isEmpty($scope.userInvites)) {
                $scope.showInvite = false
            }
        };
        $scope.sendInvite = function() {
            var userIds = [];
            for (key in $scope.userInvites) {
                userIds.push(key)
            }
            if (!userIds.length) {
                alert("Please choose at least one user!");
                return false
            }
            Clan.invite($scope.clanId, userIds).success(function(data) {
                if (data.status) {
                    $scope.userInvites = {};
                    $scope.showInvite = false;
                    $scope.success = "Invite successfully!";
                    $timeout(function() {
                        $modalInstance.close($scope.clanId)
                    }, 1e3)
                }
            })
        };
        $scope.closeModal = function() {
            $modalInstance.close($scope.clanId)
        };
        $scope.dismiss = function() {
            $modalInstance.dismiss($scope.clanId)
        }
    }
})();
(function() {
    angular.module("App").controller("ClanMemberCtrl", ClanMemberCtrl);
    ClanMemberCtrl.$inject = ["$scope", "$rootScope", "$state", "User", "Clan"];

    function ClanMemberCtrl($scope, $rootScope, $state, User, Clan) {
        $scope.members = [];
        $scope.loadmore = true;
        $scope.cursorMember = "";
        $scope.busyMember = false;
        $scope.loadMoreMember = function() {
            if ($state.current.name != "clan.member") return;
            if ($scope.busyMember) return;
            if (!$scope.loadmore) return;
            $scope.busyMember = true;
            Clan.getMember($scope.clanId, $scope.cursorMember).success(function(data) {
                if (data.status) {
                    var items = data.data.members;
                    if (items.length > 0) {
                        for (i = 0; i < items.length; i++) {
                            if (typeof items[i].aliasId != "undefined") {
                                items[i].isAlias = true
                            } else {
                                items[i].isUser = true
                            }
                            $scope.members.push(items[i])
                        }
                        $scope.cursorMember = data.data.cursor
                    } else {
                        $scope.loadmore = false
                    }
                } else {}
                $scope.busyMember = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("UpdateClanCoverCtrl", UpdateClanCoverCtrl);
    UpdateClanCoverCtrl.$inject = ["$scope", "$rootScope", "$http", "Clan"];

    function UpdateClanCoverCtrl($scope, $rootScope, $http, Clan) {
        $scope.coverClanSuccess = "cover-clan-success";
        $scope.updateClanCover = function(image) {
            var file = image;
            $scope.clan.coverUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "cover",
                file: file
            })).success(function(data, status, header, config) {
                if (data.status) {
                    Clan.updateInfo({
                        clanId: $scope.clanId,
                        cover: data.data.photoId
                    }).success(function(data, status, header, config) {
                        $scope.clan.coverUploading = false;
                        if (data.status) {
                            $scope.clan.cover = data.data.cover
                        } else if (typeof data.status != "undefined") {
                            alert(data.message);
                            return
                        } else {
                            alert("Server's busy! Please try again!");
                            return
                        }
                    })
                } else {
                    $scope.clan.coverUploading = false;
                    if (typeof data.status != "undefined") {
                        alert(data.message);
                        return
                    } else {
                        alert("Server's busy! Please try again!");
                        return
                    }
                }
            }).error(function() {
                $scope.clan.coverUploading = false
            })
        };
        $scope.$on($scope.coverClanSuccess, function(e, data) {
            if (typeof data.image !== "undefined") {
                $scope.updateClanCover(data.image)
            }
        })
    }
})();
(function() {
    angular.module("App").controller("ListClanCtrl", ListClanCtrl);
    ListClanCtrl.$inject = ["$scope", "$rootScope", "$state", "Clan"];

    function ListClanCtrl($scope, $rootScope, $state, Clan) {
        if ($state.$current.name == "clans") {
            $rootScope.pageTitle = "Clans | onClan";
            $rootScope.pageDesc = ""
        }
        $scope.clans = [];
        $scope.busy = false;
        $scope.cursorClan = "";
        $scope.loadmore = true;
        $scope.hasLoaded = false;
        $scope.initClan = function() {
            if ($scope.busy) return;
            if (!$scope.loadmore) return;
            $scope.busy = true;
            $scope.clanParams.cursor = $scope.cursorClan;
            Clan.nextPage($scope.urlGetClan, $scope.clanParams).success(function(data) {
                if (data.status) {
                    $scope.hasLoaded = true;
                    var items = data.data.clans;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].slug != undefined) {
                                items[i].link = "/clan/" + items[i].slug
                            } else {
                                items[i].link = "/clan/" + items[i].clanId
                            }
                            $scope.clans.push(items[i])
                        }
                        $scope.cursorClan = data.data.cursor
                    } else {
                        $scope.loadmore = false
                    }
                }
                $scope.busy = false
            })
        };
        $scope.joinClan = function(index) {
            if ($rootScope.loggedIn) {
                var clanId = $scope.clans[index].clanId;
                Clan.joinClan(clanId).success(function(data) {
                    if (data.status) {
                        $scope.clans[index].memberStatus = data.data.memberStatus;
                        if (data.data.memberStatus == "pending") {
                            alert("Your request has sent. Please wait for clan admin respond")
                        }
                    } else {}
                })
            } else {
                $scope.showLoginBox()
            }
        }
    }
})();
(function() {
    angular.module("App").controller("PostDetailCtrl", PostDetailCtrl);
    PostDetailCtrl.$inject = ["$scope", "$state", "$rootScope", "$stateParams", "$q", "$timeout", "User", "post"];

    function PostDetailCtrl($scope, $state, $rootScope, $stateParams, $q, $timeout, User, post) {
        $scope.option = {
            useAlias: 0
        };
        $scope.alias = {};
        init();
        $rootScope.currentPage = "post";
        $scope.page = "postdetail";
        $scope.postId = $stateParams.postId;
        $scope.error = {
            status: false,
            msg: ""
        };
        $scope.show = false;
        $scope.friends = [];
        $scope.getFriend = function() {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        };
        if ($rootScope.loggedIn) $scope.getFriend();
        $scope.mentionCm = "";
        $scope.macros = {};
        $scope.people = [];
        $scope.searchPeople = function(term) {
            var keyword = term;
            if (!keyword) return;
            var buddies = [];
            User.searchFriend({
                keyword: keyword
            }).then(function(res) {
                buddies = res.data.data.results;
                $scope.people = buddies;
                return $q.when(buddies)
            })
        };
        $scope.getPeopleText = function(item) {
            if (typeof item.aliasId != "undefined") {
                var id = item.aliasId
            } else {
                var id = item.userId
            }
            return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
        };
        $scope.getPeopleTextRaw = function(item) {
            return "@" + item.fullname
        };

        function init() {
            if (!post) return false;
            if (post.data.status) {
                $scope.show = true;
                $scope.detailPost = post.data.data;
                if ($scope.detailPost.to.aliasId != undefined) getAliasInfo($scope.detailPost.to.aliasId);
                if ($scope.detailPost.to.gameId != undefined) {
                    $scope.$broadcast("get-post-success", $scope.detailPost.to.gameId)
                }
                if ($scope.detailPost.to.wall == "clanwall") {
                    $scope.privacies = [{
                        name: "Public",
                        value: "public"
                    }, {
                        name: "Members",
                        value: "clan"
                    }]
                } else {
                    $scope.privacies = [{
                        name: "Public",
                        value: "public",
                        "class": "location_sm"
                    }, {
                        name: "Following",
                        value: "following",
                        "class": "friend_sm"
                    }, {
                        name: "Follower",
                        value: "follower",
                        "class": "friend_sm"
                    }, {
                        name: "Only me",
                        value: "onlyme",
                        "class": "onlyme_sm"
                    }]
                }
            } else {
                $state.go("error")
            }
            $scope.loading = false
        }
        $scope.$on("update-alias-success", function(e, data) {
            var newData = data;
            $scope.alias = newData;
            $scope.option = {
                useAlias: 1
            }
        });
        $timeout(function() {
            if (!$rootScope.loggedIn) {
                $rootScope.remind = true
            }
        }, 2e4);

        function getAliasInfo(aliasId) {
            User.getAliasInfo(aliasId).success(function(data, status, header, config) {
                if (data.status) {
                    $scope.alias = data.data;
                    $scope.option = {
                        useAlias: 1
                    }
                }
            }).error(function(data, status, header, config) {})
        }
    }
})();
(function() {
    angular.module("App").controller("PostCtrl", PostCtrl);
    PostCtrl.$inject = ["$scope", "$state", "$rootScope", "$location", "$stateParams", "$modal", "$q", "$timeout", "$window", "$http", "Post", "User", "Game"];

    function PostCtrl($scope, $state, $rootScope, $location, $stateParams, $modal, $q, $timeout, $window, $http, Post, User, Game) {
        $scope.showTranslate = false;
        $scope.canTranslate = true;
        $scope.$on("noti-comment", function(e, data) {
            var object = data;
            if (object.postId == $scope.post.postId) {
                if ($rootScope.totalUnreadNoti) $rootScope.totalUnreadNoti--;
                $scope.getCommentAfter()
            }
        });
        $scope.init = function(post, id) {
            $scope.loading = false;
            $scope.post = post;
            if (typeof id !== "undefined") $scope.id = id;
            if (!post.content.text) {
                $scope.canTranslate = false
            } else if (!$rootScope.loggedIn) $scope.canTranslate = false;
            else if (post.content.text.length < 4) $scope.canTranslate = false;
            else if (!post.content.lang) {
                $scope.canTranslate = false
            } else if ($rootScope.me.country == "VN" && post.content.lang == "vi") $scope.canTranslate = false;
            else if ($rootScope.me.country != "VN" && post.content.lang == "en") $scope.canTranslate = false;
            else if ($rootScope.me.userId == post.by.userId) $scope.canTranslate = false;
            if ($scope.post.type == "video") {
                $scope.post.onclanUrl = $state.href("game.videodetail", {
                    postId: $scope.post.postId
                }, {
                    absolute: true
                })
            } else $scope.post.onclanUrl = $state.href("post", {
                postId: $scope.post.postId
            }, {
                absolute: true
            });
            $scope.post.focus = false;
            $scope.post.isLoading = false;
            $scope.post.showPrivacy = false;
            if ($scope.post.totalComment > 0) {
                $scope.post.showComment = true
            } else {
                $scope.post.showComment = false
            }
            var moreComment = false;
            $scope.post.comments = {
                data: [],
                cursor: "",
                moreComment: moreComment
            };
            if ($scope.post.by.aliasId !== undefined) {
                $scope.post.byAlias = true
            } else {
                $scope.post.byUser = true
            }
            if ($scope.post.type == "share") {
                $scope.post.shareType = true
            }
            if ($scope.post.type == "create_clan") {
                $scope.post.clanType = true
            }
            if ($scope.post.type == "follow") {
                $scope.post.followType = true
            }
            if ($scope.post.type == "game") {
                $scope.post.playingType = true
            }
            if ($scope.post.type == "photo" || $scope.post.type == "album") {
                $scope.post.photoType = true
            }
            if ($scope.post.type == "cover") {
                $scope.post.coverType = true
            }
            if ($scope.post.type == "avatar") {
                $scope.post.avatarType = true
            }
            if ($scope.post.type == "link") {
                $scope.post.linkType = true;
                if ($scope.post.content.linkdata.thumb !== "") {
                    $scope.post.isLinkImg = true
                } else {
                    $scope.post.isLinkImg = false
                }
                $scope.post.link = {};
                $scope.post.link.url = $scope.post.content.links[0].link;
                var url = document.createElement("a");
                url.href = $scope.post.content.links[0].link;
                $scope.post.link.hostname = url.hostname
            }
            if ($scope.post.canDelete) {
                $scope.post.hideAction = true
            } else {
                $scope.post.hideAction = false
            }
            if (typeof $scope.post.content.text !== "undefined") {
                if ($scope.post.content.text.length > $rootScope.txtLength) {
                    $scope.post.showMore = true;
                    $scope.post.moreTxt = $scope.post.content.text;
                    $scope.post.content.text = $scope.post.content.text.substr(0, $rootScope.txtLength) + "..."
                }
            }
            if ($state.current.name == "post" || $state.current.name == "game.live" || $state.current.name == "game.video" || $rootScope.page == "postbox") $scope.getComment(5)
        };
        $scope.showMore = function() {
            $scope.post.showMore = false;
            $scope.post.content.text = $scope.post.moreTxt
        };
        $scope.toggleTranslateText = function() {
            $scope.translating = false;
            $scope.showTranslate = !$scope.showTranslate;
            if ($scope.post.content.translatedText) return true;
            if (!$scope.post.content.text) return false;
            $scope.translating = true;
            $http.post("/ajax/index.php/translate", serializeData({
                t: $scope.post.content.text,
                src: $scope.post.content.lang
            })).success(function(data) {
                $scope.translating = false;
                if (data.text) $scope.post.content.translatedText = data.text;
                else $scope.showTranslate = false
            }).error(function() {
                $scope.translating = false;
                $scope.showTranslate = false
            })
        };
        $scope.openAliasBox = function() {
            var gameId = "";
            if ($scope.post.to.gameId != undefined) {
                gameId = $scope.post.to.gameId;
                $scope.updateAliasUser(gameId)
            } else if ($scope.post.to.clanId != undefined) {
                clanId = $scope.post.to.clanId;
                Clan.getInfo(clanId).success(function(data) {
                    if (data.status) {
                        gameId = data.clan.game.gameId;
                        $scope.updateAliasUser(gameId)
                    }
                })
            }
        };
        $scope.selectPost = function(id) {
            var post = angular.copy($scope.post);
            post.activeId = id;
            if (typeof $scope.alias != "undefined") post.alias = $scope.alias;
            if (typeof $scope.option != "undefined" && typeof $scope.option.useAlias != "undefined") post.useAlias = $scope.option.useAlias;
            var modalInstance = $modal.open({
                templateUrl: "/views/postbox.html?v=" + $rootScope.getAppVersion(),
                controller: "PostBoxCtrl",
                size: "lg",
                windowClass: " dialog-photo",
                resolve: {
                    postBox: function() {
                        return post
                    }
                }
            });
            modalInstance.result.then(function(data) {})
        };
        $scope.selectUserFollow = function() {
            var modalInstance = $modal.open({
                templateUrl: "/views/listfollow.html?v=" + $rootScope.getAppVersion(),
                controller: "ListFollowPostCtrl",
                resolve: {
                    listFollows: function() {
                        return $scope.post.content.follow
                    }
                }
            });
            modalInstance.result.then(function(data) {})
        };
        $scope.checkAlias = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.page == "game" || $scope.page == "clan") {
                if (!$scope.alias.aliasId) {
                    $rootScope.gameId = $scope.gameId;
                    User.getAliasSetting().success(function(data) {
                        if (data.status) {
                            if (data.data.useAlias == "yes") {
                                Game.getAlias($rootScope.gameId).success(function(data) {
                                    if (data.status) {
                                        if (typeof data.data.alias == "undefined") {} else {
                                            return
                                        }
                                    }
                                })
                            }
                        }
                    })
                }
            }
        };
        $scope.checkComment = function() {
            if ($scope.post.inputComment) {
                $rootScope.isComment = true
            }
        };
        $scope.focusInput = function() {
            $scope.post.focus = true;
            $scope.post.comments.error = "";
            $scope.checkAlias()
        };
        $scope.showBtn = function() {
            $scope.post.showPostCm = true;
            $scope.post.comments.error = ""
        };
        $scope.resetFocus = function() {
            if (!$scope.post.inputComment) {
                $scope.post.showPostCm = false
            }
            $scope.post.focus = false;
            $scope.post.comments.error = ""
        };
        $scope.editPrivacy = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var postId = $scope.post.postId;
            var privacy = $scope.privacies[id].value;
            if ($scope.post.privacy != privacy) {
                var params = {
                    postId: postId,
                    privacy: privacy
                };
                $scope.post.isLoading = true;
                Post.updatePost(params).success(function(data, status, header, config) {
                    $scope.post.isLoading = false;
                    if (data.status) {
                        $scope.post.privacy = privacy
                    } else {
                        alert(data.message)
                    }
                }).error(function(data, status, header, config) {
                    $scope.post.isLoading = false
                })
            }
        };
        $scope.getComment = function(limit) {
            if ($scope.post.loadingComment) return;
            if (typeof limit == "undefined") {
                limit = 10
            }
            $scope.post.loadingComment = true;
            var postId = $scope.post.postId;
            var cursor = $scope.post.comments.cursor;
            Post.getComment(postId, cursor, limit).success(function(data, status, header, config) {
                if (data.status) {
                    if (data.data.total > 0) {
                        if (data.data.cursor != cursor) {
                            $scope.post.comments.cursor = data.data.cursor;
                            var comments = data.data.comments;
                            for (var i = 0; i < comments.length; i++) {
                                if (comments[i].by.aliasId != undefined) {
                                    comments[i].byAlias = true
                                } else {
                                    comments[i].byUser = true
                                }
                                if (comments[i].text.length > $rootScope.cmtLength) {
                                    comments[i].seeMore = true;
                                    comments[i].moreTxt = comments[i].text;
                                    comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                                }
                                $scope.post.comments.data.unshift(comments[i])
                            }
                            if ($scope.post.comments.data.length < $scope.post.totalComment) {
                                $scope.post.comments.moreComment = true
                            } else {
                                $scope.post.comments.moreComment = false
                            }
                        }
                    } else {
                        $scope.post.comments.moreComment = false
                    }
                }
                $scope.post.showComment = false;
                $scope.post.loadingComment = false
            }).error(function(data, status, header, config) {})
        };
        $scope.getCommentAfter = function() {
            if ($scope.post.loadingComment) return;
            $scope.post.loadingComment = true;
            var postId = $scope.post.postId;
            var count = $scope.post.comments.data.length;
            var commentId = $scope.post.comments.data[count - 1].commentId;
            Post.getCommentAfter(postId, commentId).success(function(data, status, header, config) {
                if (data.status) {
                    if (data.data.total > 0) {
                        var comments = data.data.comments;
                        for (var i = 0; i < comments.length; i++) {
                            if (comments[i].by.aliasId != undefined) {
                                comments[i].byAlias = true
                            } else {
                                comments[i].byUser = true
                            }
                            if (comments[i].text.length > $rootScope.cmtLength) {
                                comments[i].seeMore = true;
                                comments[i].moreTxt = comments[i].text;
                                comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                            }
                            $scope.post.comments.data.push(comments[i])
                        }
                        $scope.post.totalComment += comments.length;
                        if ($scope.post.comments.data.length < $scope.post.totalComment) {
                            $scope.post.comments.moreComment = true
                        } else {
                            $scope.post.comments.moreComment = false
                        }
                    } else {
                        $scope.post.comments.moreComment = false
                    }
                }
                $scope.post.showComment = false;
                $scope.post.loadingComment = false
            }).error(function(data, status, header, config) {})
        };
        $scope.getCommentBefore = function() {
            var postId = $scope.post.postId;
            if ($scope.post.comments.data.length > 0) {
                var commentId = $scope.post.comments.data[0].commentId
            } else {
                $scope.getComment(10);
                return
            }
            if ($scope.post.loadingComment) return;
            $scope.post.loadingComment = true;
            Post.getCommentBefore(postId, commentId).success(function(data) {
                if (data.status) {
                    if (data.data.total > 0) {
                        var comments = data.data.comments;
                        for (var i = 0; i < comments.length; i++) {
                            if (comments[i].by.aliasId != undefined) {
                                comments[i].byAlias = true
                            } else {
                                comments[i].byUser = true
                            }
                            if (comments[i].text.length > $rootScope.cmtLength) {
                                comments[i].seeMore = true;
                                comments[i].moreTxt = comments[i].text;
                                comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                            }
                            $scope.post.comments.data.unshift(comments[i])
                        }
                        if ($scope.post.comments.data.length < $scope.post.totalComment) {
                            $scope.post.comments.moreComment = true
                        } else {
                            $scope.post.comments.moreComment = false
                        }
                    } else {
                        $scope.post.comments.moreComment = false
                    }
                }
                $scope.post.showComment = false;
                $scope.post.loadingComment = false
            }).error(function(data, status, header, config) {})
        };
        $scope.leaveComment = function(e) {
            e.preventDefault();
            if ($scope.post.isComment) return;
            $scope.post.comments.error = "";
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var text = $scope.post.inputComment;
            if (!text) return false;
            text = processTxt(text);
            text = text.trim();
            if (!text) return false;
            if (text) {
                $scope.post.isComment = true;
                var postId = $scope.post.postId;
                var params = {
                    text: text,
                    postId: postId
                };
                if ($state.current.name != "newsfeed" && typeof $scope.option != "undefined" && typeof $scope.option.useAlias != "undefined") params.useAlias = $scope.option.useAlias;
                Post.leaveComment(params).success(function(data, status, header, config) {
                    $scope.post.isComment = false;
                    if (data.status) {
                        var comment = data.data;
                        if (comment.by.aliasId != undefined) {
                            comment.byAlias = true
                        } else {
                            comment.byUser = true
                        }
                        if (comment.text.length > $rootScope.cmtLength) {
                            comment.seeMore = true;
                            comment.moreTxt = comment.text;
                            comment.text = comment.text.substr(0, $rootScope.cmtLength) + "..."
                        }
                        $scope.post.comments.data.push(comment);
                        $scope.post.inputComment = "";
                        $scope.post.totalComment++
                    } else {
                        $scope.post.comments.error = "Comment cannot send at this moment. Please try again later";
                        return
                    }
                }).error(function(data, status, header, config) {
                    $scope.post.isComment = false;
                    $scope.post.comments.error = "Comment cannot send at this moment. Please try again later";
                    return
                })
            }
        };
        $scope.likePost = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var postId = $scope.post.postId;
            $scope.post.isLoading = true;
            Post.likePost(postId).success(function(data, status, header, config) {
                $scope.post.isLoading = false;
                if (data.status) {
                    $scope.post.totalLike++;
                    $scope.post.liked = true
                }
            }).error(function(data, status, header, config) {
                $scope.post.isLoading = false
            })
        };
        $scope.unlikePost = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var postId = $scope.post.postId;
            $scope.post.isLoading = true;
            Post.unlikePost(postId).success(function(data) {
                $scope.post.isLoading = false;
                if (data.status) {
                    $scope.post.totalLike--;
                    $scope.post.liked = false
                }
            }).error(function(data, status, header, config) {
                $scope.post.isLoading = false
            })
        };
        $scope.addFriend = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var userId = $scope.post.content.follow[0].userId;
            $scope.post.isLoading = true;
            User.follow(userId).success(function(data, status, header, config) {
                $scope.post.isLoading = false;
                if (data.status) {
                    $scope.post.content.follow[0].followed = true
                }
            }).error(function(data, status, header, config) {
                $scope.post.isLoading = false
            })
        };
        $scope.unFriend = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var userId = $scope.post.content.follow[0].userId;
            $scope.post.isLoading = true;
            User.unFollow(userId).success(function(data) {
                $scope.post.isLoading = false;
                if (data.status) {
                    $scope.post.content.follow[0].followed = false
                }
            }).error(function(data, status, header, config) {
                $scope.post.isLoading = false
            })
        };
        $scope.deletePost = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $timeout(function() {
                var confirm = $window.confirm("Are you sure delete this post?");
                if (!confirm) return false;
                var postId = $scope.post.postId;
                $scope.post.isLoading = true;
                Post.deletePost(postId).success(function(data) {
                    $scope.post.isLoading = false;
                    if (data.status && $state.current.name == "post") {
                        $location.path("newsfeed/all")
                    }
                }).error(function(data, status, header, config) {
                    $scope.post.isLoading = false
                })
            }, 100)
        };
        $scope.seeMore = function(id) {
            $scope.post.comments.data[id].seeMore = false;
            $scope.post.comments.data[id].text = $scope.post.comments.data[id].moreTxt
        };
        $scope.likeComment = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var commentId = $scope.post.comments.data[id].commentId;
            Post.likeComment(commentId).success(function(data) {
                if (data.status) {
                    $scope.post.comments.data[id].liked = true;
                    $scope.post.comments.data[id].totalLike++
                }
            })
        };
        $scope.unLikeComment = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var commentId = $scope.post.comments.data[id].commentId;
            Post.unLikeComment(commentId).success(function(data) {
                if (data.status) {
                    $scope.post.comments.data[id].liked = false;
                    $scope.post.comments.data[id].totalLike--
                }
            })
        };
        $scope.deleteComment = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $timeout(function() {
                var confirm = window.confirm("Are you sure to delete this comment?");
                if (!confirm) return;
                var commentId = $scope.post.comments.data[id].commentId;
                $scope.post.comments.data[id].hide = true;
                Post.deleteComment(commentId).success(function(data, status, header, config) {
                    if (data.status) {
                        $scope.post.comments.data.splice(id, 1);
                        $scope.post.totalComment--
                    } else {
                        $scope.post.comments.data[id].hide = false
                    }
                }).error(function(data, status, header, config) {
                    $scope.post.comments.data[id].hide = false
                })
            })
        };
        $scope.listLiked = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var modalInstance = $modal.open({
                templateUrl: "/views/listlike.html?v=" + $rootScope.getAppVersion(),
                controller: "ListLikeCtrl",
                resolve: {
                    postIdLike: function() {
                        return $scope.post.postId
                    }
                }
            });
            modalInstance.result.then(function(data) {})
        };
        $scope.listShared = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var modalInstance = $modal.open({
                templateUrl: "/views/listshare.html?v=" + $rootScope.getAppVersion(),
                controller: "ListShareCtrl",
                resolve: {
                    postIdShare: function() {
                        return $scope.post.postId
                    }
                }
            });
            modalInstance.result.then(function(data) {})
        };
        $scope.share = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var modalInstance = $modal.open({
                templateUrl: "/views/sharebox.html?v=" + $rootScope.getAppVersion(),
                controller: "SharedPostCtrl",
                resolve: {
                    sharedPost: function() {
                        return $scope.post
                    }
                }
            });
            modalInstance.result.then(function(data) {
                if (data != "cancel") {
                    $scope.post.totalShare++
                }
            })
        }
    }
})();
(function() {
    angular.module("App").controller("PostStatusCtrl", PostStatusCtrl);
    PostStatusCtrl.$inject = ["$scope", "$rootScope", "$upload", "$timeout", "$state", "$modal", "Post"];

    function PostStatusCtrl($scope, $rootScope, $upload, $timeout, $state, $modal, Post) {
        $scope.userTags = [];
        $scope.error = "";
        $scope.success = "";
        $scope.showSend = false;
        $scope.showVideo = false;
        $scope.video = {
            title: "",
            url: ""
        };
        $scope.my = {
            photos: []
        };
        $scope.showProgress = false;
        $scope.posting = false;
        $scope.removePhoto = function(index) {
            var photoId = $rootScope.content.photos[index].photoId;
            Post.deletePhoto(photoId).success(function(data, status, header, config) {
                $rootScope.content.photos.splice(index, 1)
            }).error(function(data, status, header, config) {})
        };
        $scope.writeStatus = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($state.current.name == "clan.activity") {
                if ($scope.$parent.clan.memberStatus != "joined") {
                    alert("Please join clan to post status!");
                    return false
                }
            }
            $scope.showSend = true
        };
        $scope.selectVideo = function() {
            if ($scope.showVideo) {
                $scope.showVideo = false
            } else {
                $scope.showVideo = true
            }
        };
        if ($scope.page == "newsfeed") {
            $scope.wallUrl = "/ajax/index.php/user/wall";
            $scope.params.userId = "me"
        } else {
            $scope.wallUrl = $scope.url
        }
        if ($scope.page == "game" || $scope.page == "clan") {
            $scope.showAlias = true
        }
        $scope.openAliasBox = function() {
            var gameId = "";
            if ($state.current.name == "game.activity") {
                gameId = $scope.game.gameId
            } else if ($state.current.name == "clan.activity") {
                gameId = $scope.clan.game.gameId
            }
            $scope.updateAliasUser(gameId)
        };
        $scope.selectUserTag = function(userId, fullname) {
            $scope.isWith = true;
            if (typeof $scope.obj[userId] == "undefined") {
                $scope.userTags.push({
                    userId: userId,
                    fullname: fullname
                });
                $scope.obj[userId] = true
            }
        };
        $scope.removeUserTag = function(index) {
            delete $scope.obj[$scope.userTags[index].userId];
            $scope.userTags.splice(index, 1);
            if ($scope.userTags.length == 0) {
                $scope.isWith = false
            }
        };
        $scope.searchFriendTag = function() {
            var keyword = $scope.tagKeyword
        };
        $scope.postStatus = function() {
            $scope.error = "";
            if ($scope.posting) return;
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            if ($scope.showProgress) {
                alert("Please wait for your photos finish uploading");
                return
            }
            if ($scope.page == "clan") {
                if ($scope.$parent.clan.memberStatus != "joined") {
                    alert("Please join clan to post status!");
                    return false
                }
            }
            var text = $rootScope.content.text;
            text = processTxt(text);
            $scope.params.text = text;
            $scope.params.photos = "";
            $scope.params.with = "";
            $scope.params.playing = "";
            $scope.params.share = "";
            if ($scope.page != "clan") {
                $scope.params.privacy = $scope.privacySelected.value
            }
            var photoIds = [];
            if ($rootScope.content.photos.length > 0) {
                var count = $rootScope.content.photos.length;
                for (var k = 0; k < count; k++) {
                    photoIds.push($rootScope.content.photos[k].photoId)
                }
                $scope.params.photos = photoIds.join(",")
            }
            if ($scope.userTags.length > 0) {
                var userIds = [];
                for (var i = 0; i < $scope.userTags.length; i++) {
                    userIds.push($scope.userTags[i].userId)
                }
                $scope.params.with = userIds.join(",")
            }
            if ($scope.option != undefined && $scope.option.useAlias != undefined) $scope.params.useAlias = $scope.option.useAlias;
            if ($scope.showVideo) {
                if ($scope.video.title && $scope.video.url) {
                    $scope.params.type = "video";
                    $scope.params.title = $scope.video.title;
                    $scope.params.url = $scope.video.url
                } else {
                    alert("Please enter title video or link video!");
                    return false
                }
            }
            if ($scope.params.text.trim() != "" || $scope.params.photos.trim() != "" || $scope.params.type == "video") {
                $scope.posting = true;
                Post.postStatus($scope.wallUrl, $scope.params).success(function(data) {
                    if (data.status) {
                        $scope.showVideo = false;
                        $rootScope.content.photos = [];
                        $scope.video = {
                            url: "",
                            title: ""
                        };
                        $scope.userTags = [];
                        $rootScope.content.text = "";
                        $scope.isWith = false;
                        var postId = data.data.postId;
                        Post.getPost(postId).success(function(data, status, headers, config) {
                            if (data.status) {
                                var post = data.data;
                                post.shareFbUrl = $state.href("post", {
                                    postId: post.postId
                                }, {
                                    absolute: true
                                });
                                post.focus = false;
                                post.showPrivacy = false;
                                if (post.totalComment > 0) {
                                    post.showComment = true
                                } else {
                                    post.showComment = false
                                }
                                var moreComment = false;
                                post.comments = {
                                    data: [],
                                    cursor: "",
                                    moreComment: moreComment
                                };
                                if (post.by.aliasId != undefined) {
                                    post.byAlias = true
                                } else {
                                    post.byUser = true
                                }
                                if (post.type == "share") {
                                    post.shareType = true
                                }
                                if (post.type == "create_clan") {
                                    post.clanType = true
                                }
                                if (post.type == "follow") {
                                    post.followType = true
                                }
                                if (post.type == "game") {
                                    post.playingType = true
                                }
                                if (post.type == "photo" || post.type == "album") {
                                    post.photoType = true
                                }
                                if (post.type == "cover") {
                                    post.coverType = true
                                }
                                if (post.type == "avatar") {
                                    post.avatarType = true
                                }
                                if (post.type == "link") {
                                    post.linkType = true;
                                    if (post.content.linkdata.thumb != "") {
                                        post.isLinkImg = true
                                    } else {
                                        post.isLinkImg = false
                                    }
                                    post.link = {};
                                    post.link.url = post.content.links[0].link;
                                    var url = document.createElement("a");
                                    url.href = post.content.links[0].link;
                                    post.link.hostname = url.hostname
                                }
                                if (post.canDelete) {
                                    post.hideAction = true
                                } else {
                                    post.hideAction = false
                                }
                                $scope.posts.unshift(post);
                                $scope.posting = false
                            } else {
                                alert("Server busy!")
                            }
                        }).error(function(data, status, headers, config) {})
                    } else {
                        $scope.posting = false;
                        $scope.error = "Server's busy! Please try again!";
                        return false
                    }
                })
            } else {
                $scope.posting = false;
                alert("Please write something, upload photo!");
                return
            }
        };
        $scope.showProgress = false;
        $scope.uploadPhoto = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $scope.numPhoto = $scope.my.photos.length;
            $scope.count = 0;
            for (var i = 0; i < $scope.my.photos.length; i++) {
                if (i == 0) {
                    $scope.showProgress = true;
                    if ($scope.numPhoto < 10) {
                        $scope.uploadPercent = 5
                    }
                }
                var file = $scope.my.photos[i];
                $scope.upload = $upload.upload({
                    url: "/ajax/index.php/upload",
                    data: {
                        type: "post"
                    },
                    file: file
                }).progress(function(evt) {}).success(function(data, status, headers, config) {
                    $scope.count++;
                    $scope.uploadPercent = parseInt(100 * $scope.count / $scope.numPhoto);
                    if (data.status) {
                        $rootScope.content.photos.push(data.data);
                        if ($scope.count == $scope.numPhoto) {
                            $scope.my.photos = [];
                            $timeout(function() {
                                $scope.showProgress = false
                            }, 500)
                        }
                    } else {}
                }).error(function(data, status, headers, config) {
                    $scope.count++;
                    $scope.uploadPercent = parseInt(100 * $scope.count / $scope.numPhoto)
                })
            }
        };
        $scope.openBoxTagFriend = function() {
            var modalInstance = $modal.open({
                templateUrl: "/views/tagfriend.html?v=" + $rootScope.getAppVersion(),
                controller: "ListFriendCtrl"
            });
            modalInstance.result.then(function(data) {
                if (data != "cancel") {
                    var users = data;
                    for (key in users) {
                        if (typeof users[key].userId != "undefined") $scope.userTags.push(users[key])
                    }
                }
            })
        }
    }
})();
(function() {
    angular.module("App").controller("PostWallCtrl", PostWallCtrl);
    PostWallCtrl.$inject = ["$scope", "$rootScope", "$http", "$location", "$upload", "$q", "$sce", "$modal", "$timeout", "$state", "$window", "User", "Post", "Game", "Clan", "Giftcode"];

    function PostWallCtrl($scope, $rootScope, $http, $location, $upload, $q, $sce, $modal, $timeout, $state, $window, User, Post, Game, Clan, Giftcode) {
        $scope.obj = {};
        $scope.isWith = false;
        $scope.option = {
            useAlias: 0
        };
        $scope.anh = {
            name: "data"
        };
        $scope.userOption = function() {
            if ($scope.alias && $scope.alias.aliasId != undefined && $scope.alias.aliasId) {
                $scope.option.useAlias = 1
            }
        };
        $scope.userOption();
        $scope.$on("get-alias-success", function(e, params) {
            $scope.userOption()
        });
        $scope.giftcodes = [];
        $scope.hasGitfSug = false;
        $scope.htmlContent = "";
        $scope.mentionCm = "";
        $scope.macros = {};
        $scope.people = [];
        $scope.searchPeople = function(term) {
            var keyword = term;
            if (!keyword) return;
            var buddies = [];
            User.searchFriend({
                keyword: keyword
            }).then(function(res) {
                buddies = res.data.data.results;
                $scope.people = buddies;
                return $q.when(buddies)
            })
        };
        $scope.getPeopleText = function(item) {
            if (typeof item.aliasId != "undefined") {
                var id = item.aliasId
            } else {
                var id = item.userId
            }
            return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
        };
        $scope.getPeopleTextRaw = function(item) {
            return "@" + item.fullname
        };
        $scope.showAlias = false;
        $scope.showPostStatus = true;
        if ($scope.page == "alias" || $scope.page == "hashtag") $scope.showPostStatus = false;
        if ($scope.page == "clan") {
            $scope.privacies = [{
                name: "Public",
                value: "public",
                "class": "public"
            }, {
                name: "Members",
                value: "clan",
                "class": "following"
            }]
        } else if ($state.current.name == "game.activity") {
            $scope.privacies = [{
                name: "Public",
                value: "public",
                "class": "public"
            }]
        } else {
            $scope.privacies = [{
                name: "Public",
                value: "public",
                "class": "public"
            }, {
                name: "Following",
                value: "following",
                "class": "following"
            }, {
                name: "Follower",
                value: "follower",
                "class": "follower"
            }, {
                name: "Only me",
                value: "onlyme",
                "class": "me"
            }]
        }
        $scope.privacySelected = $scope.privacies[0];
        $scope.privacyTipSelected = $scope.privacies[0];
        $scope.selectPrivacy = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $scope.privacySelected = $scope.privacies[index]
        };
        $scope.friends = [];
        $scope.getFriend = function() {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        };
        if ($rootScope.loggedIn) $scope.getFriend();
        $scope.openAlias = true;
        $scope.$on("update-alias-success", function(e, data) {
            $scope.hasAlias = true;
            $scope.openAlias = true;
            $scope.option.useAlias = 1;
            var newData = data;
            if (typeof $scope.alias != "undefined") {
                angular.forEach(newData, function(value, key) {
                    $scope.alias[key] = value
                })
            } else {
                $scope.alias = newData
            }
        });
        $scope.posts = [];
        $scope.busy = false;
        $scope.cursor = "";
        $scope.loadmore = true;
        $scope.hasLoaded = false;
        $scope.nextPage = function() {
            if (typeof $scope.$parent.params == "undefined") return;
            if (!$scope.url) return;
            if ($scope.url.match("newsfeed") && !$rootScope.loggedIn) {
                return
            }
            if ($scope.busy) return;
            if (!$scope.loadmore) return;
            $scope.busy = true;
            $scope.params = $scope.$parent.params;
            $scope.params.cursor = $scope.cursor;
            Post.nextPage($scope.url, $scope.params).success(function(data) {
                if (data.status) {
                    $scope.hasLoaded = true;
                    var items = [];
                    if ($scope.page == "newsfeed") {
                        var news = data.data.news;
                        if (news.length > 0) {
                            for (var i = 0; i < news.length; i++) {
                                items.push(news[i].post)
                            }
                        }
                    } else {
                        items = data.data.posts
                    }
                    if (items.length > 0) {
                        var k = $scope.posts.length;
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].type == "video") items[i].onclanUrl = $state.href("game.videodetail", {
                                gameId: items[i].to.slug || items[i].to.gameId,
                                postId: items[i].postId
                            }, {
                                absolute: true
                            });
                            else items[i].onclanUrl = $state.href("post", {
                                postId: items[i].postId
                            }, {
                                absolute: true
                            });
                            if (items[i].type != "badge") {
                                $scope.posts.push(items[i])
                            }
                        }
                        $scope.cursor = data.data.cursor
                    } else {
                        $scope.loadmore = false
                    }
                }
                $scope.busy = false
            })
        };
        $scope.editPrivacy = function(index, id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var postId = $scope.posts[index].postId;
            var privacy = $scope.privacies[id].value;
            if ($scope.posts[index].privacy != privacy) {
                var params = {
                    postId: postId,
                    privacy: privacy
                };
                $scope.posts[index].isLoading = true;
                Post.updatePost(params).success(function(data, status, header, config) {
                    $scope.posts[index].isLoading = false;
                    if (data.status) {
                        $scope.posts[index].privacy = privacy
                    } else {
                        alert(data.message)
                    }
                }).error(function(data, status, header, config) {
                    $scope.posts[index].isLoading = false;
                    alert("Update error!")
                })
            }
        };
        $scope.startPin = function(index) {
            $scope.posts[index].isPin = true
        };
        $scope.cancelPin = function(index) {
            $scope.posts[index].isPin = false
        };
        $scope.pinPost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var postId = $scope.posts[index].postId;
            var params = {
                method: "post",
                postId: postId
            };
            if ($scope.posts[index].expired_at) {
                params.expired_at = moment($scope.posts[index].expired_at).format("YYYY-MM-DDTHH:mm:ssZZ")
            }
            var now = new Date;
            var expired_at = new Date(params.expired_at);
            if (expired_at <= now) {
                alert("Time auto unpin invalid!");
                return
            }
            $scope.posts[index].isLoading = true;
            Post.pinPost(params).success(function(data, status, header, config) {
                $scope.posts[index].isLoading = false;
                $scope.posts[index].isPin = false;
                $scope.posts[index].expired_at = "";
                if (data.status) {
                    $scope.posts[index].pinned = true;
                    var post = $scope.posts[index];
                    $scope.posts.splice(index, 1);
                    $scope.posts.unshift(post)
                } else {
                    alert(data.message)
                }
            }).error(function(data, status, header, config) {
                $scope.posts[index].isLoading = false
            })
        };
        $scope.unpinPost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var postId = $scope.posts[index].postId;
            var params = {
                method: "delete",
                postId: postId
            };
            $scope.posts[index].isLoading = true;
            Post.pinPost(params).success(function(data, status, header, config) {
                $scope.posts[index].isLoading = false;
                if (data.status) {
                    $scope.posts[index].pinned = false;
                    var post = $scope.posts[index];
                    $scope.posts.splice(index, 1);
                    $scope.posts.push(post)
                } else {
                    alert(data.message)
                }
            }).error(function(data, status, header, config) {
                $scope.posts[index].isLoading = false
            })
        };
        $scope.deletePostList = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $timeout(function() {
                var confirm = $window.confirm("Are you sure delete this post?");
                if (!confirm) return false;
                var postId = $scope.posts[index].postId;
                $scope.posts[index].isLoading = true;
                Post.deletePost(postId).success(function(data) {
                    $scope.posts[index].isLoading = false;
                    $scope.posts.splice(index, 1);
                    if (data.status && $state.current.name == "post") {
                        $location.path("newsfeed/all")
                    }
                }).error(function(data, status, header, config) {
                    $scope.posts[index].isLoading = false
                })
            }, 100)
        };
        $scope.hidePost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $timeout(function() {
                var confirm = $window.confirm("Are you sure hide this post?");
                if (!confirm) return false;
                var postId = $scope.posts[index].postId;
                $scope.posts[index].isLoading = true;
                Post.hidePost(postId).success(function(data) {
                    $scope.posts[index].isLoading = false;
                    $scope.posts.splice(index, 1);
                    if (data.status && $state.current.name == "post") {
                        $location.path("newsfeed/all")
                    }
                }).error(function(data, status, header, config) {
                    $scope.posts[index].isLoading = false
                })
            }, 100)
        };
        $scope.reportPost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $timeout(function() {
                var confirm = $window.confirm("Are you sure hide this post?");
                if (!confirm) return false;
                var postId = $scope.posts[index].postId;
                $scope.posts[index].isLoading = true;
                Post.reportPost(postId).success(function(data) {
                    $scope.posts[index].isLoading = false;
                    $scope.posts.splice(index, 1);
                    if (data.status && $state.current.name == "post") {
                        $location.path("newsfeed/all")
                    }
                }).error(function(data, status, header, config) {
                    $scope.posts[index].isLoading = false
                })
            }, 100)
        }
    }
})();
(function() {
    angular.module("App").controller("SharedPostCtrl", SharedPostCtrl);
    SharedPostCtrl.$inject = ["$scope", "$rootScope", "$stateParams", "$modalInstance", "$q", "$timeout", "User", "sharedPost", "Post"];

    function SharedPostCtrl($scope, $rootScope, $stateParams, $modalInstance, $q, $timeout, User, sharedPost, Post) {
        $scope.friends = [];
        $scope.getFriend = function() {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        };
        if ($rootScope.loggedIn) {
            $scope.getFriend()
        }
        $scope.share = {
            text: ""
        };
        $scope.htmlContentShare = "";
        $scope.macros = {};
        $scope.post = sharedPost;
        $scope.sharing = false;
        $scope.privacies = [{
            name: "Public",
            value: "public",
            "class": "public"
        }, {
            name: "Following",
            value: "following",
            "class": "following"
        }, {
            name: "Follower",
            value: "follower",
            "class": "follower"
        }, {
            name: "Only me",
            value: "onlyme",
            "class": "me"
        }];
        $scope.privacySelected = $scope.privacies[0];
        $scope.searchPeople = function(term) {
            var peopleList = [];
            angular.forEach($scope.friends, function(item) {
                if (item.fullname.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                    peopleList.push(item)
                }
            });
            $scope.people = peopleList;
            return $q.when(peopleList)
        };
        $scope.getPeopleText = function(item) {
            if (typeof item.aliasId != "undefined") {
                var id = item.aliasId
            } else {
                var id = item.userId
            }
            return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
        };
        $scope.getPeopleTextRaw = function(item) {
            return "@" + item.fullname
        };
        $scope.selectPrivacy = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $scope.privacySelected = $scope.privacies[index]
        };
        $scope.shareStatus = function() {
            $scope.url = "/ajax/index.php/user/wall";
            $scope.params = {};
            $scope.params.userId = "me";
            var text = $scope.share.text;
            $scope.params.text = processTxt(text);
            $scope.params.photos = "";
            $scope.params.with = "";
            $scope.params.playing = "";
            $scope.params.share = $scope.post.postId;
            $scope.params.privacy = $scope.privacySelected.value;
            $scope.sharing = true;
            Post.postStatus($scope.url, $scope.params).success(function(data) {
                if (data.status) {
                    $scope.sharing = false;
                    $scope.sharedPost.text = "";
                    $scope.success = "Share post successfully!";
                    $timeout(function() {
                        $modalInstance.close($scope.post)
                    }, 1e3)
                } else {
                    $scope.sharing = false;
                    $scope.error = "Has error while sharing. Please try again!"
                }
            })
        };
        $scope.closeModal = function() {
            $scope.sharedPost.text = "";
            $modalInstance.close("cancel")
        };
        $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
            $scope.closeModal("cancel")
        })
    }
})();
(function() {
    angular.module("App").controller("ListFollowPostCtrl", ListFollowPostCtrl);
    ListFollowPostCtrl.$inject = ["$scope", "$rootScope", "$modalInstance", "User", "listFollows"];

    function ListFollowPostCtrl($scope, $rootScope, $modalInstance, User, listFollows) {
        $scope.listFollows = listFollows;
        $scope.closeModal = function() {
            $modalInstance.close($scope.listFollows)
        };
        $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
            $scope.closeModal()
        })
    }
})();
(function() {
    angular.module("App").controller("ShareTipCtrl", ShareTipCtrl);
    ShareTipCtrl.$inject = ["$scope", "$rootScope", "$stateParams", "$modalInstance", "$q", "User", "onclanUrl", "Post"];

    function ShareTipCtrl($scope, $rootScope, $stateParams, $modalInstance, $q, User, onclanUrl, Post) {
        $scope.tipLink = onclanUrl;
        $scope.friends = [];
        $scope.getFriend = function() {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        };
        if ($rootScope.loggedIn) {
            $scope.getFriend()
        }
        $scope.share = {
            text: link
        };
        $scope.htmlContentShare = "";
        $scope.macros = {};
        $scope.searchPeople = function(term) {
            var keyword = term;
            if (!keyword) return;
            var buddies = [];
            User.searchFriend({
                keyword: keyword
            }).then(function(res) {
                buddies = res.data.data.results;
                $scope.people = buddies;
                return $q.when(buddies)
            })
        };
        $scope.getPeopleText = function(item) {
            if (typeof item.aliasId != "undefined") {
                var id = item.aliasId
            } else {
                var id = item.userId
            }
            return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
        };
        $scope.getPeopleTextRaw = function(item) {
            return "@" + item.fullname
        };
        $scope.sharing = false;
        $scope.privacies = [{
            name: "Public",
            value: "public",
            "class": "public"
        }, {
            name: "Following",
            value: "following",
            "class": "following"
        }, {
            name: "Follower",
            value: "follower",
            "class": "follower"
        }, {
            name: "Only me",
            value: "onlyme",
            "class": "me"
        }];
        $scope.privacySelected = $scope.privacies[0];
        $scope.selectPrivacy = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $scope.privacySelected = $scope.privacies[index]
        };
        $scope.shareStatus = function() {
            $scope.url = "/ajax/index.php/user/wall";
            $scope.params = {};
            $scope.params.userId = "me";
            var text = $scope.share.text;
            $scope.params.text = processTxt(text);
            $scope.params.photos = "";
            $scope.params.with = "";
            $scope.params.playing = "";
            $scope.params.share = $scope.post.postId;
            $scope.params.privacy = $scope.privacySelected.value;
            $scope.sharing = true;
            Post.postStatus($scope.url, $scope.params).success(function(data) {
                if (data.status) {
                    $scope.sharing = false;
                    $scope.sharedPost.text = "";
                    $modalInstance.close($scope.post)
                } else {
                    $scope.sharing = false
                }
            })
        };
        $scope.closeModal = function() {
            $modalInstance.close($scope.post)
        }
    }
})();
(function() {
    angular.module("App").controller("PostBoxCtrl", PostBoxCtrl);
    PostBoxCtrl.$inject = ["$scope", "$rootScope", "$modalInstance", "$modal", "$q", "$timeout", "Post", "User", "postBox"];

    function PostBoxCtrl($scope, $rootScope, $modalInstance, $modal, $q, $timeout, Post, User, postBox) {
        $rootScope.page = "postbox";
        $scope.postBox = postBox;
        var id = postBox.activeId;
        if (typeof postBox.alias != "undefined") $scope.alias = postBox.alias;
        if (typeof postBox.useAlias != "undefined") {
            $scope.option = {};
            $scope.option.useAlias = postBox.useAlias
        }
        $scope.postBox.content.photos[id].active = true;
        $scope.friends = [];
        $scope.getFriend = function() {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        };
        if ($rootScope.loggedIn) $scope.getFriend();
        $scope.mentionCm = "";
        $scope.macros = {};
        $scope.people = [];
        $scope.searchPeople = function(term) {
            var keyword = term;
            if (!keyword) return;
            var buddies = [];
            User.searchFriend({
                keyword: keyword
            }).then(function(res) {
                buddies = res.data.data.results;
                $scope.people = buddies;
                return $q.when(buddies)
            })
        };
        $scope.getPeopleText = function(item) {
            if (typeof item.aliasId != "undefined") {
                var id = item.aliasId
            } else {
                var id = item.userId
            }
            return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
        };
        $scope.getPeopleTextRaw = function(item) {
            return "@" + item.fullname
        };
        $scope.closeModal = function() {
            $modalInstance.close($scope.postBox)
        };
        $scope.fullscreen = function() {
            var element = document.getElementsByClassName("modal-present");
            if (element[0].requestFullScreen) {
                element[0].requestFullscreen()
            } else if (element[0].mozRequestFullScreen) {
                element[0].mozRequestFullScreen()
            } else if (element[0].webkitRequestFullscreen) {
                element[0].webkitRequestFullscreen()
            } else if (element[0].msRequestFullscreen) {
                element[0].msRequestFullscreen()
            }
        }
    }
})();
(function() {
    angular.module("App").controller("CopyPostLinkCtrl", CopyPostLinkCtrl);
    CopyPostLinkCtrl.$inject = ["$scope", "$modalInstance", "$state", "onclanUrl"];

    function CopyPostLinkCtrl($scope, $modalInstance, $state, onclanUrl) {
        $scope.link = onclanUrl;
        $scope.dismiss = function() {
            $modalInstance.close("cancel")
        }
    }
})();
(function() {
    angular.module("App").controller("ListNotificationCtrl", ListNotificationCtrl);
    ListNotificationCtrl.$inject = ["$scope", "$rootScope", "$location", "$http", "$stateParams", "Notification", "User"];

    function ListNotificationCtrl($scope, $rootScope, $location, $http, $stateParams, Notification, User) {
        $rootScope.cursorNotice = "";
        $scope.canLoad = true;
        $rootScope.busyNotice = false;
        $scope.loadMore = function() {
            if (!$rootScope.loggedIn) return;
            if ($rootScope.busyNotice) return;
            if (!$scope.canLoad) return;
            $rootScope.busyNotice = true;
            Notification.nextPage($rootScope.cursorNotice).success(function(data) {
                if (data.status) {
                    var items = data.data.notifications;
                    $rootScope.totalUnreadNoti = data.data.unread;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            $rootScope.notifications.push(items[i])
                        }
                        $rootScope.cursorNotice = data.data.cursor
                    } else {
                        $scope.canLoad = false
                    }
                }
                $rootScope.busyNotice = false
            })
        };
        $scope.$on("login-success", function(e, args) {
            $scope.loadMore()
        });
        $scope.$on("get-user-info-success", function(e, args) {
            $scope.loadMore()
        })
    }
})();
(function() {
    angular.module("App").controller("NotificationCtrl", Notification);
    Notification.$inject = ["$scope", "$state", "$rootScope", "$location", "$http", "userInfo", "Notification"];

    function Notification($scope, $state, $rootScope, $location, $http, userInfo, Notification) {
        if (!$rootScope.loggedIn) $state.go("home");
        $scope.canLoad = true;
        $scope.hasLoad = false;
        $scope.loadMoreNotice = function() {
            if (!$rootScope.loggedIn) return;
            if ($rootScope.busyNotice) return;
            if (!$scope.canLoad) return;
            $rootScope.busyNotice = true;
            Notification.nextPage($rootScope.cursorNotice).success(function(data) {
                if (data.status) {
                    var items = data.data.notifications;
                    $rootScope.totalUnreadNoti = data.data.unread;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            $rootScope.notifications.push(items[i])
                        }
                        $rootScope.cursorNotice = data.data.cursor
                    } else {
                        $scope.canLoad = false
                    }
                }
                $scope.hasLoad = true;
                $rootScope.busyNotice = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("HashtagCtrl", HashtagCtrl);
    HashtagCtrl.$inject = ["$scope", "$location", "$rootScope", "$stateParams"];

    function HashtagCtrl($scope, $location, $rootScope, $stateParams) {
        $rootScope.currentPage = "hashtag";
        $scope.keyword = decodeURIComponent($stateParams.keyword);
        $scope.url = "/ajax/index.php/search/hashtag";
        $scope.page = "hashtag";
        $scope.params = {};
        $scope.params.keyword = $scope.keyword
    }
})();
(function() {
    angular.module("App").controller("SearchBarCtrl", SearchBarCtrl);
    SearchBarCtrl.$inject = ["$scope", "$state", "$rootScope", "$stateParams"];

    function SearchBarCtrl($scope, $state, $rootScope, $stateParams) {
        $scope.keyword = "";
        $scope.search = function() {
            if (!$scope.keyword) return;
            var keyword = $scope.keyword;
            $scope.keyword = "";
            if (keyword.match(/^#[^\s]+$/)) {
                keyword = keyword.substr(1);
                return $state.go("hashtag", {
                    keyword: keyword
                })
            } else {
                keyword = encodeURIComponent(keyword);
                return $state.go("search", {
                    filter: $rootScope.searchFilter,
                    keyword: keyword
                })
            }
        }
    }
})();
(function() {
    angular.module("App").controller("SearchCtrl", SearchCtrl);
    SearchCtrl.$inject = ["$scope", "$location", "$rootScope", "$stateParams", "$timeout", "$q", "Search", "User", "Clan", "Game"];

    function SearchCtrl($scope, $location, $rootScope, $stateParams, $timeout, $q, Search, User, Clan, Game) {
        $rootScope.currentPage = "search";
        $scope.filter = $stateParams.filter;
        $scope.keywordSearch = $stateParams.keyword;
        $scope.keyword = decodeURIComponent($stateParams.keyword);
        $scope.limit = 10;
        $scope.cursor = "";
        $scope.users = [];
        $scope.busyUser = false;
        $scope.cursorUser = "";
        $scope.loadmoreUser = true;
        $scope.hasResultUser = true;
        $scope.games = [];
        $scope.busyGame = false;
        $scope.cursorGame = "";
        $scope.loadmoreGame = true;
        $scope.hasResultGame = true;
        $scope.clans = [];
        $scope.busyClan = false;
        $scope.cursorClan = "";
        $scope.loadmoreClan = true;
        $scope.hasResultClan = true;
        $scope.getPeople = function() {
            if ($scope.busyUser) return;
            if (!$scope.loadmoreUser) return;
            $scope.busyUser = true;
            $rootScope.searchFilter = "friends";
            Search.nextPageUser($scope.keyword, $scope.cursorUser, $scope.limit).success(function(data) {
                if (data.status) {
                    if (data.data.count > 0) {
                        var items = data.data.results;
                        if (items.length > 0) {
                            for (var i = 0; i < items.length; i++) {
                                if (items[i].userId != $rootScope.me.userId) {
                                    $scope.users.push(items[i])
                                }
                            }
                            $scope.cursorUser = data.data.cursor
                        }
                    } else {
                        $scope.loadmoreUser = false;
                        $scope.hasResultUser = false
                    }
                }
                $scope.busyUser = false
            })
        };
        $scope.unFollow = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox()
            }
            var userId = $scope.users[index].userId;
            User.unFollow(userId).success(function(data) {
                if (data.status) {
                    $scope.users[index].followed = false
                }
            })
        };
        $scope.follow = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox()
            }
            var userId = $scope.users[index].userId;
            User.follow(userId).success(function(data) {
                if (data.status) {
                    $scope.users[index].followed = true
                }
            })
        };
        $scope.getClans = function() {
            if (!$scope.loadmoreClan) return;
            if ($scope.busyClan) return;
            $scope.busyClan = true;
            $rootScope.searchFilter = "clans";
            Search.nextPageClan($scope.keyword, $scope.cursorClan, $scope.limit).success(function(data) {
                if (data.status) {
                    if (data.data.count > 0) {
                        var items = data.data.results;
                        for (var i = 0; i < items.length; i++) {
                            $scope.clans.push(items[i])
                        }
                        $scope.cursorClan = data.data.cursor
                    } else {
                        $scope.loadmoreClan = false;
                        $scope.hasResultClan = false
                    }
                }
                $scope.busyClan = false
            })
        };
        $scope.joinClan = function(index) {
            if ($rootScope.loggedIn) {
                var clanId = $scope.clans[index].clanId;
                Clan.joinClan(clanId).success(function(data) {
                    if (data.status) {
                        $scope.clans[index].memberStatus = data.data.memberStatus;
                        if (data.data.memberStatus == "pending") {
                            alert("Your request has sent. Please wait for clan admin respond");
                            return
                        }
                    }
                })
            } else {
                if (!$rootScope.loggedIn) {
                    $scope.showLoginBox()
                }
            }
        };
        $scope.getGames = function() {
            if ($scope.busyGame == true) return;
            if (!$scope.loadmoreGame) return;
            $scope.busyGame = true;
            $rootScope.searchFilter = "games";
            Search.nextPageGame($scope.keyword, $scope.cursorGame, $scope.limit).success(function(data) {
                if (data.status) {
                    var items = data.data.results;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            items[i].show = true;
                            items[i].loading = false;
                            if (typeof items[i].slug != "undefined" && items[i].slug) {
                                items[i].isSlug = true
                            } else {
                                items[i].isGameId = true
                            }
                            $scope.games.push(items[i])
                        }
                        $scope.cursorGame = data.data.cursor
                    } else {
                        $scope.loadmoreGame = false;
                        $scope.hasResultGame = false
                    }
                }
                $scope.busyGame = false
            })
        };
        $scope.createGame = function(index) {
            $scope.games[index].show = false;
            $scope.games[index].loading = true;
            var ituneId = $scope.games[index].ituneId;
            Game.createGame(ituneId, $scope.keyword).success(function(data) {
                if (data.status) {
                    var gameId = data.data.gameId;
                    $timeout(function() {
                        $location.path("/game/" + gameId)
                    }, 2e3)
                } else {
                    return
                }
            }).error(function() {})
        }
    }
})();
(function() {
    angular.module("App").controller("GiftCodeCtrl", GiftCodeCtrl);
    GiftCodeCtrl.$inject = ["$scope", "$rootScope", "$timeout", "$modalInstance", "giftcode", "Giftcode"];

    function GiftCodeCtrl($scope, $rootScope, $timeout, $modalInstance, giftcode, Giftcode) {
        $scope.giftcode = giftcode;
        $scope.giftcode.status = "";
        $scope.giftcode.error = "";
        $scope.getGiftcode = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox()
            }
            var params = {
                giftcodeId: $scope.giftcode.giftcodeId
            };
            $scope.giftcode.status = "loading";
            Giftcode.getCode(params).success(function(data, status, header, config) {
                if (data.status) {
                    $scope.giftcode.status = "success";
                    $scope.giftcode.code = data.data.code
                } else {
                    $scope.giftcode.status = "error";
                    $scope.giftcode.error = "No giftcode available right now, please try again later"
                }
            }).error(function(data, status, header, config) {
                $scope.giftcode.status = "error";
                $scope.giftcode.error = "No giftcode available right now, please try again later"
            })
        };
        $scope.close = function() {
            $modalInstance.close($scope.giftcode.code)
        };
        $scope.dismiss = function() {
            $modalInstance.dismiss("cancel")
        }
    }
})();
(function() {
    angular.module("App").controller("ListTipCtrl", ListTipCtrl);
    ListTipCtrl.$inject = ["$scope", "$rootScope", "$location", "$state", "$stateParams", "$timeout", "Tip"];

    function ListTipCtrl($scope, $rootScope, $location, $state, $stateParams, $timeout, Tip) {
        $scope.option = {
            useAlias: 0
        };
        $scope.userOption = function() {
            if ($scope.alias && $scope.alias.aliasId != undefined && $scope.alias.aliasId) {
                $scope.option.useAlias = 1
            }
        };
        $scope.userOption();
        $scope.$on("get-alias-success", function(e, params) {
            $scope.userOption();
            if ($state.includes("game.*")) {
                $rootScope.pageDesc = "Tips for " + $scope.$parent.game.name + " - " + $rootScope.pageDesc
            }
        });
        $scope.content = {
            title: "",
            tipText: ""
        };
        $scope.msg = {
            error: ""
        };
        $scope.showTip = false;
        $scope.posting = false;
        $scope.postTip = function() {
            if ($scope.posting) return;
            $scope.msg.error = "";
            var text = $scope.content.tipText;
            text = text.replace(/<div>(<br>|<br\/>)/gi, "<br>");
            text = text.replace(/<div>/g, "<br>").replace(/<\/div>/g, "");
            var title = $scope.content.title;
            if (!title) {
                $scope.msg.error = "Title is empty!";
                return
            }
            if (!text) {
                $scope.msg.error = "Content is empty!";
                return
            }
            var params = {
                gameId: $scope.gameId,
                title: title,
                content: text
            };
            if (typeof $scope.option !== "undefined" && typeof $scope.option.useAlias !== "undefined") params.useAlias = $scope.option.useAlias;
            $scope.posting = true;
            Tip.createTip($scope.gameId, params).success(function(data) {
                $scope.posting = false;
                if (data.status) {
                    var tip = data.data;
                    $scope.content.tipText = "";
                    $scope.content.title = "";
                    if (tip.by.aliasId != undefined) {
                        tip.byAlias = true
                    } else {
                        tip.byUser = true
                    }
                    if (tip.by.alias != undefined) tip.by.fullname = tip.by.alias;
                    tip.canDelete = true;
                    $scope.posts.unshift(tip);
                    $scope.msg.success = "Create tip successfully!";
                    $timeout(function() {
                        $scope.msg = {};
                        $scope.showTip = false
                    }, 1e3)
                } else {
                    $scope.msg.error = "Server's busy. Please try again!"
                }
            }).error(function(data, status, header, config) {
                $scope.posting = false;
                $scope.msg.error = "Server's busy. Please try again!"
            })
        };
        $scope.writeTip = function() {
            $scope.showTip = true;
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
        };
        $scope.inputComment = [];
        $scope.posts = [];
        $scope.busyTip = false;
        $scope.cursor = "";
        $scope.loadmore = true;
        $scope.hasLoaded = false;
        $scope.nextPage = function() {
            if ($scope.busyTip) return;
            if (!$scope.loadmore) return;
            $scope.busyTip = true;
            $scope.params.gameId = $scope.gameId;
            $scope.params.cursor = $scope.cursor;
            Tip.nextPage($scope.params).success(function(data) {
                $scope.hasLoaded = true;
                if (data.status) {
                    var items = data.data.tips;
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].by.aliasId != undefined) {
                                items[i].byAlias = true
                            } else {
                                items[i].byUser = true
                            }
                            var tipId = items[i].tipId;
                            if (typeof items[i].slug != "undefined") tipId = items[i].slug;
                            items[i].onclanUrl = $state.href("tip", {
                                tipId: tipId
                            }, {
                                absolute: true
                            });
                            $scope.posts.push(items[i])
                        }
                        $scope.cursor = data.data.cursor
                    } else {
                        $scope.loadmore = false
                    }
                }
                $scope.busyTip = false
            })
        };
        $scope.likePost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var tipId = $scope.posts[index].tipId;
            Tip.likePost(tipId).success(function(data, status, header, config) {
                if (data.status) {
                    $scope.posts[index].totalLike++;
                    $scope.posts[index].liked = true
                }
            }).error(function(data, status, header, config) {})
        };
        $scope.unlikePost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var tipId = $scope.posts[index].tipId;
            Tip.unlikePost(tipId).success(function(data) {
                if (data.status) {
                    $scope.posts[index].totalLike--;
                    $scope.posts[index].liked = false
                }
            }).error(function(data, status, header, config) {})
        };
        $scope.deleteTip = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var confirm = window.confirm("Are you sure delete this tip?");
            if (!confirm) return false;
            var tipId = $scope.posts[index].tipId;
            Tip.deleteTip(tipId).success(function(data) {
                if (data.status) {
                    $scope.posts.splice(index, 1)
                }
            }).error(function(data, status, header, config) {})
        };
        $scope.updateTip = function(index) {
            var tipId = $scope.posts[index].tipId;
            Tip.getTip(tipId).success(function(data, status, header, config) {
                if (data.status) {
                    var tip = data.data;
                    tip.index = index;
                    $scope.openTipEditBox(tip)
                }
            }).error(function(data, status, header, config) {})
        };
        $scope.$on("update-tip-success", function(e, data) {
            var tip = data;
            $scope.posts[data.index] = tip
        })
    }
})();
(function() {
    angular.module("App").controller("TipDetailCtrl", TipDetailCtrl);
    TipDetailCtrl.$inject = ["$scope", "$rootScope", "$location", "$timeout", "$stateParams", "$document", "$state", "$sce", "$q", "$modal", "$interval", "Tip", "User", "$filter", "$compile"];

    function TipDetailCtrl($scope, $rootScope, $location, $timeout, $stateParams, $document, $state, $sce, $q, $modal, $interval, Tip, User, $filter, $compile) {
        $rootScope.currentPage = "tipdetail";
        $scope.page = "tipdetail";
        $scope.tipId = $stateParams.tipId;
        $scope.show = false;
        $scope.inputComment = [];
        $scope.post = {};
        $scope.busy = false;
        $scope.init = function() {
            Tip.getTip($scope.tipId).success(function(data) {
                $scope.busy = false;
                if (data.status) {
                    $scope.show = true;
                    $scope.post = data.data;
                    $scope.postUpdate = angular.copy(data.data);
                    if ($scope.post.slug != undefined) {
                        var tipId = $scope.post.slug
                    } else {
                        var tipId = $scope.post.tipId
                    }
                    if ($scope.post.slug && $scope.post.slug != $stateParams.tipId) {
                        $state.go($state.$current.name, {
                            tipId: $scope.post.slug
                        }, {
                            location: "replace",
                            notify: false
                        })
                    }
                    var html = angular.element($document[0].createElement("div"));
                    html.html(data.data.content.html);
                    while (html[0].getElementsByClassName("youtube").length) {
                        var _h = $compile('<div class="video-container embed-responsive embed-responsive-16by9" youtube src="' + $filter("trustYoutubeEmbed")(html[0].getElementsByClassName("youtube")[0].href) + '"></div>')($scope)[0].outerHTML;
                        html[0].getElementsByClassName("youtube")[0].outerHTML = _h
                    }
                    $scope.post.content.html = html.html();
                    $scope.post.onclanUrl = $state.href("tip", {
                        tipId: tipId
                    }, {
                        absolute: true
                    });
                    $rootScope.pageTitle = $scope.post.title + " | onClan";
                    $rootScope.pageDesc = html.html().trim().substr(0, 200);
                    $scope.option = {
                        useAlias: 0
                    };
                    if ($scope.post.game.aliasId != undefined) {
                        $scope.getAliasInfo($scope.post.game.aliasId)
                    }
                    $rootScope.$broadcast("gettip-success", $scope.post.game.gameId);
                    $scope.isLoading = false;
                    $scope.post.focus = false;
                    $scope.post.isLoading = false;
                    $scope.post.showPrivacy = false;
                    if ($scope.post.totalComment > 0) {
                        $scope.post.showComment = true
                    } else {
                        $scope.post.showComment = false
                    }
                    $scope.post.comments = {
                        data: [],
                        cursor: "",
                        moreComment: false
                    };
                    if ($scope.post.by.aliasId != undefined) {
                        $scope.post.byAlias = true
                    } else {
                        $scope.post.byUser = true
                    }
                    $scope.cursor = data.data.cursor;
                    if ($scope.post.totalComment > 0) $scope.getComment(5)
                } else if (typeof data.errorCode != "undefined") {
                    $location.path("error")
                }
            }).error(function(data, status, header, config) {})
        };
        $scope.init();
        $scope.updateTip = function(index) {
            $scope.openTipEditBox($scope.postUpdate)
        };
        $scope.$on("update-tip-success", function(e, data) {
            var tip = data;
            $scope.post.title = tip.title;
            $scope.post.content.html = tip.content.html;
            if ($scope.post.slug != undefined) {
                var tipId = $scope.post.slug
            } else {
                var tipId = $scope.post.tipId
            }
            var html = document.createElement("div");
            html.innerHTML = data.content.html;
            if (html.getElementsByClassName("youtube")[0] !== undefined) {
                var url = html.getElementsByClassName("youtube")[0].href;
                var youtube = $compile('<div class="video-container" youtube src="' + $filter("trustYoutubeEmbed")(url) + '"></div>')($scope);
                html.innerHTML += youtube[0].innerHTML;
                html.getElementsByClassName("youtube")[0].remove()
            }
            $scope.post.content.html = html.innerHTML;
            $scope.post.onclanUrl = $state.href("tip", {
                tipId: tipId
            }, {
                absolute: true
            });
            $rootScope.pageTitle = $scope.post.title + " | onClan";
            $rootScope.pageDesc = html.textContent.trim().substr(0, 200)
        });
        $scope.$on("update-alias-success", function(e, data) {
            var newData = data;
            $scope.alias = newData;
            $scope.option = {
                useAlias: 1
            }
        });
        $scope.openAliasBox = function() {
            var gameId = "";
            if ($scope.post.game.gameId != undefined) {
                gameId = $scope.post.game.gameId;
                $scope.updateAliasUser(gameId)
            }
        };
        $scope.friends = [];
        $scope.getFriend = function() {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        };
        if ($rootScope.loggedIn) $scope.getFriend();
        $scope.mentionCm = "";
        $scope.macros = {};
        $scope.people = [];
        $scope.searchPeople = function(term) {
            var keyword = term;
            if (!keyword) return;
            var buddies = [];
            User.searchFriend({
                keyword: keyword
            }).then(function(res) {
                buddies = res.data.data.results;
                $scope.people = buddies;
                return $q.when(buddies)
            })
        };
        $scope.getPeopleText = function(item) {
            if (typeof item.aliasId != "undefined") {
                var id = item.aliasId
            } else {
                var id = item.userId
            }
            return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
        };
        $scope.getPeopleTextRaw = function(item) {
            return "@" + item.fullname
        };
        $scope.deleteTip = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var confirm = window.confirm("Are you sure delete this tip?");
            if (!confirm) return false;
            var tipId = $scope.post.tipId;
            var gameId = $scope.post.game.gameId;
            if ($scope.post.game.slug != undefined) {
                gameId = $scope.post.game.slug
            }
            Tip.deleteTip(tipId).success(function(data) {
                if (data.status) {
                    return $state.go("game.tip", {
                        gameId: $scope.post.game.slug || $scope.post.game.gameId
                    })
                }
            }).error(function(data, status, header, config) {})
        };
        $scope.getComment = function(limit) {
            if ($scope.post.loadingComment) return;
            if (typeof limit == "undefined") {
                limit = 10
            }
            $scope.post.loadingComment = true;
            var cursor = $scope.post.comments.cursor;
            Tip.getComment($scope.post.tipId, cursor, limit).success(function(data, status, header, config) {
                if (data.status) {
                    if (data.data.total > 0) {
                        if (data.data.cursor != cursor) {
                            $scope.post.comments.cursor = data.data.cursor;
                            var comments = data.data.comments;
                            for (var i = 0; i < comments.length; i++) {
                                if (comments[i].by.aliasId != undefined) {
                                    comments[i].byAlias = true
                                } else {
                                    comments[i].byUser = true
                                }
                                if (comments[i].text.length > $rootScope.cmtLength) {
                                    comments[i].seeMore = true;
                                    comments[i].moreTxt = comments[i].text;
                                    comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                                }
                                $scope.post.comments.data.unshift(comments[i])
                            }
                            if ($scope.post.comments.data.length < $scope.post.totalComment) {
                                $scope.post.comments.moreComment = true
                            } else {
                                $scope.post.comments.moreComment = false
                            }
                        }
                    } else {
                        $scope.post.comments.moreComment = false
                    }
                }
                $scope.post.showComment = false;
                $scope.post.loadingComment = false
            }).error(function(data, status, header, config) {})
        };
        $scope.getCommentAfter = function() {
            if ($scope.post.loadingComment) return;
            $scope.post.loadingComment = true;
            var count = $scope.post.comments.data.length;
            var commentId = $scope.post.comments.data[count - 1].commentId;
            Tip.getCommentAfter($scope.post.tipId, commentId).success(function(data, status, header, config) {
                if (data.status) {
                    if (data.data.total > 0) {
                        var comments = data.data.comments;
                        for (var i = 0; i < comments.length; i++) {
                            if (comments[i].by.aliasId != undefined) {
                                comments[i].byAlias = true
                            } else {
                                comments[i].byUser = true
                            }
                            if (comments[i].text.length > $rootScope.cmtLength) {
                                comments[i].seeMore = true;
                                comments[i].moreTxt = comments[i].text;
                                comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                            }
                            $scope.post.comments.data.push(comments[i])
                        }
                        if ($scope.post.comments.data.length < $scope.post.totalComment) {
                            $scope.post.comments.moreComment = true
                        } else {
                            $scope.post.comments.moreComment = false
                        }
                    } else {
                        $scope.post.comments.moreComment = false
                    }
                }
                $scope.post.showComment = false;
                $scope.post.loadingComment = false
            }).error(function(data, status, header, config) {})
        };
        $scope.getCommentBefore = function() {
            if ($scope.post.loadingComment) return;
            if ($scope.post.comments.data.length > 0) {
                var commentId = $scope.post.comments.data[0].commentId
            } else {
                $scope.getComment();
                return
            }
            $scope.post.loadingComment = true;
            Tip.getCommentBefore($scope.post.tipId, commentId).success(function(data) {
                if (data.status) {
                    if (data.data.total > 0) {
                        var comments = data.data.comments;
                        for (var i = 0; i < comments.length; i++) {
                            if (comments[i].by.aliasId != undefined) {
                                comments[i].byAlias = true
                            } else {
                                comments[i].byUser = true
                            }
                            if (comments[i].text.length > $rootScope.cmtLength) {
                                comments[i].seeMore = true;
                                comments[i].moreTxt = comments[i].text;
                                comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                            }
                            $scope.post.comments.data.unshift(comments[i])
                        }
                        if ($scope.post.comments.data.length < $scope.post.totalComment) {
                            $scope.post.comments.moreComment = true
                        } else {
                            $scope.post.comments.moreComment = false
                        }
                    } else {
                        $scope.post.comments.moreComment = false
                    }
                }
                $scope.post.showComment = false;
                $scope.post.loadingComment = false
            }).error(function(data, status, header, config) {})
        };
        $scope.leaveComment = function(e) {
            e.preventDefault();
            if ($scope.post.isComment) return false;
            $scope.post.comments.error = "";
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var text = $scope.inputComment;
            text = processTxt(text);
            if (text) {
                var params = {
                    text: text,
                    tipId: $scope.tipId
                };
                if ($scope.option != undefined && $scope.option.useAlias != undefined) params.useAlias = $scope.option.useAlias;
                $scope.post.isComment = true;
                Tip.leaveComment(params).success(function(data, status, header, config) {
                    $scope.post.isComment = false;
                    if (data.status) {
                        var comment = data.data;
                        if (comment.by.aliasId != undefined) {
                            comment.byAlias = true
                        } else {
                            comment.byUser = true
                        }
                        if (comment.text.length > $rootScope.cmtLength) {
                            comment.seeMore = true;
                            comment.moreTxt = comment.text;
                            comment.text = comment.text.substr(0, $rootScope.cmtLength) + "..."
                        }
                        $scope.post.comments.data.push(comment);
                        $scope.post.totalComment++;
                        $scope.inputComment = ""
                    }
                }).error(function(data, status, header, config) {
                    $scope.post.isComment = false;
                    $scope.post.comments.error = "Comment' not sent. Please try again!"
                })
            }
        };
        $scope.showBtn = function() {
            $scope.post.showPostCm = true
        };
        $scope.focusInput = function() {
            $scope.post.focus = true;
            $scope.post.comments.error = "";
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
        };
        $scope.resetFocus = function() {
            if (!$scope.inputComment) {
                $scope.post.showPostCm = false
            }
            $scope.post.focus = false;
            $scope.post.comments.error = ""
        };
        $scope.likePost = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $scope.post.isLoading = true;
            Tip.likePost($scope.tipId).success(function(data, status, header, config) {
                $scope.post.isLoading = false;
                if (data.status) {
                    $scope.post.totalLike++;
                    $scope.post.liked = true
                }
            }).error(function(data, status, header, config) {
                $scope.post.isLoading = false
            })
        };
        $scope.unlikePost = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $scope.post.isLoading = true;
            Tip.unlikePost($scope.tipId).success(function(data) {
                $scope.post.isLoading = false;
                if (data.status) {
                    $scope.post.totalLike--;
                    $scope.post.liked = false
                }
            }).error(function(data, status, header, config) {
                $scope.post.isLoading = false
            })
        };
        $scope.seeMore = function(id) {
            $scope.post.comments.data[id].seeMore = false;
            $scope.post.comments.data[id].text = $scope.post.comments.data[id].moreTxt
        };
        $scope.likeComment = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var commentId = $scope.post.comments.data[id].commentId;
            Tip.likeComment(commentId).success(function(data) {
                if (data.status) {
                    $scope.post.comments.data[id].liked = true;
                    $scope.post.comments.data[id].totalLike++
                }
            })
        };
        $scope.unLikeComment = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var commentId = $scope.post.comments.data[id].commentId;
            Tip.unLikeComment(commentId).success(function(data) {
                if (data.status) {
                    $scope.post.comments.data[id].liked = false;
                    $scope.post.comments.data[id].totalLike--
                }
            })
        };
        $scope.deleteComment = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var confirm = window.confirm("Are you sure to delete this comment?");
            if (!confirm) return;
            var commentId = $scope.post.comments.data[id].commentId;
            Tip.deleteComment(commentId).success(function(data, status, header, config) {
                if (data.status) {
                    $scope.post.comments.data.splice(id, 1);
                    $scope.post.totalComment--
                }
            }).error(function(data, status, header, config) {
                alert("Delete comment error!")
            })
        };
        $scope.listLiked = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var modalInstance = $modal.open({
                templateUrl: "/views/listlike.html?v=" + $rootScope.getAppVersion(),
                controller: "ListLikeTipCtrl",
                resolve: {
                    tipIdLike: function() {
                        return $scope.post.tipId
                    }
                }
            });
            modalInstance.result.then(function(data) {})
        };
        $timeout(function() {
            if (!$rootScope.loggedIn) {
                $rootScope.remind = true
            }
        }, 2e4)
    }
})();
(function() {
    angular.module("App").controller("TipSuggestCtrl", TipSuggestCtrl);
    TipSuggestCtrl.$inject = ["$scope", "$rootScope", "$state", "Tip"];

    function TipSuggestCtrl($scope, $rootScope, $state, Tip) {
        if ($scope.page == "game") {
            var gameId = $scope.gameId
        } else if ($scope.page == "clan") {
            var gameId = $scope.gameId
        }
        $scope.hasTipSuggest = false;
        $scope.posts = [];
        $scope.getSuggest = function() {
            if (($state.current.name == "game" || $state.current.name == "tip" || $state.current.name == "post") && ($scope.gameId == undefined || !$scope.gameId)) {
                return
            }
            var params = {};
            if ($scope.gameId != undefined && $scope.gameId != false) {
                params.gameId = $scope.gameId
            }
            if ($scope.posts.length > 0) return;
            Tip.getSuggest(params).success(function(data) {
                if (data.status) {
                    var items = data.data.tips;
                    if (items.length > 0) {
                        $scope.hasTipSuggest = true;
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].by.aliasId != undefined) {
                                items[i].byAlias = true
                            } else {
                                items[i].byUser = true
                            }
                            if (items[i].slug != $scope.tipId) $scope.posts.push(items[i])
                        }
                        $scope.cursor = data.data.cursor
                    }
                }
            })
        };
        $scope.getSuggest();
        $scope.$on("gettip-success", function(e, data) {
            $scope.gameId = data;
            $scope.getSuggest()
        });
        $scope.$on("get-post-success", function(e, data) {
            $scope.gameId = data;
            $scope.getSuggest()
        });
        $scope.likePost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var tipId = $scope.posts[index].tipId;
            Tip.likePost(tipId).success(function(data, status, header, config) {
                if (data.status) {
                    $scope.posts[index].totalLike++;
                    $scope.posts[index].liked = true
                }
            }).error(function(data, status, header, config) {})
        };
        $scope.unlikePost = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var tipId = $scope.posts[index].tipId;
            Tip.unlikePost(tipId).success(function(data) {
                if (data.status) {
                    $scope.posts[index].totalLike--;
                    $scope.posts[index].liked = false
                }
            }).error(function(data, status, header, config) {})
        }
    }
})();
(function() {
    angular.module("App").controller("ShareTipCtrl", ShareTipCtrl);
    ShareTipCtrl.$inject = ["$scope", "$rootScope", "$stateParams", "$modalInstance", "$q", "User", "onclanUrl", "Post"];

    function ShareTipCtrl($scope, $rootScope, $stateParams, $modalInstance, $q, User, onclanUrl, Post) {
        $scope.tipLink = onclanUrl;
        $scope.friends = [];
        $scope.getFriend = function() {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        };
        if ($rootScope.loggedIn) {
            $scope.getFriend()
        }
        $scope.share = {
            text: $scope.tipLink
        };
        $scope.htmlContentShare = "";
        $scope.macros = {};
        $scope.searchPeople = function(term) {
            var peopleList = [];
            angular.forEach($scope.friends, function(item) {
                if (item.fullname.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                    peopleList.push(item)
                }
            });
            $scope.people = peopleList;
            return $q.when(peopleList)
        };
        $scope.getPeopleText = function(item) {
            if (typeof item.aliasId != "undefined") {
                var id = item.aliasId
            } else {
                var id = item.userId
            }
            return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
        };
        $scope.getPeopleTextRaw = function(item) {
            return "@" + item.fullname
        };
        $scope.sharing = false;
        $scope.privacies = [{
            name: "Public",
            value: "public",
            "class": "public"
        }, {
            name: "Following",
            value: "following",
            "class": "following"
        }, {
            name: "Follower",
            value: "follower",
            "class": "follower"
        }, {
            name: "Only me",
            value: "onlyme",
            "class": "me"
        }];
        $scope.privacySelected = $scope.privacies[0];
        $scope.selectPrivacy = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $scope.privacySelected = $scope.privacies[index]
        };
        $scope.shareStatus = function() {
            $scope.url = "/ajax/index.php/user/wall";
            $scope.params = {};
            $scope.params.userId = "me";
            var text = $scope.share.text;
            text = processTxt(text);
            $scope.params.text = text;
            $scope.params.photos = "";
            $scope.params.with = "";
            $scope.params.playing = "";
            $scope.params.privacy = $scope.privacySelected.value;
            $scope.sharing = true;
            Post.postStatus($scope.url, $scope.params).success(function(data) {
                if (data.status) {
                    $scope.sharing = false;
                    $scope.sharedPost.text = "";
                    $modalInstance.close($scope.post)
                } else {
                    $scope.sharing = false
                }
            })
        };
        $scope.closeModal = function() {
            $modalInstance.close($scope.post)
        }
    }
})();
(function() {
    angular.module("App").controller("TipEditCtrl", TipEditCtrl);
    TipEditCtrl.$inject = ["$scope", "$modalInstance", "$timeout", "Tip", "tip"];

    function TipEditCtrl($scope, $modalInstance, $timeout, Tip, tip) {
        $scope.tip = angular.copy(tip);
        $scope.updating = false;
        $scope.msg = {};
        $scope.updateTip = function() {
            $scope.msg = {};
            var update = false;
            var params = {};
            if ($scope.tip.title != tip.title) {
                params.title = $scope.tip.title;
                update = true
            }
            if ($scope.tip.content.html != tip.content.html) {
                params.content = $scope.tip.content.html;
                params.content = params.content.replace(/<div>(<br>|<br\/>)/gi, "<br>").replace(/<div>/g, "<br>").replace(/<\/div>/g, "");
                update = true
            }
            if (update) {
                $scope.updating = true;
                Tip.updateTip($scope.tip.tipId, params).success(function(data, status, header, config) {
                    $scope.updating = false;
                    if (data.status) {
                        var tip = $scope.tip;
                        $scope.msg.success = "Update successfully!";
                        $timeout(function() {
                            $modalInstance.close(tip)
                        }, 500)
                    } else {
                        $scope.msg.error = "Server's busy. Please try again!"
                    }
                }).error(function(data, status, header, config) {
                    $scope.updating = false
                })
            } else {
                $scope.msg.error = "Content wasn't changed"
            }
        };
        $scope.dismiss = function() {
            $modalInstance.dismiss("cancel")
        }
    }
})();
(function() {
    angular.module("App").controller("ImageUploadCtrl", ImageUploadCtrl);
    ImageUploadCtrl.$inject = ["$scope", "$modalInstance", "$upload"];

    function ImageUploadCtrl($scope, $modalInstance, $upload) {
        $scope.images = [];
        $scope.photos = [];
        $scope.uploading = false;
        $scope.$watch("images", function() {
            var count = 0;
            for (var i = 0; i < $scope.images.length; i++) {
                $scope.uploading = true;
                var file = $scope.images[i];
                $scope.upload = $upload.upload({
                    url: "/ajax/index.php/upload",
                    data: {
                        type: "tip"
                    },
                    file: file
                }).progress(function(evt) {}).success(function(data, status, headers, config) {
                    count++;
                    if (data.status) {
                        $scope.photos.push(data.data);
                        if (count == $scope.images.length) {
                            $scope.uploading = false;
                            $modalInstance.close($scope.photos)
                        }
                    } else {
                        alert("Server' busy! Please try again!");
                        $modalInstance.close("cancel");
                        return
                    }
                })
            }
        });
        $scope.dismiss = function() {
            $modalInstance.close("cancel")
        }
    }
})();
(function() {
    angular.module("App").controller("ListPhotoCtrl", ListPhotoCtrl);
    ListPhotoCtrl.$inject = ["$scope", "$rootScope", "$state", "$modal", "Photo"];

    function ListPhotoCtrl($scope, $rootScope, $state, $modal, Photo) {
        $scope.photos = [];
        $scope.cursorPhoto = "";
        $scope.loadmore = true;
        $scope.busyPhoto = false;
        $scope.hasLoaded = false;
        $scope.loadMorePhoto = function() {
            if ($scope.busyPhoto == true) return;
            if (!$scope.loadmore) return;
            $scope.busyPhoto = true;
            var url = $scope.$parent.photoParams.url;
            var photoParams = angular.copy($scope.$parent.photoParams);
            photoParams.cursor = $scope.cursorPhoto;
            Photo.getList(url, photoParams).success(function(data) {
                if (data.status) {
                    $scope.hasLoaded = true;
                    var items = data.data.photos;
                    if (items.length > 0) {
                        for (i = 0; i < items.length; i++) {
                            $scope.photos.push(items[i])
                        }
                        $scope.cursorPhoto = data.data.cursor
                    } else {
                        $scope.loadmore = false
                    }
                    $scope.busyPhoto = false
                }
            })
        };
        $scope.selectPhoto = function(index) {
            $scope.openPhotoBox($scope.photos[index].photoId)
        }
    }
})();
(function() {
    angular.module("App").controller("PhotoCtrl", PhotoCtrl);
    PhotoCtrl.$inject = ["$scope", "$rootScope", "$modalInstance", "$modal", "$q", "$timeout", "photoId", "Photo", "User"];

    function PhotoCtrl($scope, $rootScope, $modalInstance, $modal, $q, $timeout, photoId, Photo, User) {
        $scope.photoId = photoId;
        Photo.getPhoto($scope.photoId).success(function(data, status, header, config) {
            if (data.status) {
                $scope.photo = data.data;
                $scope.photo.focus = false;
                $scope.photo.isLoading = false;
                $scope.photo.showPrivacy = false;
                if ($scope.photo.totalComment > 0) {
                    $scope.photo.showComment = true
                } else {
                    $scope.photo.showComment = false
                }
                var moreComment = false;
                $scope.photo.comments = {
                    data: [],
                    cursor: "",
                    moreComment: moreComment
                };
                $scope.option = {
                    useAlias: 0
                };
                if ($scope.photo.by.aliasId != undefined) {
                    $scope.photo.byAlias = true
                } else {
                    $scope.photo.byUser = true
                }
                if ($scope.photo.canDelete) {
                    $scope.photo.hideAction = true
                } else {
                    $scope.photo.hideAction = false
                }
                $scope.getComment(5)
            }
        }).error(function(data, status, header, config) {});
        $scope.closeModal = function() {
            $modalInstance.close($scope.photo)
        };
        $scope.friends = [];
        $scope.inputComment = "";
        $scope.getFriend = function() {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        };
        if ($rootScope.loggedIn) $scope.getFriend();
        $scope.mentionCm = "";
        $scope.macros = {};
        $scope.people = [];
        $scope.searchPeople = function(term) {
            var keyword = term;
            if (!keyword) return;
            var buddies = [];
            User.searchFriend({
                keyword: keyword
            }).then(function(res) {
                buddies = res.data.data.results;
                $scope.people = buddies;
                return $q.when(buddies)
            })
        };
        $scope.getPeopleText = function(item) {
            if (typeof item.aliasId != "undefined") {
                var id = item.aliasId
            } else {
                var id = item.userId
            }
            return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
        };
        $scope.getPeopleTextRaw = function(item) {
            return "@" + item.fullname
        };
        $scope.checkComment = function() {
            if ($scope.inputComment) {
                $rootScope.isComment = true
            }
        };
        $scope.focusInput = function() {
            $scope.photo.focus = true;
            $scope.photo.comments.error = ""
        };
        $scope.showBtn = function() {
            $scope.photo.showPostCm = true;
            $scope.photo.comments.error = ""
        };
        $scope.resetFocus = function() {
            if (!$scope.inputComment) {
                $scope.photo.showPostCm = false
            }
            $scope.photo.focus = false;
            $scope.photo.comments.error = ""
        };
        $scope.getComment = function(limit) {
            if ($scope.photo.loadingComment) return;
            if (typeof limit == "undefined") {
                limit = 10
            }
            $scope.photo.loadingComment = true;
            var photoId = $scope.photo.photoId;
            var cursor = $scope.photo.comments.cursor;
            Photo.getComment(photoId, cursor, limit).success(function(data, status, header, config) {
                if (data.status) {
                    if (data.data.total > 0) {
                        if (data.data.cursor != cursor) {
                            $scope.photo.comments.cursor = data.data.cursor;
                            var comments = data.data.comments;
                            for (var i = 0; i < comments.length; i++) {
                                if (comments[i].by.aliasId != undefined) {
                                    comments[i].byAlias = true
                                } else {
                                    comments[i].byUser = true
                                }
                                if (comments[i].text.length > $rootScope.cmtLength) {
                                    comments[i].seeMore = true;
                                    comments[i].moreTxt = comments[i].text;
                                    comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                                }
                                $scope.photo.comments.data.unshift(comments[i])
                            }
                            if ($scope.photo.comments.data.length < $scope.photo.totalComment) {
                                $scope.photo.comments.moreComment = true
                            } else {
                                $scope.photo.comments.moreComment = false
                            }
                        }
                    } else {
                        $scope.photo.comments.moreComment = false
                    }
                }
                $scope.photo.showComment = false;
                $scope.photo.loadingComment = false
            }).error(function(data, status, header, config) {})
        };
        $scope.getCommentAfter = function() {
            if ($scope.photo.loadingComment) return;
            $scope.photo.loadingComment = true;
            var photoId = $scope.photo.photoId;
            var count = $scope.photo.comments.data.length;
            var commentId = $scope.photo.comments.data[count - 1].commentId;
            Photo.getCommentAfter(photoId, commentId).success(function(data, status, header, config) {
                if (data.status) {
                    if (data.data.total > 0) {
                        var comments = data.data.comments;
                        for (var i = 0; i < comments.length; i++) {
                            if (comments[i].by.aliasId != undefined) {
                                comments[i].byAlias = true
                            } else {
                                comments[i].byUser = true
                            }
                            if (comments[i].text.length > $rootScope.cmtLength) {
                                comments[i].seeMore = true;
                                comments[i].moreTxt = comments[i].text;
                                comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                            }
                            $scope.photo.comments.data.push(comments[i])
                        }
                        if ($scope.photo.comments.data.length < $scope.photo.totalComment) {
                            $scope.photo.comments.moreComment = true
                        } else {
                            $scope.photo.comments.moreComment = false
                        }
                    } else {
                        $scope.photo.comments.moreComment = false
                    }
                }
                $scope.photo.showComment = false;
                $scope.photo.loadingComment = false
            }).error(function(data, status, header, config) {})
        };
        $scope.getCommentBefore = function() {
            if ($scope.photo.loadingComment) return;
            var photoId = $scope.photo.photoId;
            if ($scope.photo.comments.data.length > 0) {
                var commentId = $scope.photo.comments.data[0].commentId
            } else {
                $scope.getComment(5);
                return
            }
            $scope.photo.loadingComment = true;
            Photo.getCommentBefore(photoId, commentId).success(function(data) {
                if (data.status) {
                    if (data.data.total > 0) {
                        var comments = data.data.comments;
                        for (var i = 0; i < comments.length; i++) {
                            if (comments[i].by.aliasId != undefined) {
                                comments[i].byAlias = true
                            } else {
                                comments[i].byUser = true
                            }
                            if (comments[i].text.length > $rootScope.cmtLength) {
                                comments[i].seeMore = true;
                                comments[i].moreTxt = comments[i].text;
                                comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                            }
                            $scope.photo.comments.data.unshift(comments[i])
                        }
                        if ($scope.photo.comments.data.length < $scope.photo.totalComment) {
                            $scope.photo.comments.moreComment = true
                        } else {
                            $scope.photo.comments.moreComment = false
                        }
                    } else {
                        $scope.photo.comments.moreComment = false
                    }
                }
                $scope.photo.showComment = false;
                $scope.photo.loadingComment = false
            }).error(function(data, status, header, config) {})
        };
        $scope.leaveComment = function(e) {
            e.preventDefault();
            if ($scope.photo.isComment) return;
            $scope.photo.comments.error = "";
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var text = $scope.inputComment;
            text = processTxt(text);
            if (text) {
                $scope.photo.isComment = true;
                var photoId = $scope.photo.photoId;
                var params = {
                    text: text,
                    photoId: photoId
                };
                Photo.leaveComment(params).success(function(data, status, header, config) {
                    $scope.photo.isComment = false;
                    if (data.status) {
                        $scope.inputComment = "";
                        var comment = data.data;
                        if (comment.by.aliasId != undefined) {
                            comment.byAlias = true
                        } else {
                            comment.byUser = true
                        }
                        if (comment.text.length > $rootScope.cmtLength) {
                            comment.seeMore = true;
                            comment.moreTxt = comment.text;
                            comment.text = comment.text.substr(0, $rootScope.cmtLength) + "..."
                        }
                        $scope.photo.comments.data.push(comment);
                        $scope.photo.totalComment++
                    } else {
                        $scope.photo.comments.error = "Comment cannot send at this moment. Please try again later"
                    }
                }).error(function(data, status, header, config) {
                    $scope.photo.isComment = false;
                    $scope.photo.comments.error = "Comment cannot send at this moment. Please try again later"
                })
            }
        };
        $scope.likePost = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var photoId = $scope.photo.photoId;
            $scope.photo.isLoading = true;
            Photo.likePost(photoId).success(function(data, status, header, config) {
                $scope.photo.isLoading = false;
                if (data.status) {
                    $scope.photo.totalLike++;
                    $scope.photo.liked = true
                }
            }).error(function(data, status, header, config) {
                $scope.photo.isLoading = false
            })
        };
        $scope.unlikePost = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var photoId = $scope.photo.photoId;
            $scope.photo.isLoading = true;
            Photo.unlikePost(photoId).success(function(data) {
                $scope.photo.isLoading = false;
                if (data.status) {
                    $scope.photo.totalLike--;
                    $scope.photo.liked = false
                }
            }).error(function(data, status, header, config) {
                $scope.photo.isLoading = false
            })
        };
        $scope.deletePost = function() {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var confirm = window.confirm("Are you sure delete this post?");
            if (!confirm) return false;
            var photoId = $scope.photo.photoId;
            $scope.photo.isLoading = true;
            Photo.deletePost(photoId).success(function(data) {
                $scope.photo.isLoading = false;
                if (data.status) {
                    $scope.posts.splice(index, 1)
                }
            }).error(function(data, status, header, config) {
                $scope.photo.isLoading = false
            })
        };
        $scope.likeComment = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var commentId = $scope.photo.comments.data[id].commentId;
            Photo.likeComment(commentId).success(function(data) {
                if (data.status) {
                    $scope.photo.comments.data[id].liked = true;
                    $scope.photo.comments.data[id].totalLike++
                }
            })
        };
        $scope.unLikeComment = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var commentId = $scope.photo.comments.data[id].commentId;
            Photo.unLikeComment(commentId).success(function(data) {
                if (data.status) {
                    $scope.photo.comments.data[id].liked = false;
                    $scope.photo.comments.data[id].totalLike--
                }
            })
        };
        $scope.deleteComment = function(id) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            $timeout(function() {
                var confirm = window.confirm("Are you sure to delete this comment?");
                if (!confirm) return;
                var commentId = $scope.photo.comments.data[id].commentId;
                $scope.photo.comments.data[id].hide = true;
                Photo.deleteComment(commentId).success(function(data, status, header, config) {
                    if (data.status) {
                        $scope.photo.comments.data.splice(id, 1);
                        $scope.photo.totalComment--
                    } else {
                        $scope.photo.comments.data[id].hide = false
                    }
                }).error(function(data, status, header, config) {
                    $scope.photo.comments.data[id].hide = false
                })
            })
        };
        $scope.listLiked = function(index) {
            if (!$rootScope.loggedIn) {
                $scope.showLoginBox();
                return
            }
            var modalInstance = $modal.open({
                templateUrl: "/views/listlike.html?v=" + $rootScope.getAppVersion(),
                controller: "ListLikePhotoCtrl",
                resolve: {
                    photoId: function() {
                        return $scope.photoId
                    }
                }
            });
            modalInstance.result.then(function(data) {})
        };
        $scope.fullscreen = function() {
            var element = document.getElementsByClassName("modal-present");
            if (element[0].requestFullScreen) {
                element[0].requestFullscreen()
            } else if (element[0].mozRequestFullScreen) {
                element[0].mozRequestFullScreen()
            } else if (element[0].webkitRequestFullscreen) {
                element[0].webkitRequestFullscreen()
            } else if (element[0].msRequestFullscreen) {
                element[0].msRequestFullscreen()
            }
        }
    }
})();
(function() {
    angular.module("App").controller("AliasCtrl", AliasCtrl);
    AliasCtrl.$inject = ["$scope", "$rootScope", "$state", "$http", "$upload", "$stateParams", "User", "Game", "aliasData"];

    function AliasCtrl($scope, $rootScope, $state, $http, $upload, $stateParams, User, Game, aliasData) {
        $rootScope.currentPage = "alias";
        $scope.aliasId = $stateParams.aliasId;
        $scope.coverKeySuccess = "alias-cover-upload-success";
        $scope.avatarKeySuccess = "alias-avatar-upload-success";
        $scope.userAlias = {};
        $scope.show = false;
        init();
        $scope.openAliasBox = function() {
            $scope.updateAliasUser($scope.userAlias.gameId)
        };
        $scope.$on("update-alias-success", function(e, data) {
            $state.go("alias", {
                aliasId: $scope.userAlias.aliasId
            }, {
                reload: true
            })
        });
        $scope.$on($scope.avatarKeySuccess, function(e, data) {
            uploadAliasAvatar(data.image)
        });
        $scope.$on($scope.coverKeySuccess, function(e, data) {
            uploadAliasCover(data.image)
        });

        function init() {
            if (aliasData.status) {
                $scope.show = true;
                $scope.userAlias = aliasData.data.data;
                Game.getAlias($scope.userAlias.gameId).success(function(data) {
                    if (data.status) {
                        if (typeof data.data.alias != "undefined") {
                            $scope.alias = data.data;
                            $rootScope.$broadcast("get-alias-success", {})
                        }
                    }
                })
            } else {
                $state.go("error")
            }
        }

        function uploadAliasCover(image) {
            var file = image;
            $scope.userAlias.coverUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "cover",
                file: file
            })).success(function(data, status, header, config) {
                $scope.userAlias.coverUploading = false;
                if (data.status) {
                    User.updateAlias({
                        aliasId: $scope.aliasId,
                        cover: data.data.photoId
                    }).success(function(data, status, header, config) {
                        $scope.userAlias.coverUploading = false;
                        if (data.status) {
                            $scope.userAlias.cover = data.data.cover
                        } else {
                            alert("Sorry, Connect's timeout, Please try again!");
                            return
                        }
                    }).error(function(data, status, header, config) {
                        alert("Server's busy! Please try again!");
                        return
                    })
                } else if (!data.status) {
                    alert("Sorry, Connect's timeout, Please try again!");
                    return
                }
            }).error(function(data, status, header, config) {
                $scope.userAlias.coverUploading = false
            })
        }

        function uploadAliasAvatar(image) {
            var file = image;
            $scope.userAlias.avatarUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "avatar",
                file: file
            })).success(function(data, status, header, config) {
                if (data.status) {
                    User.updateAlias({
                        aliasId: $scope.aliasId,
                        avatar: data.data.photoId
                    }).success(function(data, status, header, config) {
                        $scope.userAlias.avatarUploading = false;
                        if (data.status) {
                            $scope.userAlias.avatar = data.data.avatar
                        } else {}
                    }).error(function(data, status, header, config) {
                        $scope.userAlias.avatarUploading = false;
                        alert("Server's busy! Please try again!")
                    })
                } else if (!data.status) {
                    $scope.userAlias.avatarUploading = false;
                    alert("Sorry, Connect's timeout, Please try again!")
                }
            }).error(function(data, status, header, config) {
                $scope.userAlias.avatarUploading = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("AliasCoverCtrl", AliasCoverCtrl);
    AliasCoverCtrl.$inject = ["$scope", "$rootScope", "$http", "$location", "$upload", "User"];

    function AliasCoverCtrl($scope, $rootScope, $http, $location, $upload, User) {
        $scope.coverKeySuccess = "cover-aliasbox-update-success";
        $scope.$on($scope.coverKeySuccess, function(e, data) {
            updateCover(data.image)
        });

        function updateCover(image) {
            var file = image;
            $scope.alias.coverUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "cover",
                file: file
            })).success(function(data, status, header, config) {
                $scope.alias.coverUploading = false;
                if (data.status) {
                    $scope.alias.cover = data.data.url;
                    $scope.alias.coverId = data.data.photoId
                } else {
                    $scope.error.msg = "Server's busy! Please try again!"
                }
            }).error(function(data, status, header, config) {
                $scope.alias.coverUploading = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("AliasAvatarCtrl", AliasAvatarCtrl);
    AliasAvatarCtrl.$inject = ["$scope", "$http", "$upload", "User"];

    function AliasAvatarCtrl($scope, $http, $upload, User) {
        $scope.avatarKeySuccess = "avatar-aliasbox-update-success";
        $scope.$on($scope.avatarKeySuccess, function(e, data) {
            updateAvatar(data.image)
        });

        function updateAvatar(image) {
            var file = image;
            $scope.alias.avatarUploading = true;
            $http.post("/ajax/index.php/upload/uploadimage", serializeData({
                type: "avatar",
                file: file
            })).success(function(data, status, header, config) {
                $scope.alias.avatarUploading = false;
                if (data.status) {
                    $scope.alias.avatar = data.data.url;
                    $scope.alias.avatarId = data.data.photoId
                } else {
                    $scope.error.msg = "Server's busy! Please try again!"
                }
            }).error(function(data, status, header, config) {
                $scope.alias.avatarUploading = false
            })
        }
    }
})();
(function() {
    angular.module("App").controller("AliasWallCtrl", AliasWallCtrl);
    AliasWallCtrl.$inject = ["$scope", "$rootScope", "$stateParams"];

    function AliasWallCtrl($scope, $rootScope, $stateParams) {
        $rootScope.currentPage = "alias";
        var aliasId = $stateParams.aliasId;
        $scope.url = "/ajax/index.php/alias/wall";
        $scope.page = "alias";
        $scope.params = {};
        $scope.params.aliasId = aliasId
    }
})();
(function() {
    angular.module("App").controller("AliasBoxCtrl", AliasBoxCtrl);
    AliasBoxCtrl.$inject = ["$scope", "$rootScope", "$http", "$modal", "$modalInstance", "$upload", "$timeout", "Game", "aliasInfo"];

    function AliasBoxCtrl($scope, $rootScope, $http, $modal, $modalInstance, $upload, $timeout, Game, aliasInfo) {
        $scope.alias = angular.copy(aliasInfo);
        $scope.avatar = "";
        $scope.cover = "";
        $scope.loading = false;
        if ($scope.alias.alias == "") {
            $scope.action = "create";
            $scope.title = "Create alias"
        } else {
            $scope.action = "edit";
            $scope.title = "Edit alias"
        }
        $scope.dismiss = function() {
            $modalInstance.close("cancel")
        };
        $scope.save = function() {
            $scope.error = "";
            update = false;
            var params = {
                gameId: $scope.alias.gameId
            };
            if ($scope.alias.alias != aliasInfo.alias) {
                params.alias = $scope.alias.alias;
                update = true
            }
            if ($scope.alias.avatarId != undefined) {
                params.avatar = $scope.alias.avatarId;
                update = true
            }
            if ($scope.alias.coverId != undefined) {
                params.cover = $scope.alias.coverId;
                update = true
            }
            if ($scope.alias.alias != "") {
                if (update) {
                    $scope.loading = true;
                    Game.createAlias(params).success(function(data, status, header, config) {
                        $scope.loading = false;
                        if (data.status) {
                            $scope.success = "Update successfully!";
                            $timeout(function() {
                                $modalInstance.close(data.data)
                            }, 1e3)
                        } else {
                            $scope.error = data.message
                        }
                    }).error(function(data, status, header, config) {
                        $scope.loading = false;
                        $scope.error = "Server's busy! Please try again."
                    })
                } else {
                    $scope.error = "Infomation's not changed."
                }
            } else {
                $scope.error = "Alias name is empty."
            }
        };
        $scope.chooseCover = function(keySuccess) {
            if (typeof keySuccess == "undefined") return;
            var modalInstance = $modal.open({
                templateUrl: "/views/cover.html?v=" + $rootScope.getAppVersion(),
                backdrop: "static",
                resolve: {
                    keySuccess: function() {
                        return keySuccess
                    }
                },
                controller: "CoverUploadCtrl"
            });
            modalInstance.result.then(function(data) {
                if (typeof data.status != "undefined" && data.status) {
                    $rootScope.$broadcast(data.keySuccess, {
                        image: data.image
                    })
                }
            })
        };
        $scope.chooseAvatar = function(keySuccess) {
            if (typeof keySuccess == "undefined") return;
            var modalInstance = $modal.open({
                templateUrl: "/views/avatar.html?v=" + $rootScope.getAppVersion(),
                backdrop: "static",
                resolve: {
                    keySuccess: function() {
                        return keySuccess
                    }
                },
                controller: "AvatarUploadCtrl"
            });
            modalInstance.result.then(function(data) {
                if (typeof data.status != "undefined" && data.status) {
                    $rootScope.$broadcast(data.keySuccess, {
                        image: data.image
                    })
                }
            })
        }
    }
})();
angular.module("App").controller("EventCtrl", ["$scope", "$http", "$rootScope", "$modal", "Event", "Post", function($scope, $http, $rootScope, $modal, Event, Post) {
    $scope.joinedUsers = [];
    $scope.init = function(event) {
        $scope.event = event;
        $scope.getJoinedUser()
    };
    $scope.getComment = function(limit) {
        if ($scope.event.loadingComment) return;
        if (typeof limit == "undefined") {
            limit = 10
        }
        $scope.event.loadingComment = true;
        var eventId = $scope.event.eventId;
        var cursor = $scope.event.comments.cursor;
        var params = {
            cursor: cursor,
            limit: limit
        };
        Event.getComment($scope.event.gameId, eventId, params).success(function(data, status, header, config) {
            if (data.status) {
                if (data.data.total > 0) {
                    if (data.data.cursor != cursor) {
                        $scope.event.comments.cursor = data.data.cursor;
                        var comments = data.data.comments;
                        for (var i = 0; i < comments.length; i++) {
                            if (comments[i].by.aliasId != undefined) {
                                comments[i].byAlias = true
                            } else {
                                comments[i].byUser = true
                            }
                            if (comments[i].text.length > $rootScope.cmtLength) {
                                comments[i].seeMore = true;
                                comments[i].moreTxt = comments[i].text;
                                comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                            }
                            $scope.event.comments.data.unshift(comments[i])
                        }
                        if ($scope.event.comments.data.length < $scope.event.totalComment) {
                            $scope.event.comments.moreComment = true
                        } else {
                            $scope.event.comments.moreComment = false
                        }
                    }
                } else {
                    $scope.event.comments.moreComment = false
                }
            }
            $scope.event.showComment = false;
            $scope.event.loadingComment = false
        }).error(function(data, status, header, config) {})
    };
    if ($scope.event != undefined) $scope.getComment(5);
    $scope.getJoinedUser = function() {
        var params = {
            limit: 10
        };
        Event.getJoinedUser($scope.event.gameId, $scope.event.eventId, params).success(function(data, status, header, config) {
            if (data.status) {
                $scope.joinedUsers = data.data.users;
                for (var i = 0; i < $scope.joinedUsers.length; i++) {}
            }
        }).error(function(data, status, header, config) {})
    };
    $scope.openBoxUser = function() {
        $scope.openListJoinedEvent($scope.event)
    };
    $scope.like = function() {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        if ($scope.event.gameId) {
            var url = "/ajax/index.php/games/likeEvent/" + $scope.event.gameId + "/" + $scope.event.eventId
        } else {}
        $http.post(url).success(function(data) {
            if (data.status) {
                $scope.event.liked = true;
                $scope.event.totalLike++
            }
        })
    };
    $scope.unlike = function() {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        if ($scope.event.gameId) {
            var url = "/ajax/index.php/games/unlikeEvent/" + $scope.event.gameId + "/" + $scope.event.eventId
        } else {}
        $http.post(url).success(function(data) {
            if (data.status) {
                $scope.event.liked = false;
                $scope.event.totalLike--
            }
        })
    };
    $scope.joinEvent = function() {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        if ($scope.event.gameId) {
            var url = "/ajax/index.php/games/joinEvent/" + $scope.event.gameId + "/" + $scope.event.eventId
        } else {}
        $http.post(url).success(function(data) {
            if (data.status) {
                $scope.event.joined = true;
                $scope.event.totalJoined++
            }
        })
    };
    $scope.unjoinEvent = function() {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        if ($scope.event.gameId) {
            var url = "/ajax/index.php/games/unjoinEvent/" + $scope.event.gameId + "/" + $scope.event.eventId
        } else {}
        $http.post(url).success(function(data) {
            if (data.status) {
                $scope.event.joined = false;
                $scope.event.totalJoined--
            }
        })
    };
    $scope.getCommentAfter = function() {
        if ($scope.event.loadingComment) return;
        $scope.event.loadingComment = true;
        var eventId = $scope.event.eventId;
        var count = $scope.event.comments.data.length;
        var commentId = $scope.event.comments.data[count - 1].commentId;
        Event.getCommentAfter($scope.event.gameId, eventId, commentId).success(function(data, status, header, config) {
            if (data.status) {
                if (data.data.total > 0) {
                    var comments = data.data.comments;
                    for (var i = 0; i < comments.length; i++) {
                        if (comments[i].by.aliasId != undefined) {
                            comments[i].byAlias = true
                        } else {
                            comments[i].byUser = true
                        }
                        if (comments[i].text.length > $rootScope.cmtLength) {
                            comments[i].seeMore = true;
                            comments[i].moreTxt = comments[i].text;
                            comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                        }
                        $scope.event.comments.data.push(comments[i])
                    }
                    if ($scope.event.comments.data.length < $scope.event.totalComment) {
                        $scope.event.comments.moreComment = true
                    } else {
                        $scope.event.comments.moreComment = false
                    }
                } else {
                    $scope.event.comments.moreComment = false
                }
            }
            $scope.event.showComment = false;
            $scope.event.loadingComment = false
        }).error(function(data, status, header, config) {})
    };
    $scope.getCommentBefore = function() {
        if ($scope.event.loadingComment) return;
        if ($scope.event.comments.data.length > 0) {
            var commentId = $scope.event.comments.data[0].commentId
        } else {
            $scope.getComment(5);
            return
        }
        $scope.event.loadingComment = true;
        var eventId = $scope.event.eventId;
        Event.getCommentBefore($scope.event.gameId, eventId, commentId).success(function(data) {
            if (data.status) {
                if (data.data.total > 0) {
                    var comments = data.data.comments;
                    for (var i = 0; i < comments.length; i++) {
                        if (comments[i].by.aliasId != undefined) {
                            comments[i].byAlias = true
                        } else {
                            comments[i].byUser = true
                        }
                        if (comments[i].text.length > $rootScope.cmtLength) {
                            comments[i].seeMore = true;
                            comments[i].moreTxt = comments[i].text;
                            comments[i].text = comments[i].text.substr(0, $rootScope.cmtLength) + "..."
                        }
                        $scope.event.comments.data.unshift(comments[i])
                    }
                    if ($scope.event.comments.data.length < $scope.event.totalComment) {
                        $scope.event.comments.moreComment = true
                    } else {
                        $scope.event.comments.moreComment = false
                    }
                } else {
                    $scope.event.comments.moreComment = false
                }
            }
            $scope.event.showComment = false;
            $scope.event.loadingComment = false
        }).error(function(data, status, header, config) {})
    };
    $scope.leaveComment = function(e) {
        e.preventDefault();
        if ($scope.event.isComment) return false;
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox()
        }
        var text = $scope.event.textCm;
        text = processTxt(text);
        if (text) {
            $scope.event.isComment = true;
            var eventId = $scope.event.eventId;
            var params = {
                text: text,
                useAlias: $scope.option.useAlias
            };
            Event.leaveComment($scope.event.gameId, eventId, params).success(function(data, status, header, config) {
                $scope.event.isComment = false;
                if (data.status) {
                    var comment = data.data;
                    if (comment.by.aliasId != undefined) {
                        comment.byAlias = true
                    } else {
                        comment.byUser = true
                    }
                    if (comment.text.length > $rootScope.cmtLength) {
                        comment.seeMore = true;
                        comment.moreTxt = comment.text;
                        comment.text = comment.text.substr(0, $rootScope.cmtLength) + "..."
                    }
                    $scope.event.textCm = "";
                    $scope.event.comments.data.push(comment);
                    $scope.event.totalComment++
                }
            }).error(function(data, status, header, config) {
                $scope.event.isComment = false
            })
        }
    };
    $scope.focusInput = function() {
        $scope.event.focus = true
    };
    $scope.resetFocus = function() {
        $scope.event.focus = false
    };
    $scope.listLiked = function() {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        var modalInstance = $modal.open({
            templateUrl: "/views/listlike.html",
            controller: "ListLikeEventCtrl",
            resolve: {
                event: function() {
                    return $scope.event
                }
            }
        });
        modalInstance.result.then(function(data) {})
    };
    $scope.deleteComment = function(id) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox()
        }
        var confirm = window.confirm("Are you sure to delete this comment?");
        if (!confirm) return;
        var commentId = $scope.event.comments.data[id].commentId;
        Event.deleteComment(commentId).success(function(data, status, header, config) {
            if (data.status) {
                $scope.event.comments.data.splice(id, 1);
                $scope.event.totalComment--
            }
        }).error(function(data, status, header, config) {})
    };
    $scope.seeMore = function(id) {
        $scope.event.comments.data[id].seeMore = false;
        $scope.event.comments.data[id].text = $scope.event.comments.data[id].moreTxt
    };
    $scope.likeComment = function(id) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox()
        }
        var commentId = $scope.event.comments.data[id].commentId;
        Post.likeComment(commentId).success(function(data) {
            if (data.status) {
                $scope.event.comments.data[id].liked = true;
                $scope.event.comments.data[id].totalLike++
            }
        })
    };
    $scope.unLikeComment = function(id) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox()
        }
        var commentId = $scope.event.comments.data[id].commentId;
        Post.unLikeComment(commentId).success(function(data) {
            if (data.status) {
                $scope.event.comments.data[id].liked = false;
                $scope.event.comments.data[id].totalLike--
            }
        })
    };
    $scope.editEvent = function(index) {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        $scope.event.index = index;
        var modalInstance = $modal.open({
            templateUrl: "/views/event.edit.html?v=" + $rootScope.getAppVersion(),
            controller: "EditEventCtrl",
            resolve: {
                editEvent: function() {
                    return $scope.event
                }
            }
        });
        modalInstance.result.then(function(data) {
            var newData = data;
            if (newData.action == "delete") {
                $scope.events.splice(newData.index, 1)
            } else {
                for (key in newData) {
                    $scope.event[key] = newData[key]
                }
            }
        })
    };
    $scope.openInviteBox = function() {
        if (!$rootScope.loggedIn) {
            $scope.showLoginBox();
            return
        }
        var modalInstance = $modal.open({
            templateUrl: "/views/event.invite.html?v=" + $rootScope.getAppVersion(),
            controller: "EventInviteCtrl",
            resolve: {
                invitedEvent: function() {
                    return $scope.event
                }
            }
        });
        modalInstance.result.then(function(data) {})
    }
}]);
angular.module("App").controller("CreateEventCtrl", ["$modalInstance", "$http", "$scope", "$timeout", "eventGameId", "Game", function($modalInstance, $http, $scope, $timeout, eventGameId, Game) {
    $scope.eventPost = {
        gameId: eventGameId,
        name: "",
        content: ""
    };
    $scope.dismiss = function() {
        $modalInstance.dismiss("cancel")
    };
    $scope.msg = {};
    $scope.createEvent = function() {
        $scope.msg = {};
        if (!$scope.eventPost.name) {
            $scope.msg.error = "Event name cannot be empty!";
            return false
        }
        if (!$scope.eventPost.content) {
            $scope.msg.error = "Event content cannot be empty!";
            return false
        }
        $scope.eventPost.content = $scope.eventPost.content.replace(/<div>(<br>|<br\/>)/gi, "<br>").replace(/<div>/g, "<br>").replace(/<\/div>/g, "");
        $scope.loading = true;
        var params = {
            gameId: eventGameId,
            name: $scope.eventPost.name,
            text: $scope.eventPost.content
        };
        if ($scope.eventPost.photoId != undefined) {
            params.photo = $scope.eventPost.photoId
        }
        if ($scope.eventPost.place != undefined) {
            params.placeName = $scope.eventPost.place
        }
        if ($scope.eventPost.from != undefined && $scope.eventPost.from) {
            params.from = moment($scope.eventPost.from).format("YYYY-MM-DDTHH:mm:ssZZ")
        }
        if ($scope.eventPost.to != undefined && $scope.eventPost.to) {
            params.to = moment($scope.eventPost.to).format("YYYY-MM-DDTHH:mm:ssZZ")
        }
        params.type = "html";
        Game.createEvent(params).success(function(data, status, header, config) {
            $scope.loading = false;
            if (data.status) {
                $scope.msg.success = "Create event successfully!";
                var newEvent = data.data;
                $timeout(function() {
                    $modalInstance.close(newEvent)
                }, 1500)
            } else {
                $scope.msg.error = data.message
            }
        }).error(function(data, status, header, config) {
            $scope.loading = false;
            $scope.msg.error = "Something went wrong! Please try again later!"
        })
    }
}]);
angular.module("App").controller("PhotoEventCtrl", function($scope, $upload, User) {
    $scope.updatePhoto = function() {
        var file = $scope.eventPost.photoImage;
        $scope.photoLoading = true;
        $scope.upload = $upload.upload({
            url: "/ajax/index.php/upload",
            data: {
                type: "event"
            },
            file: file
        }).progress(function(evt) {}).success(function(data, status, header, config) {
            $scope.photoLoading = false;
            if (data.status) {
                $scope.eventPost.photo = data.data.url;
                $scope.eventPost.photoId = data.data.photoId
            } else if (!data.status) {
                alert("Sorry, Connect's timeout, Please try again!");
                return
            }
        }).error(function(data, status, header, config) {
            $scope.photoLoading = false
        })
    }
});
angular.module("App").controller("ListGameEventCtrl", ["$scope", "$rootScope", "$q", "$modal", "$stateParams", "Game", "User", function($scope, $rootScope, $q, $modal, $stateParams, Game, User) {
    $scope.option = {
        useAlias: 0
    };
    $scope.userOption = function() {
        if ($scope.alias && $scope.alias.aliasId != undefined && $scope.alias.aliasId) {
            $scope.option.useAlias = 1
        }
    };
    $scope.userOption();
    $scope.$on("get-alias-success", function(e, params) {
        $scope.userOption()
    });
    $scope.postId = $stateParams.postId;
    $scope.error = {
        status: false,
        msg: ""
    };
    $scope.post = {
        inputComment: ""
    };
    $scope.loading = true;
    $scope.show = false;
    $scope.friends = [];
    $scope.getFriend = function() {
        User.getFriend().success(function(data) {
            if (data.status) {
                $scope.friends = data.data.buddies
            }
        })
    };
    if ($rootScope.loggedIn) $scope.getFriend();
    $scope.mentionCm = "";
    $scope.macros = {};
    $scope.people = [];
    $scope.searchPeople = function(term) {
        var keyword = term;
        if (!keyword) return;
        var buddies = [];
        User.searchFriend({
            keyword: keyword
        }).then(function(res) {
            buddies = res.data.data.results;
            $scope.people = buddies;
            return $q.when(buddies)
        })
    };
    $scope.getPeopleText = function(item) {
        if (typeof item.aliasId != "undefined") {
            var id = item.aliasId
        } else {
            var id = item.userId
        }
        return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
    };
    $scope.getPeopleTextRaw = function(item) {
        return "@" + item.fullname
    };
    $scope.limit = 10;
    $scope.cursor = $scope.$parent.eventCursor;
    $scope.busy = false;
    $scope.hasmore = true;
    $scope.hasLoaded = false;
    $scope.getEvents = function(limit) {
        if (!$scope.hasmore) return;
        if (!limit) limit = $scope.limit;
        $scope.busy = true;
        Game.getEvents($scope.$parent.gameId, limit, $scope.$parent.eventCursor).success(function(data) {
            if (data.status) {
                $scope.hasLoaded = true;
                if (!data.data.count) {
                    $scope.hasmore = false;
                    return
                }
                $scope.$parent.eventCursor = data.data.cursor;
                data.data.events.forEach(function(e) {
                    e.textCm = "";
                    e.focus = false;
                    e.isLoading = false;
                    if (e.totalComment > 0) {
                        e.showComment = true
                    } else {
                        e.showComment = false
                    }
                    var moreComment = false;
                    e.comments = {
                        data: [],
                        cursor: "",
                        moreComment: moreComment
                    };
                    $scope.events.push(e)
                })
            }
            $scope.busy = false
        }).error(function(data) {})
    }
}]);
angular.module("App").controller("DetailEventCtrl", ["$scope", "$rootScope", "$q", "$modal", "$stateParams", "Event", "User", function($scope, $rootScope, $q, $modal, $stateParams, Event, User) {
    $scope.option = {
        useAlias: 0
    };
    $scope.userOption = function() {
        if ($scope.alias && $scope.alias.aliasId != undefined && $scope.alias.aliasId) {
            $scope.option.useAlias = 1
        }
    };
    $scope.userOption();
    $scope.$on("get-alias-success", function(e, params) {
        $scope.userOption()
    });
    $scope.postId = $stateParams.postId;
    $scope.error = {
        status: false,
        msg: ""
    };
    $scope.post = {
        inputComment: ""
    };
    $scope.loading = true;
    $scope.show = false;
    $scope.friends = [];
    $scope.getFriend = function() {
        if ($scope.page == "clan") {
            Clan.getTagFriend($scope.clanId).success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.members
                }
            })
        } else {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friends = data.data.buddies
                }
            })
        }
    };
    if ($rootScope.loggedIn) $scope.getFriend();
    $scope.mentionCm = "";
    $scope.macros = {};
    $scope.people = [];
    $scope.searchPeople = function(term) {
        var peopleList = [];
        angular.forEach($scope.friends, function(item) {
            if (item.fullname.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                peopleList.push(item)
            }
        });
        $scope.people = peopleList;
        return $q.when(peopleList)
    };
    $scope.getPeopleText = function(item) {
        if (typeof item.aliasId != "undefined") {
            var id = item.aliasId
        } else {
            var id = item.userId
        }
        return '<input type="button" class="mention-text" id="' + id + '" value="' + item.fullname + '"/>'
    };
    $scope.getPeopleTextRaw = function(item) {
        return "@" + item.fullname
    };
    $scope.limit = 10;
    $scope.cursor = $scope.$parent.eventCursor;
    $scope.busy = false;
    $scope.hasmore = true;
    $scope.hasLoaded = false;
    $scope.event = {};
    $scope.event.comments = {
        data: [],
        cursor: "",
        moreComment: false
    };
    $scope.eventId = $stateParams.eventId;
    Event.detailEvent($scope.$parent.gameId, $scope.eventId).success(function(data) {
        if (data.status) {
            $scope.$parent.eventCursor = data.data.cursor;
            $scope.event.textCm = "";
            $scope.event.focus = false;
            $scope.event.isLoading = false;
            if ($scope.event.totalComment > 0) {
                $scope.event.showComment = true
            } else {
                $scope.event.showComment = false
            }
            $scope.event = data.data;
            $scope.event.comments = {
                data: [],
                cursor: "",
                moreComment: false
            }
        }
    })
}]);
angular.module("App").controller("EditEventCtrl", ["$modalInstance", "$http", "$scope", "$window", "$timeout", "$state", "editEvent", "Event", function($modalInstance, $http, $scope, $window, $timeout, $state, editEvent, Event) {
    $scope.eventPost = angular.copy(editEvent);
    if ($scope.eventPost.content.html == undefined) {
        $scope.eventPost.content.html = $scope.eventPost.content.text
    }
    $scope.dismiss = function() {
        $modalInstance.dismiss("cancel")
    };
    $scope.msg = {};
    $scope.updateEvent = function() {
        $scope.msg = {};
        var update = false;
        if (!$scope.eventPost.name) {
            $scope.msg.error = "Event name not blank!";
            return false
        }
        if (!$scope.eventPost.content.html) {
            $scope.msg.error = "Event content not blank!";
            return false
        }
        var params = {};
        if ($scope.eventPost.name != editEvent.name) {
            params.name = $scope.eventPost.name;
            update = true
        }
        if ($scope.eventPost.content.html != editEvent.content.html) {
            params.text = $scope.eventPost.content.html;
            params.text = params.text.replace(/<div>(<br>|<br\/>)/gi, "<br>").replace(/<div>/g, "<br>").replace(/<\/div>/g, "");
            update = true
        }
        if ($scope.eventPost.photo != editEvent.photo) {
            params.photo = $scope.eventPost.photoId;
            update = true
        }
        if ($scope.eventPost.place.name != editEvent.place.name) {
            params["placeName"] = $scope.eventPost.place.name;
            update = true
        }
        if ($scope.eventPost.place.long != editEvent.place.long) {
            params["placeLong"] = $scope.eventPost.place.long;
            update = true
        }
        if ($scope.eventPost.place.lat != editEvent.place.lat) {
            params["placeLat"] = $scope.eventPost.place.lat;
            update = true
        }
        if ($scope.eventPost.from != editEvent.from) {
            params.from = moment($scope.eventPost.from).format("YYYY-MM-DDTHH:mm:ssZZ");
            update = true
        }
        if ($scope.eventPost.to != editEvent.to) {
            params.to = moment($scope.eventPost.to).format("YYYY-MM-DDTHH:mm:ssZZ");
            update = true
        }
        params.type = "html";
        if (update) {
            $scope.loading = true;
            Event.updateEvent($scope.eventPost.gameId, $scope.eventPost.eventId, params).success(function(data, status, header, config) {
                $scope.loading = false;
                if (data.status) {
                    var updateData = data.data;
                    updateData.action = "edit";
                    $scope.msg.success = "Update successfully!";
                    $timeout(function() {
                        $modalInstance.close(updateData)
                    }, 1500)
                } else {
                    $scope.msg.error = data.message
                }
            }).error(function(data, status, header, config) {
                $scope.loading = false;
                $scope.msg.error = "Server's busy! Please try again!"
            })
        } else {
            $scope.msg.error = "Infomation is not change!"
        }
    };
    $scope.deleteEvent = function() {
        $scope.confirm = $window.confirm("Are you sure to delete this event?");
        if (!$scope.confirm) return false;
        $scope.loading = true;
        Event.deleteEvent($scope.eventPost.gameId, $scope.eventPost.eventId).success(function(data, status, header, config) {
            $scope.loading = false;
            if (data.status) {
                $scope.eventPost.action = "delete";
                $scope.msg.success = "Delete successfully!";
                $timeout(function() {
                    $modalInstance.close($scope.eventPost);
                    $state.go($state.current.name, {}, {
                        reload: true
                    })
                }, 1500)
            } else {
                $scope.msg.error = data.message
            }
        }).error(function(data, status, header, config) {
            $scope.loading = false;
            $scope.msg.error = "Server's busy! Please try again!"
        })
    }
}]);
angular.module("App").controller("EventInviteCtrl", ["$scope", "$modalInstance", "$timeout", "User", "Event", "invitedEvent", function($scope, $modalInstance, $timeout, User, Event, invitedEvent) {
    $scope.eventId = invitedEvent.eventId;
    $scope.gameId = invitedEvent.gameId;
    $scope.keyword = "";
    $scope.friendInvites = [];
    $scope.userInvites = {};
    $scope.success = "";
    $scope.showInvite = false;
    $scope.$watch("keyword", function() {
        if (!$scope.keyword) {
            User.getFriend().success(function(data) {
                if (data.status) {
                    $scope.friendInvites = data.data.buddies
                }
            })
        } else {
            User.searchFriend({
                keyword: $scope.keyword
            }).success(function(data) {
                $scope.friendInvites = data.data.results
            })
        }
    });
    $scope.inviteUser = function(userId, fullname) {
        var user = {
            userId: userId,
            fullname: fullname
        };
        $scope.userInvites[userId] = user;
        $scope.showInvite = true
    };
    $scope.removeUserInvite = function(userId) {
        delete $scope.userInvites[userId];
        if (isEmpty($scope.userInvites)) {
            $scope.showInvite = false
        }
    };
    $scope.sendInvite = function() {
        var userIds = [];
        for (key in $scope.userInvites) {
            userIds.push(key)
        }
        if (!userIds.length) {
            alert("Please choose at least one user!");
            return false
        }
        Event.invite($scope.gameId, $scope.eventId, {
            users: userIds.join(",")
        }).success(function(data) {
            if (data.status) {
                $scope.userInvites = {};
                $scope.showInvite = false;
                $scope.success = "Invite successfully!";
                $timeout(function() {
                    $modalInstance.close($scope.eventId)
                }, 1e3)
            }
        })
    };
    $scope.closeModal = function() {
        $modalInstance.close($scope.eventId)
    };
    $scope.dismiss = function() {
        $modalInstance.dismiss($scope.eventId)
    }
}]);
angular.module("App").controller("EventUserCtrl", ["$scope", "$rootScope", "$modalInstance", "User", "Event", "event", function($scope, $rootScope, $modalInstance, User, Event, event) {
    $scope.event = event;
    $scope.users = [];
    $scope.busy = false;
    $scope.cursor = "";
    $scope.getJoinedUser = function() {
        var params = {
            limit: 10,
            cursor: $scope.cursor
        };
        if ($scope.busy) return;
        $scope.busy = true;
        Event.getJoinedUser($scope.event.gameId, $scope.event.eventId, params).success(function(data, status, header, config) {
            if (data.status) {
                $scope.busy = false;
                var users = data.data.users;
                if (users.length > 0) {
                    for (var i = 0; i < users.length; i++) {
                        if (typeof users[i].aliasId != "undefined") {
                            users[i].byAlias = true
                        }
                        $scope.users.push(users[i])
                    }
                    $scope.cursor = data.data.cursor
                }
            }
        }).error(function(data, status, header, config) {})
    };
    $scope.getJoinedUser();
    $scope.closeModal = function() {
        $modalInstance.close($rootScope.postBox)
    };
    $scope.$on("$stateChangeSuccess", function(oldState, newState) {
        if (oldState != newState) $scope.closeModal()
    })
}]);
(function() {
    "use strict";
    angular.module("App").factory("Notification", notificationFactory);

    function notificationFactory($http) {
        var Notification = {
            nextPage: nextPage,
            markRead: markRead,
            acceptJoinClan: acceptJoinClan,
            rejectClan: rejectClan,
            deleteNoti: deleteNoti
        };
        return Notification;

        function nextPage(cursor) {
            var url = "/ajax/index.php/notification";
            var params = {
                limit: 10,
                cursor: cursor,
                html: 1
            };
            return $http.get(url, {
                params: params
            })
        }

        function markRead(notificationId) {
            var url = "/ajax/index.php/notification/markread?notificationId=" + notificationId;
            return $http.get(url)
        }

        function acceptJoinClan(clanId, userId) {
            var url = "/ajax/index.php/clan/joinrequest";
            var params = {
                method: "post",
                clanId: clanId,
                userId: userId
            };
            return $http.post(url, serializeData(params))
        }

        function rejectClan(clanId, userId) {
            var url = "/ajax/index.php/clan/joinrequest";
            var params = {
                method: "delete",
                clanId: clanId,
                userId: userId
            };
            return $http.post(url, serializeData(params))
        }

        function deleteNoti(notificationId) {
            var url = "/ajax/index.php/notification/delete?notificationId=" + notificationId;
            return $http.get(url)
        }
    }
})();
(function() {
    "use strict";
    angular.module("App").factory("Search", searchFactory);

    function searchFactory($http) {
        var Search = {
            nextPageGame: nextPageGame,
            nextPageClan: nextPageClan,
            nextPageUser: nextPageUser
        };
        return Search;

        function nextPageGame(keyword, cursor, limit) {
            var params = {
                limit: limit,
                keyword: keyword,
                cursor: cursor,
                store: "ios"
            };
            var url = "/ajax/index.php/search/game";
            return $http.get(url, {
                params: params
            })
        }

        function nextPageClan(keyword, cursor, limit) {
            var params = {
                limit: limit,
                keyword: keyword,
                cursor: cursor
            };
            var url = "/ajax/index.php/search/clan";
            return $http.get(url, {
                params: params
            })
        }

        function nextPageUser(keyword, cursor, limit) {
            var params = {
                limit: limit,
                keyword: keyword,
                cursor: cursor
            };
            var url = "/ajax/index.php/search/people";
            return $http.get(url, {
                params: params
            })
        }
    }
})();
(function() {
    "use strict";
    angular.module("App").factory("Post", postFactory);

    function postFactory($http) {
        var Post = {
            nextPage: nextPage,
            postStatus: postStatus,
            getComment: getComment,
            getCommentBefore: getCommentBefore,
            getCommentAfter: getCommentAfter,
            leaveComment: leaveComment,
            getPost: getPost,
            likePost: likePost,
            unlikePost: unlikePost,
            pinPost: pinPost,
            deletePost: deletePost,
            updatePost: updatePost,
            hidePost: hidePost,
            reportPost: reportPost,
            getListLiked: getListLiked,
            likeComment: likeComment,
            unLikeComment: unLikeComment,
            deleteComment: deleteComment,
            getListShared: getListShared,
            deletePhoto: deletePhoto
        };
        return Post;

        function nextPage(url, params) {
            if (params.cursor) {
                params.limit = 10
            } else {
                params.limit = 5
            }
            return $http.get(url, {
                params: params
            })
        }

        function postStatus(postUrl, params) {
            delete params.limit;
            delete params.cursor;
            return $http.post(postUrl, serializeData(params))
        }

        function getComment(postId, cursor, limit) {
            var params = {
                limit: limit,
                postId: postId,
                cursor: cursor,
                order: -1
            };
            var url = "/ajax/index.php/post/getcommentbypost";
            return $http.get(url, {
                params: params
            })
        }

        function getCommentBefore(postId, commentId) {
            var params = {
                limit: 10,
                postId: postId,
                before: commentId,
                order: -1
            };
            var url = "/ajax/index.php/post/getcommentbypost";
            return $http.get(url, {
                params: params
            })
        }

        function getCommentAfter(postId, commentId) {
            var params = {
                limit: 10,
                postId: postId,
                after: commentId
            };
            var url = "/ajax/index.php/post/getcommentbypost";
            return $http.get(url, {
                params: params
            })
        }

        function leaveComment(params) {
            params.method = "post";
            var url = "/ajax/index.php/post/leavecommentbypost";
            return $http.post(url, serializeData(params))
        }

        function getPost(postId) {
            var params = {
                postId: postId
            };
            var url = "/ajax/index.php/post";
            return $http.get(url, {
                params: params
            }, {
                cache: true
            })
        }

        function likePost(postId) {
            var params = {
                postId: postId
            };
            var url = "/ajax/index.php/post/like";
            return $http.post(url, serializeData(params))
        }

        function pinPost(params) {
            var url = "/ajax/index.php/post/pin";
            return $http.post(url, serializeData(params))
        }

        function unlikePost(postId) {
            var params = {
                postId: postId
            };
            var url = "/ajax/index.php/post/unlike";
            return $http.post(url, serializeData(params))
        }

        function deletePost(postId) {
            var params = {
                postId: postId
            };
            var url = "/ajax/index.php/post/delete";
            return $http.post(url, serializeData(params))
        }

        function updatePost(params) {
            var url = "/ajax/index.php/post/update";
            return $http.post(url, serializeData(params))
        }

        function hidePost(postId) {
            var params = {
                method: "post",
                postId: postId
            };
            var url = "/ajax/index.php/post/hide";
            return $http.post(url, serializeData(params))
        }

        function reportPost(postId) {
            var params = {
                method: "post",
                postId: postId,
                type: "spam",
                string: "spam"
            };
            var url = "/ajax/index.php/post/report";
            return $http.post(url, serializeData(params))
        }

        function getListLiked(postId, cursor) {
            var params = {
                postId: postId,
                cursor: cursor
            };
            var url = "/ajax/index.php/post/getlistlike";
            return $http.get(url, {
                params: params
            })
        }

        function likeComment(commentId) {
            var params = {
                commentId: commentId
            };
            var url = "/ajax/index.php/comment/like";
            return $http.get(url, {
                params: params
            })
        }

        function unLikeComment(commentId) {
            var params = {
                commentId: commentId
            };
            var url = "/ajax/index.php/comment/unlike";
            return $http.get(url, {
                params: params
            })
        }

        function deleteComment(commentId) {
            var params = {
                method: "delete",
                commentId: commentId
            };
            var url = "/ajax/index.php/comment";
            return $http.post(url, serializeData(params))
        }

        function getListShared(postId, cursor) {
            var params = {
                method: "get",
                postId: postId,
                cursor: cursor
            };
            var url = "/ajax/index.php/post/share";
            return $http.post(url, serializeData(params))
        }

        function deletePhoto(photoId) {
            var url = "/ajax/index.php/post/deletephoto/" + photoId;
            return $http.get(url)
        }
    }
})();
(function() {
    "use strict";
    angular.module("App").factory("Tip", tipFactory);

    function tipFactory($http) {
        var Tip = {
            nextPage: nextPage,
            getTip: getTip,
            getComment: getComment,
            getCommentBefore: getCommentBefore,
            getCommentAfter: getCommentAfter,
            leaveComment: leaveComment,
            likePost: likePost,
            unlikePost: unlikePost,
            getListLiked: getListLiked,
            likeComment: likeComment,
            unLikeComment: unLikeComment,
            deleteComment: deleteComment,
            deleteTip: deleteTip,
            getSuggest: getSuggest,
            getSuggestInGame: getSuggestInGame,
            createTip: createTip,
            updateTip: updateTip
        };
        return Tip;

        function nextPage(params) {
            params.limit = 20;
            var url = "/ajax/index.php/games/tip?" + serializeData(params);
            return $http.get(url)
        }

        function getTip(tipId) {
            var params = {
                tipId: tipId
            };
            var url = "/ajax/index.php/tip?" + serializeData(params);
            return $http.get(url)
        }

        function getComment(tipId, cursor, limit) {
            var params = {
                limit: limit,
                tipId: tipId,
                cursor: cursor,
                order: -1
            };
            var url = "/ajax/index.php/tip/getcommentbypost?" + serializeData(params);
            return $http.get(url)
        }

        function getCommentBefore(tipId, commentId) {
            var params = {
                limit: 10,
                tipId: tipId,
                before: commentId,
                order: -1
            };
            var url = "/ajax/index.php/tip/getcommentbypost?" + serializeData(params);
            return $http.get(url)
        }

        function getCommentAfter(tipId, commentId) {
            var params = {
                limit: 10,
                tipId: tipId,
                after: commentId
            };
            var url = "/ajax/index.php/tip/getcommentbypost?" + serializeData(params);
            return $http.get(url)
        }

        function leaveComment(params) {
            var url = "/ajax/index.php/tip/leavecommentbypost";
            return $http.post(url, serializeData(params))
        }

        function likePost(tipId) {
            var params = {
                method: "post",
                tipId: tipId
            };
            var url = "/ajax/index.php/tip/like";
            return $http.post(url, serializeData(params))
        }

        function unlikePost(tipId) {
            var params = {
                method: "delete",
                tipId: tipId
            };
            var url = "/ajax/index.php/tip/like";
            return $http.post(url, serializeData(params))
        }

        function getListLiked(tipId, cursor) {
            var params = {
                tipId: tipId,
                cursor: cursor
            };
            var url = "/ajax/index.php/tip/listliked?" + serializeData(params);
            return $http.get(url)
        }

        function likeComment(commentId) {
            var params = {
                commentId: commentId
            };
            var url = "/ajax/index.php/comment/like?" + serializeData(params);
            return $http.get(url)
        }

        function unLikeComment(commentId) {
            var params = {
                commentId: commentId
            };
            var url = "/ajax/index.php/comment/unlike?" + serializeData(params);
            return $http.get(url)
        }

        function deleteComment(commentId) {
            var params = {
                method: "delete",
                commentId: commentId
            };
            var url = "/ajax/index.php/comment";
            return $http.post(url, serializeData(params))
        }

        function deleteTip(tipId) {
            var params = {
                tipId: tipId
            };
            var url = "/ajax/index.php/tip/delete";
            return $http.post(url, serializeData(params))
        }

        function getSuggest(params) {
            params.limit = 6;
            var url = "/ajax/index.php/tip/suggest?" + serializeData(params);
            return $http.get(url)
        }

        function getSuggestInGame(params) {
            params.method = "get";
            params.limit = 3;
            var url = "/ajax/index.php/games/tip";
            return $http.post(url, serializeData(params))
        }

        function createTip(gameId, params) {
            var url = "/ajax/index.php/tip/createtip/" + gameId;
            return $http.post(url, serializeData(params))
        }

        function updateTip(tipId, params) {
            var url = "/ajax/index.php/tip/update/" + tipId;
            return $http.post(url, serializeData(params))
        }
    }
})();
(function() {
    "use strict";
    angular.module("App").factory("User", userFactory);

    function userFactory($http, $window, $q, $cookies, $rootScope, $cacheFactory) {
        var User = {
            getUserInfo: getUserInfo,
            updateInfo: updateInfo,
            getFriend: getFriend,
            searchFriend: searchFriend,
            pull: pull,
            getListFollowing: getListFollowing,
            getListFollower: getListFollower,
            follow: follow,
            unFollow: unFollow,
            getAlias: getAlias,
            getAliasSetting: getAliasSetting,
            settingAlias: settingAlias,
            getAliasInfo: getAliasInfo,
            updateAlias: updateAlias,
            getUserSuggestion: getUserSuggestion,
            followAll: followAll
        };
        return User;

        function getUserInfo(userId) {
            var url = "/ajax/index.php/user/getuserinfo";
            return $http.get(url, {
                params: {
                    userId: userId
                }
            })
        }

        function updateInfo(userId, info) {
            info.userId = userId;
            var url = "/ajax/index.php/user/updateinfo";
            return $http.post(url, serializeData(info))
        }

        function getFriend() {
            if (!$rootScope.loggedIn) return;
            var params = {
                limit: 10
            };
            var url = "/ajax/index.php/search/getfriend";
            return $http.get(url, {
                params: params
            })
        }

        function searchFriend(params) {
            params.limit = 10;
            params.keyword = encodeURIComponent(params.keyword);
            var url = "/ajax/index.php/search/searchbuddies";
            return $http.get(url, {
                params: params
            })
        }

        function pull(callback, client_id, offset, token, timeout) {
            if (offset === undefined) offset = "";
            if (client_id === undefined) client_id = "";
            if (token === undefined) token = "";
            if (!$rootScope.loggedIn) {
                return false
            }
            if ($rootScope.pullRunning) return true;
            var params = {
                i: client_id,
                o: offset,
                t: token
            };
            if (timeout !== undefined) params.w = timeout;
            var url = "/ajax/index.php/user/pull";
            $rootScope.pullRunning = true;
            $http.get(url, {
                params: params
            }).success(function(data, status, header, config) {
                if ($rootScope.networkState == "error") $rootScope.networkState = "ok";
                $rootScope.pullRunning = false;
                if (data.type == "data" || data.type == "init") {
                    if (data.data) callback(data.data);
                    if (data.offset) {
                        offset = data.offset
                    }
                    if (data.token) {
                        token = data.token
                    }
                    if (data.client_id) {
                        client_id = data.client_id
                    }
                    pull(callback, client_id, offset, token)
                } else if (data.type == "timeout") {
                    setTimeout(function() {
                        pull(callback, client_id, offset, token)
                    }, 1e3)
                }
                return data
            }).error(function(data, status, header, config) {
                $rootScope.pullRunning = false;
                if (status == 404) {
                    $rootScope.networkState = "error";
                    setTimeout(function() {
                        pull(callback, client_id, offset, token, 3)
                    }, 2e3);
                    return
                }
                if ($rootScope.networkState == "error") $rootScope.networkState = "ok";
                if (status == 504 || status == 502) {
                    setTimeout(function() {
                        pull(callback, client_id, offset, token)
                    }, 1e3)
                } else {
                    setTimeout(function() {
                        pull(callback, client_id, offset, token)
                    }, 2e3)
                }
            })
        }

        function getListFollowing(userId, cursor) {
            var params = {
                limit: 20,
                userId: userId,
                cursor: cursor
            };
            var url = "/ajax/index.php/user/getfollowing";
            return $http.get(url, {
                params: params
            })
        }

        function getListFollower(userId, cursor) {
            var params = {
                limit: 20,
                userId: userId,
                cursor: cursor
            };
            var url = "/ajax/index.php/user/getfollower";
            return $http.get(url, {
                params: params
            })
        }

        function follow(userId) {
            var url = "/ajax/index.php/user/follow";
            return $http.post(url, serializeData({
                userId: userId
            }))
        }

        function unFollow(userId) {
            var url = "/ajax/index.php/user/unfollow";
            return $http.post(url, serializeData({
                userId: userId
            }))
        }

        function getAlias() {
            var url = "/ajax/index.php/user/alias?userId=me";
            return $http.get(url)
        }

        function getAliasSetting() {
            var url = "/ajax/index.php/user/aliassetting?userId=me";
            return $http.get(url)
        }

        function settingAlias(useAlias, defaultAlias) {
            var params = {
                useAlias: useAlias,
                defaultAlias: defaultAlias
            };
            var url = "/ajax/index.php/user/updateAliasSetting?userId=me";
            return $http.post(url, serializeData(params))
        }

        function getAliasInfo(aliasId) {
            var url = "/ajax/index.php/alias?aliasId=" + aliasId;
            return $http.get(url)
        }

        function updateAlias(params) {
            var url = "/ajax/index.php/alias/update";
            return $http.post(url, serializeData(params))
        }

        function getUserSuggestion(params) {
            if (params.gameId != undefined) {
                var params = {
                    limit: 10,
                    gameId: params.gameId,
                    filter: "friend"
                };
                var url = "/ajax/index.php/games/getfollower";
                return $http.get(url, {
                    params: params,
                    cache: true
                })
            } else {
                if (params == undefined) {
                    var params = {
                        limit: 10
                    }
                }
                var url = "/ajax/index.php/user/getUserSuggestion";
                var id = $rootScope.hashCode(url);
                var t = $window.localStorage.getItem(id);
                if (!t || moment().unix() - parseInt(t) > 300) {
                    var cache = $cacheFactory.get("$http");
                    cache.remove(url);
                    $window.localStorage.setItem(id, moment().unix())
                }
                return $http.get(url, {
                    params: params,
                    cache: true
                })
            }
        }

        function followAll(userIds) {
            var promises = userIds.map(function(userId) {
                var params = {
                    method: "post",
                    userId: userId
                };
                return $http({
                    url: "/ajax/index.php/user/follow",
                    method: "POST",
                    data: serializeData(params)
                })
            });
            return $q.all(promises)
        }
    }
})();
(function() {
    "use strict";
    angular.module("App").factory("Game", gameFactory);

    function gameFactory($http, $q, $rootScope, $stateParams, $cacheFactory, $window) {
        var Game = {
            nextPage: nextPage,
            createGame: createGame,
            createAlias: createAlias,
            getAlias: getAlias,
            getGameInfo: getGameInfo,
            getListPlayed: getListPlayed,
            getListFollower: getListFollower,
            getGameRelated: getGameRelated,
            getClan: getClan,
            joinClan: joinClan,
            follow: follow,
            followAll: followAll,
            unFollow: unFollow,
            createClan: createClan,
            getGameSuggest: getGameSuggest,
            getGiftcode: getGiftcode,
            createEvent: createEvent,
            getEvents: getEvents,
            getLeaderBoard: getLeaderBoard,
            getLeaderBoardPlayer: getLeaderBoardPlayer,
            getListVideo: getListVideo
        };
        return Game;

        function nextPage(url, params) {
            params.limit = 21;
            return $http.get(url, {
                params: params
            })
        }

        function createGame(ituneId, keyword) {
            var params = {
                method: "post",
                ituneId: ituneId,
                keyword: keyword
            };
            var url = "/ajax/index.php/games/createGame";
            return $http.post(url, serializeData(params))
        }

        function createAlias(params) {
            var url = "/ajax/index.php/games/updateAlias";
            return $http.post(url, serializeData(params))
        }

        function getAlias(gameId) {
            var params = {
                gameId: gameId
            };
            var url = "/ajax/index.php/games/alias";
            return $http.get(url, {
                params: params
            })
        }

        function getGameInfo(gameId) {
            var url = "/ajax/index.php/games/getgameinfo?gameId=" + gameId;
            return $http.get(url)
        }

        function getListPlayed(gameId, cursor) {
            var params = {
                limit: 10,
                gameId: gameId,
                cursor: cursor
            };
            var url = "/ajax/index.php/games/getplayer";
            return $http.get(url, {
                params: params
            })
        }

        function getListFollower(gameId, cursor) {
            var params = {
                limit: 10,
                gameId: gameId,
                cursor: cursor
            };
            var url = "/ajax/index.php/games/getfollower";
            return $http.get(url, {
                params: params
            })
        }

        function getGameRelated(devId, cursor) {
            var params = {
                limit: 10,
                devId: devId,
                cursor: cursor
            };
            var url = "/ajax/index.php/games/getgamerelated";
            return $http.get(url, {
                params: params
            })
        }

        function getClan(gameId) {
            var params = {
                gameId: gameId,
                limit: 10
            };
            var url = "/ajax/index.php/games/clan";
            return $http.get(url, {
                params: params
            })
        }

        function joinClan(clanId) {
            var params = {
                method: "post",
                clanId: clanId
            };
            var url = "/ajax/index.php/clan/member";
            return $http.post(url, serializeData(params))
        }

        function follow(gameId) {
            var url = "/ajax/index.php/games/follow";
            return $http.post(url, serializeData({
                gameId: gameId
            }))
        }

        function followAll(gameIds) {
            var promises = gameIds.map(function(gameId) {
                var params = {
                    method: "post",
                    gameId: gameId
                };
                return $http({
                    url: "/ajax/index.php/games/follow",
                    method: "POST",
                    data: serializeData(params)
                })
            });
            return $q.all(promises)
        }

        function unFollow(gameId) {
            var url = "/ajax/index.php/games/unfollow?gameId";
            return $http.post(url, serializeData({
                gameId: gameId
            }))
        }

        function createClan(params) {
            var url = "/ajax/index.php/games/createclan";
            return $http.post(url, serializeData(params))
        }

        function getGameSuggest(params) {
            var url = "/ajax/index.php/games/suggest";
            var id = $rootScope.hashCode(url);
            var t = $window.localStorage.getItem(id);
            if (!t || moment().unix() - parseInt(t) > 300) {
                var cache = $cacheFactory.get("$http");
                cache.remove(url);
                $window.localStorage.setItem(id, moment().unix())
            }
            return $http.get(url, {
                params: params
            }, {
                cache: true
            })
        }

        function getGiftcode(params) {
            var url = "/ajax/index.php/games/giftcode";
            return $http.get(url, {
                params: params
            })
        }

        function createEvent(params) {
            params.method = "post";
            var url = "/ajax/index.php/games/createEvent";
            return $http.post(url, serializeData(params))
        }

        function getEvents(gameId, limit, cursor) {
            var url = "/ajax/index.php/" + "games/index/" + gameId + "/events";
            return $http.get(url, {
                params: {
                    limit: limit,
                    cursor: cursor
                }
            })
        }

        function getLeaderBoard(params) {
            var url = "/ajax/index.php/games/getleaderboard";
            return $http.get(url, {
                params: params
            })
        }

        function getLeaderBoardPlayer(params) {
            var url = "/ajax/index.php/games/getleaderboardplayer";
            return $http.get(url, {
                params: params
            })
        }

        function getListVideo(params) {
            var url = "/ajax/index.php/games/videos";
            return $http.get(url, {
                params: params
            })
        }
    }
})();
(function() {
    "use strict";
    angular.module("App").factory("Giftcode", giftcodeFactory);

    function giftcodeFactory($http) {
        var Giftcode = {
            getList: getList,
            getCode: getCode
        };
        return Giftcode;

        function getList() {
            var url = "/ajax/index.php/giftcode";
            return $http.get(url, {
                params: params
            })
        }

        function getCode(params) {
            var url = "/ajax/index.php/giftcode/code";
            return $http.post(url, serializeData(params))
        }
    }
})();
(function() {
    angular.module("App").factory("Event", eventFactory);

    function eventFactory($http) {
        var Event = {
            getComment: getComment,
            detailEvent: detailEvent,
            getCommentBefore: getCommentBefore,
            getCommentAfter: getCommentAfter,
            deleteComment: deleteComment,
            leaveComment: leaveComment,
            updateEvent: updateEvent,
            invite: invite,
            deleteEvent: deleteEvent,
            getJoinedUser: getJoinedUser,
            getListLiked: getListLiked
        };
        return Event;

        function getComment(gameId, eventId, params) {
            params.order = -1;
            var url = "/ajax/index.php/event/getcomment/" + gameId + "/" + eventId;
            return $http.post(url, serializeData(params))
        }

        function detailEvent(gameId, eventId) {
            var params = {
                method: "get",
                gameId: gameId,
                eventId: eventId
            };
            var url = "/ajax/index.php/event/getDetail";
            return $http.post(url, serializeData(params))
        }

        function getCommentBefore(gameId, eventId, commentId) {
            var params = {
                limit: 10,
                before: commentId,
                order: -1
            };
            var url = "/ajax/index.php/event/getcomment/" + gameId + "/" + eventId;
            return $http.post(url, serializeData(params))
        }

        function getCommentAfter(gameId, eventId, commentId) {
            var params = {
                limit: 10,
                after: commentId
            };
            var url = "/ajax/index.php/event/getcomment/" + gameId + "/" + eventId;
            return $http.post(url, serializeData(params))
        }

        function deleteComment(commentId) {
            var params = {
                method: "delete",
                commentId: commentId
            };
            var url = "/ajax/index.php/comment";
            return $http.post(url, serializeData(params))
        }

        function leaveComment(gameId, eventId, params) {
            var url = "/ajax/index.php/event/leavecomment/" + gameId + "/" + eventId;
            return $http.post(url, serializeData(params))
        }

        function updateEvent(gameId, eventId, params) {
            var url = "/ajax/index.php/event/updateEvent/" + gameId + "/" + eventId;
            return $http.post(url, serializeData(params))
        }

        function invite(gameId, eventId, params) {
            var url = "/ajax/index.php/event/invite/" + gameId + "/" + eventId;
            return $http.post(url, serializeData(params))
        }

        function deleteEvent(gameId, eventId) {
            var url = "/ajax/index.php/event/delete/" + gameId + "/" + eventId;
            return $http.get(url)
        }

        function getJoinedUser(gameId, eventId, params) {
            var url = "/ajax/index.php/event/getJoinedUser/" + gameId + "/" + eventId;
            return $http.post(url, serializeData(params))
        }

        function getListLiked(gameId, eventId) {
            var params = {
                method: "get",
                gameId: gameId,
                eventId: eventId
            };
            var url = "/ajax/index.php/event/getLiked";
            return $http.post(url, serializeData(params))
        }
    }
})();
(function() {
    "use strict";
    angular.module("App").factory("Clan", clanFactory);

    function clanFactory($http, $rootScope, $cacheFactory, $window) {
        var Clan = {
            nextPage: nextPage,
            getInfo: getInfo,
            updateInfo: updateInfo,
            joinClan: joinClan,
            leaveClan: leaveClan,
            invite: invite,
            getAllMember: getAllMember,
            getTagFriend: getTagFriend,
            getMember: getMember,
            getSuggest: getSuggest
        };
        return Clan;

        function nextPage(url, params) {
            params.limit = 10;
            return $http.get(url, {
                params: params
            })
        }

        function getInfo(clanId) {
            var params = {
                clanId: clanId
            };
            var url = "/ajax/index.php/clan/getinfo";
            return $http.get(url, {
                params: params
            })
        }

        function updateInfo(info) {
            info.method = "post";
            var url = "/ajax/index.php/clan/updateinfo";
            return $http.post(url, serializeData(info))
        }

        function joinClan(clanId) {
            var params = {
                clanId: clanId
            };
            var url = "/ajax/index.php/clan/join";
            return $http.post(url, serializeData(params))
        }

        function leaveClan(clanId) {
            var params = {
                clanId: clanId
            };
            var url = "/ajax/index.php/clan/leave";
            return $http.post(url, serializeData(params))
        }

        function invite(clanId, userIds) {
            var strUserId = userIds.join(",");
            var params = {
                users: strUserId,
                clanId: clanId,
                text: ""
            };
            var url = "/ajax/index.php/clan/invite";
            return $http.post(url, serializeData(params))
        }

        function getAllMember(clanId) {
            var params = {
                limit: 100,
                clanId: clanId,
                cursor: ""
            };
            var url = "/ajax/index.php/clan/member";
            return $http.get(url, {
                params: params
            })
        }

        function getTagFriend(clanId) {
            var params = {
                limit: 5e3,
                clanId: clanId
            };
            var url = "/ajax/index.php/clan/member";
            return $http.get(url, {
                params: params
            })
        }

        function getMember(clanId, cursor) {
            var params = {
                limit: 10,
                clanId: clanId,
                cursor: cursor
            };
            var url = "/ajax/index.php/clan/member";
            return $http.get(url, {
                params: params
            })
        }

        function getSuggest(params) {
            params.method = "get";
            var url = "/ajax/index.php/clan/suggest";
            var id = $rootScope.hashCode(url);
            var t = $window.localStorage.getItem(id);
            if (!t || moment().unix() - parseInt(t) > 300) {
                var cache = $cacheFactory.get("$http");
                cache.remove(url);
                $window.localStorage.setItem(id, moment().unix())
            }
            return $http.get(url, {
                params: params
            }, {
                cache: true
            })
        }
    }
})();
(function() {
    "use strict";
    angular.module("App").factory("RecentChatSvc", RecentChatSvc);

    function RecentChatSvc($http, $q) {
        var svc = {
            recentChats: [],
            recentChatIds: [],
            status: "",
            fetch: fetch,
            get: get,
            getAll: getAll
        };
        return svc;

        function fetch() {
            var defer = $q.defer();
            if (!status || status == "failed") {
                $http.get("/ajax/index.php/chat/recent").success(function(data) {
                    if (!data.status) {
                        defer.reject();
                        return
                    }
                    data = data.data;
                    svc.recentChatIds = _.pluck(data.topics, "topicId");
                    svc.recentChats = data.topics;
                    status = "fetched";
                    defer.resolve()
                }).error(function() {
                    defer.reject()
                })
            }
            return defer.promise
        }

        function get(topicId) {
            var idx = _.indexOf(svc.recentChatIds, topicId);
            if (idx == -1) return false;
            return svc.recentChats[idx]
        }

        function getAll() {
            return svc.recentChats
        }
    }
})();
angular.module("App").controller("RecentChatBoxCtrl", RecentChatBoxCtrl);

function RecentChatBoxCtrl($scope, $rootScope, RecentChatSvc) {
    var vm = this;
    vm.recentChats = [];
    vm.loading = true;
    var watcher = $scope.$watch("recentChats.length", function(n, o) {
        if ($rootScope.appReady && vm.loading) vm.loading = false;
        vm.recentChats = $rootScope.recentChats
    })
}(function() {
    "use strict";
    angular.module("App").factory("Photo", photoFactory);

    function photoFactory($http) {
        var Photo = {
            getList: getList,
            getPhoto: getPhoto,
            getComment: getComment,
            getCommentBefore: getCommentBefore,
            getCommentAfter: getCommentAfter,
            leaveComment: leaveComment,
            likePost: likePost,
            pinPost: pinPost,
            getListLiked: getListLiked,
            unlikePost: unlikePost,
            likeComment: likeComment,
            unLikeComment: unLikeComment,
            deleteComment: deleteComment,
            deletePost: deletePost,
            deletePhoto: deletePhoto
        };
        return Photo;

        function getList(url, params) {
            params.limit = 20;
            delete params.url;
            return $http.get(url, {
                params: params
            })
        }

        function getPhoto(photoId) {
            var params = {
                photoId: photoId
            };
            var url = "/ajax/index.php/photo";
            return $http.get(url, {
                params: params
            }, {
                cache: true
            })
        }

        function getComment(photoId, cursor, limit) {
            var params = {
                limit: limit,
                photoId: photoId,
                cursor: cursor,
                order: -1
            };
            var url = "/ajax/index.php/photo/getcomment";
            return $http.get(url, {
                params: params
            })
        }

        function getCommentBefore(photoId, commentId) {
            var params = {
                limit: 10,
                photoId: photoId,
                before: commentId,
                order: -1
            };
            var url = "/ajax/index.php/photo/getcomment";
            return $http.get(url, {
                params: params
            })
        }

        function getCommentAfter(photoId, commentId) {
            var params = {
                limit: 10,
                photoId: photoId,
                after: commentId
            };
            var url = "/ajax/index.php/photo/getcomment";
            return $http.get(url, {
                params: params
            })
        }

        function leaveComment(params) {
            params.method = "post";
            var url = "/ajax/index.php/photo/leavecomment";
            return $http.post(url, serializeData(params))
        }

        function likePost(photoId) {
            var params = {
                photoId: photoId
            };
            var url = "/ajax/index.php/photo/like";
            return $http.post(url, serializeData(params))
        }

        function pinPost(params) {
            var url = "/ajax/index.php/photo/pin";
            return $http.post(url, serializeData(params))
        }

        function getListLiked(photoId, cursor) {
            var params = {
                photoId: photoId,
                cursor: cursor
            };
            var url = "/ajax/index.php/photo/getlistlike";
            return $http.get(url, {
                params: params
            })
        }

        function unlikePost(photoId) {
            var params = {
                photoId: photoId
            };
            var url = "/ajax/index.php/photo/unlike";
            return $http.post(url, serializeData(params))
        }

        function likeComment(commentId) {
            var params = {
                commentId: commentId
            };
            var url = "/ajax/index.php/comment/like";
            return $http.get(url, {
                params: params
            })
        }

        function unLikeComment(commentId) {
            var params = {
                commentId: commentId
            };
            var url = "/ajax/index.php/comment/unlike";
            return $http.get(url, {
                params: params
            })
        }

        function deleteComment(commentId) {
            var params = {
                method: "delete",
                commentId: commentId
            };
            var url = "/ajax/index.php/comment";
            return $http.post(url, serializeData(params))
        }

        function deletePost(photoId) {
            var params = {
                photoId: photoId
            };
            var url = "/ajax/index.php/photo/delete";
            return $http.get(url, {
                params: params
            })
        }

        function deletePhoto(photoId) {
            var url = "/ajax/index.php/photo/deletephoto/" + photoId;
            return $http.get(url)
        }
    }
})();
angular.module("App").directive("whenScrolled", function() {
    return {
        restrict: "A",
        link: function(scope, elm, attr) {
            var raw = elm[0];
            elm.bind("scroll", function() {
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.whenScrolled)
                }
            })
        }
    }
});
angular.module("App").directive("whenScrolledTop", ["$timeout", function($timeout) {
    return {
        restrict: "A",
        link: function(scope, elm, attr) {
            var raw = elm[0];
            elm.bind("scroll", function() {
                if (raw.scrollTop <= 50) {
                    var sh = raw.scrollHeight;
                    scope.$apply(attr.whenScrolledTop).then(function() {
                        $timeout(function() {
                            raw.scrollTop = raw.scrollHeight - sh
                        })
                    })
                }
            })
        }
    }
}]);
angular.module("App").directive("myBlur", function() {
    return {
        restrict: "A",
        link: function(scope, element, attr) {
            element.bind("blur", function() {
                scope.$apply(attr.myBlur);
                scope.$eval(attr.myFocus + "=false")
            })
        }
    }
});
angular.module("App").directive("myFocus", function($timeout) {
    return {
        link: function($scope, $element, $attr) {
            $scope.$watch($attr.myFocus, function(value) {
                if (value) {
                    $timeout(function() {
                        if ($scope.$eval($attr.myFocus)) {
                            $element[0].focus()
                        }
                    }, 0, false)
                }
            })
        }
    }
});
angular.module("App").directive("contenteditable", ["$sce", function($sce) {
    return {
        restrict: "A",
        require: "?ngModel",
        link: function(scope, element, attrs, ngModel) {
            function read() {
                var html = element.html();
                if (attrs.stripBr && html === "<br>") {
                    html = ""
                }
                ngModel.$setViewValue(html)
            }
            if (!ngModel) return;
            ngModel.$render = function() {
                if (ngModel.$viewValue !== element.html()) {
                    element.html($sce.getTrustedHtml(ngModel.$viewValue || ""))
                }
            };
            element.on("blur keyup change", function() {
                scope.$evalAsync(read)
            });
            read()
        }
    }
}]);
angular.module("App").directive("myPhotoShare", function() {
    return {
        restrict: "A",
        link: function(scope, elem, attr) {
            elem.on("load", function() {
                var theImage = new Image;
                theImage.src = elem[0].src;
                var w = theImage.width;
                var h = theImage.height;
                var div = elem.parent().parent().parent();
                var a = elem.parent();
                if (w < 400 && w == h) div.addClass("half");
                a.removeClass("hide")
            })
        }
    }
});
angular.module("App").directive("stickerbox", function($position, $compile, $http, $rootScope) {
    var templateUrl = "/views/sticker_box.html?v=" + $rootScope.getAppVersion();
    return {
        restrict: "EA",
        template: templateUrl,
        link: function(scope, element, attrs) {
            element.empty();
            $http.get(templateUrl).success(function(data) {
                var tooltip = $compile(data)(scope);
                element.after(tooltip);
                var pos = $position.positionElements(element, tooltip, "top", false);
                pos.top += "px";
                pos.left += "px";
                tooltip.css(pos)
            })
        }
    }
});
angular.module("App").directive("outsideClick", ["$document", function($document) {
    return {
        link: function(scope, element, attr) {
            var onDocumentClick = function(event) {
                angular.element(event.target).addClass("_triggerClick");
                var isChild = element[0].getElementsByClassName("_triggerClick").length > 0;
                if (!isChild) {
                    scope.$apply(attr.outsideClick)
                }
                angular.element(event.target).removeClass("_triggerClick")
            };
            $document.on("click", onDocumentClick);
            element.on("$destroy", function() {
                $document.off("click", onDocumentClick)
            })
        }
    }
}]);
angular.module("App").directive("perfectScrollbar", function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var options = {};
            if (attrs.scrollbarMin) options.minScrollbarLength = parseInt(attrs.scrollbarMin);
            if (attrs.scrollbarMax) options.maxScrollbarLength = parseInt(attrs.scrollbarMax);
            if (attrs.scrollbarPadding) options.includePadding = true;
            if (attrs.scrollx == "false") options.suppressScrollX = true;
            if (attrs.scrolly == "false") options.suppressScrollY = true
        }
    }
});
angular.module("App").directive("trackPosition", function($document, $timeout) {
    return {
        link: function(scope, element, attrs) {
            var timer = null;
            var trackPosition = function() {
                if (!scope.post.showComment || scope.requestedCm) return;
                var offsetTop = element[0].getBoundingClientRect().top + (window.pageYOffset || element.scrollTop) - (element.clientTop || 0);
                var top = offsetTop - window.pageYOffset;
                var bottom = window.innerHeight - top - (element[0].offsetHeight - 20);
                if (bottom > 0 && bottom < 400) {
                    if (timer === null) {
                        timer = setTimeout(function() {
                            scope.getComment(5);
                            scope.requestedCm = true
                        }, 300)
                    }
                }
                if (bottom > 400 && timer) {
                    clearTimeout(timer);
                    timer = null
                }
            };
            $document.bind("load", function() {
                trackPosition()
            });
            $document.bind("scroll", function() {
                trackPosition()
            })
        }
    }
});
angular.module("App").directive("tinyscrollbar", function($timeout, $window) {
    return {
        link: function(scope, element, attr) {
            element.append('<div class="scrollbar disable"><div class="track"><div class="thumb"></div></div></div>');
            var scroll = tinyscrollbar(element[0], {
                viewport: element[0],
                overview: element[0].querySelector(".scroll-content"),
                wheelSpeed: 150
            });
            angular.element($window).bind("resize", function() {
                $timeout(function() {
                    scroll.update("relative")
                }, 200)
            });
            scope.$watch(function() {
                return element[0].querySelector(".scroll-content").scrollHeight
            }, function(n, o) {
                if (n < scroll.viewportSize) scroll.update();
                else if (attr.scrollGlue && scroll.contentPosition >= o - scroll.viewportSize) scroll.update("bottom");
                else scroll.update(scroll.contentPosition)
            });
            var scrollbar = element[0].querySelectorAll(".scrollbar")[0];
            element.bind("mouseover", function() {
                if (scroll.contentRatio < 1) {
                    scrollbar.className = scrollbar.className.replace(/disable/g, "")
                } else {
                    scroll.update();
                    scrollbar.className = scrollbar.className + " disable"
                }
            });
            element.bind("mouseleave", function() {
                scrollbar.className = scrollbar.className + " disable"
            });
            if (attr.whenScrolledTop) {
                element.bind("move", function() {
                    if (scroll.contentPosition < 50) {
                        var e = element[0].querySelector(".scroll-content");
                        var sh = e.scrollHeight;
                        scope.$apply(attr.whenScrolledTop).then(function() {
                            $timeout(function() {
                                scroll.update(e.scrollHeight - sh)
                            }, 100)
                        })
                    }
                })
            }
            if (attr.notication) {
                element.bind("move", function() {
                    var e = element[0];
                    if (e.scrollTop + e.offsetHeight >= e.scrollHeight) {
                        scope.$apply(attr.whenScrolled)
                    }
                })
            }
        }
    }
});
angular.module("App").directive("youtube", function($timeout, $rootScope) {
    return {
        link: function(scope, element, attrs) {
            var src = "";
            if (attrs.src) src = attrs.src;
            if ($rootScope.isMobile) {
                element.html('<iframe width="1280"                     height="720" src="' + src + '" frameborder="0" allowfullscreen/>')
            } else element.html('<object width="100%" height="100%">                 <param name="movie" value="' + src + '"></param>                 <param name="allowScriptAccess" value="always"></param>                 <param name="allownetworking" value="internal"></param>                 <param name="wmode" value="opaque"></param>                 <embed src="' + src + '" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="100%" height="100%" allownetworking="internal" wmode="opaque"></embed>                 </object>')
        }
    }
});
angular.module("App").directive("shoutv", function($timeout) {
    return {
        link: function(scope, element, attrs) {
            var src = attrs.shoutv;
            element.html('<iframe src="' + src + '/embed" allowfullscreen="true" seamless="seamless" frameborder="0" width="960" height="540"></iframe>')
        }
    }
});
angular.module("App").directive("pasteTxt", function() {
    return {
        restrict: "A",
        link: function(scope, elm, attr) {
            elm.on("paste", function(e) {
                e.preventDefault();
                var text = (e.originalEvent || e).clipboardData.getData("text/plain") || prompt("Paste something..");
                window.document.execCommand("insertText", false, text)
            })
        }
    }
});
angular.module("App").directive("zerocopy", function() {
    return {
        link: function($scope, $element, $attrs) {
            $element.append('<button id="copy-button" data-clipboard-text="' + $scope.link + '" title="Click to copy me.">Copy</button>');
            var client = new ZeroClipboard($element[0].querySelector("#copy-button"));
            client.on("aftercopy", function(event) {
                $scope.success = true
            })
        }
    }
});
angular.module("App").directive("cropLoader", function($window) {
    var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function(item) {
            return angular.isObject(item) && item instanceof $window.File
        },
        isImage: function(file) {
            var type = "|" + file.type.slice(file.type.lastIndexOf("/") + 1) + "|";
            return "|jpg|png|jpeg|bmp|gif|".indexOf(type) !== -1
        }
    };
    return {
        restrict: "A",
        template: '<input type="file"/>',
        scope: {
            options: "=cropLoader"
        },
        link: function(scope, el, attrs) {
            if (!helper.support) return;
            el.bind("change", function(event) {
                var files = event.target.files;
                var file = files[0];
                if (!helper.isFile(file)) return;
                if (!helper.isImage(file)) return;
                var reader = new FileReader;
                var image = new Image;
                reader.onload = function(loadEvent) {
                    if (!scope.$$phase) {
                        scope.file = loadEvent.target.result;
                        image.src = scope.file;
                        image.onload = function() {
                            var w = this.width;
                            var h = this.height;
                            if (scope.options.type == "cover") {
                                if (w < 500 || h < 200) {
                                    alert("Cover at least width 500px and height 200px!");
                                    return false
                                }
                            } else {
                                if (w < 100 || h < 100) {
                                    alert("Avatar at least width 100px and height 100px!");
                                    return false
                                }
                            }
                            var t = file.type;
                            var n = file.name;
                            scope.options.image = scope.file;
                            scope.options.viewShowCropTool = true;
                            scope.options.viewShowRotateBtn = false;
                            if (scope.$root.$$phase != "$apply" && scope.$root.$$phase != "$digest") {
                                scope.$apply()
                            }
                        }
                    }
                };
                reader.readAsDataURL(file)
            })
        }
    }
});
"use strict";
angular.module("App").directive("ngThumb", ["$window", function($window) {
    var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function(item) {
            return angular.isObject(item) && item instanceof $window.File
        },
        isImage: function(file) {
            var type = "|" + file.type.slice(file.type.lastIndexOf("/") + 1) + "|";
            return "|jpg|png|jpeg|bmp|gif|".indexOf(type) !== -1
        }
    };
    return {
        restrict: "A",
        template: "<canvas/>",
        link: function(scope, element, attributes) {
            if (!helper.support) return;
            var params = scope.$eval(attributes.ngThumb);
            if (!helper.isFile(params.file)) return;
            if (!helper.isImage(params.file)) return;
            var canvas = element.find("canvas");
            var reader = new FileReader;
            reader.onload = onLoadFile;
            reader.readAsDataURL(params.file);

            function onLoadFile(event) {
                var img = new Image;
                img.onload = onLoadImage;
                img.src = event.target.result
            }

            function onLoadImage() {
                var width = params.width || this.width / this.height * params.height;
                var height = params.height || this.height / this.width * params.width;
                canvas.attr({
                    width: width,
                    height: height
                });
                canvas[0].getContext("2d").drawImage(this, 0, 0, width, height)
            }
        }
    }
}]);

function sort(arr) {
    var count = arr.length;
    for (var i = 0; i < count - 1; i++) {
        var min = i;
        for (var j = i + 1; j < count; j++) {
            if (arr[j].offset < arr[min].offset) {
                min = j
            }
        }
        var temp = arr[i];
        arr[i] = arr[min];
        arr[min] = temp
    }
    return arr
}
var tagsToReplace = {
    "<": "&lt;",
    ">": "&gt;"
};

function replaceTag(tag) {
    return tagsToReplace[tag] || tag
}

function htmlEncode(html) {
    return html.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}(function() {
    angular.module("App").filter("displayUserWith", displayUserTagFilter);

    function displayUserTagFilter() {
        return function(arrWith) {
            var len = arrWith.length;
            var str = "";
            if (len > 1) {
                for (var j = 0; j < len; j++) {
                    str += "<a href='/user/" + arrWith[j]["userId"] + "'>" + arrWith[j]["fullname"] + "</a> , "
                }
                str = str.substr(0, str.length - 2)
            } else {
                str = "<a href='/user/" + arrWith[0]["userId"] + "'>" + arrWith[0]["fullname"] + "</a>"
            }
            return str
        }
    }
})();
angular.module("App").filter("filterCm", function($sce, parseUrlFilterFilter) {
    return function(content) {
        var text = content.text;
        if (typeof content.tags != "undefined") {
            var tags = sort(content.tags);
            var t = 0;
            var a = [];
            var count = tags.length;
            for (var i = 0; i < count; i++) {
                if (tags[i].type == "peopletag") {
                    var x1 = text.substr(t, tags[i].offset - t);
                    var x2 = text.substr(tags[i].offset, tags[i].length);
                    a.push(parseUrlFilterFilter(htmlEncode(x1), "_blank"));
                    var replace = "";
                    if (typeof tags[i].aliasId != "undefined") {
                        replace = "<a href='/alias/" + tags[i].aliasId + "'>" + x2 + "</a>"
                    } else {
                        replace = "<a href='/user/" + tags[i].userId + "'>" + x2 + "</a>";
                        if (typeof tags[i].username != "undefined") {
                            replace = "<a href='/user/" + tags[i].username + "'>" + x2 + "</a>"
                        }
                    }
                    a.push(replace);
                    t = tags[i].offset + tags[i].length
                } else if (tags[i].type == "hashtag") {
                    var x1 = text.substr(t, tags[i].offset - t);
                    a.push(parseUrlFilterFilter(htmlEncode(x1), "_blank"));
                    var replace = "<a href='/hashtag/" + encodeURIComponent(tags[i].hashtag.substr(1)) + "'>" + tags[i].hashtag + "</a>";
                    a.push(replace);
                    t = tags[i].offset + tags[i].hashtag.length
                }
                if (i == count - 1) {
                    a.push(text.substr(t))
                }
            }
            text = a.join(" ")
        } else {
            text = htmlEncode(text);
            text = parseUrlFilterFilter(text);
            text = text.replace(/\r?\n/g, "<br/>")
        }
        text = text.replace(/\r?\n/g, "<br/>");
        text = text.replace(/(\n|&#10;|&#13;)/g, "<br/>");
        return $sce.trustAsHtml(text)
    }
});
angular.module("App").filter("filterInfo", function($sce) {
    return function(text) {
        var match = text.match(/(https?:\/\/(www\.)?|(www\.))[a-z0-9\-]{3,}(\.[a-z]{2,4}){1,3}[^\s]+/g);
        if (match) {
            for (var i = 0; i < match.length; i++) {
                text = text.replace(match[i], '<a href="' + match[i] + '" target="_blank" class="link-comment">' + match[i] + "</a>")
            }
        }
        text = text.replace(/\r?\n/g, "<br/>");
        text = text.replace(/(\n|&#10;|&#13;)/g, "<br/>");
        return text
    }
});
angular.module("App").filter("filterTxt", function($sce) {
    return function(content) {
        if (typeof content != "undefined") {
            if (typeof content.text != "undefined") {
                var text = content.text;
                if (typeof content.tags != "undefined") {
                    var tags = sort(content.tags);
                    var t = 0;
                    var a = [];
                    var count = tags.length;
                    for (var i = 0; i < count; i++) {
                        if (tags[i].type == "peopletag") {
                            var x1 = text.substr(t, tags[i].offset - t);
                            var x2 = text.substr(tags[i].offset, tags[i].length);
                            a.push(htmlEncode(x1));
                            var replace = "";
                            if (typeof tags[i].aliasId != "undefined") {
                                replace = "<a href='/alias/" + tags[i].aliasId + "'>" + x2 + "</a>"
                            } else {
                                replace = "<a href='/user/" + tags[i].userId + "'>" + x2 + "</a>";
                                if (typeof tags[i].username != "undefined") {
                                    replace = "<a href='/user/" + tags[i].username + "'>" + x2 + "</a>"
                                }
                            }
                            a.push(replace);
                            t = tags[i].offset + tags[i].length
                        } else if (tags[i].type == "hashtag") {
                            var x1 = text.substr(t, tags[i].offset - t);
                            a.push(htmlEncode(x1));
                            var replace = "<a href='/hashtag/" + encodeURIComponent(tags[i].hashtag.substr(1)) + "'>" + tags[i].hashtag + "</a>";
                            a.push(replace);
                            t = tags[i].offset + tags[i].hashtag.length
                        }
                        if (i == count - 1) {
                            a.push(text.substr(t))
                        }
                    }
                    text = a.join(" ")
                } else {
                    text = htmlEncode(text)
                }
                text = text.replace(/(\n|&#10;|&#13;)/g, "<br/>");
                if (typeof content.links != "undefined") {
                    var links = content.links;
                    for (var i = 0; i < links.length; i++) {
                        if (i == 0 && content.linkdata && content.linkdata.site == "youtube") text = text.replace(links[i].link, "");
                        else text = text.replace(links[i].link, "<a  target='_blank' rel='nofollow' href='" + links[i].link + "'>" + links[i].link + "</a>")
                    }
                }
                return $sce.trustAsHtml(text)
            } else {
                return
            }
        } else {
            return
        }
    }
});
angular.module("App").filter("filterTxtShare", function($sce) {
    return function(content) {
        if (content != undefined) {
            if (content.text != undefined) {
                var text = content.text;
                if (content.tags != undefined) {
                    var tags = sort(content.tags);
                    var t = 0;
                    var a = [];
                    var count = tags.length;
                    for (var i = 0; i < count; i++) {
                        if (tags[i].type == "peopletag") {
                            var x1 = text.substr(t, tags[i].offset - t);
                            var x2 = text.substr(tags[i].offset, tags[i].length);
                            a.push(htmlEncode(x1));
                            var replace = "<a href='#!/user/" + tags[i].userId + "'>" + x2 + "</a>";
                            a.push(replace);
                            t = tags[i].offset + tags[i].length
                        } else if (tags[i].type == "hashtag") {
                            var x1 = text.substr(t, tags[i].offset - t);
                            a.push(htmlEncode(x1));
                            var replace = "<a href='#!/hashtag/" + encodeURIComponent(tags[i].hashtag.substr(1)) + "'>" + tags[i].hashtag + "</a>";
                            a.push(replace);
                            t = tags[i].offset + tags[i].hashtag.length
                        }
                        if (i == count - 1) {
                            a.push(text.substr(t))
                        }
                    }
                    text = a.join(" ")
                } else {
                    text = htmlEncode(text)
                }
                text = text.replace(/\r?\n/g, "<br />");
                if (typeof content.links != "undefined") {
                    var links = content.links;
                    for (var i = 0; i < links.length; i++) {
                        text = text.replace(links[i].link, "<a  target='_blank' href='" + links[i].link + "'>" + links[i].link + "</a>")
                    }
                }
                var subtext = text.substr(0, 400);
                if (subtext != text) {
                    subtext += " ..."
                }
                return $sce.trustAsHtml(subtext)
            } else {
                return
            }
        } else {
            return
        }
    }
});
angular.module("App").filter("html", function($sce) {
    return function(text) {
        text = text.replace(/\r?\n/g, "<br />");
        return $sce.trustAsHtml(text)
    }
});
angular.module("App").filter("emoji", ["$filter", "$sce", function($filter, $sce) {
    return function(input) {
        if (!input) {
            return input
        }
        if (input.toLowerCase() == "(v)") {
            return '<img alt="(v)" src="/img/like.png" />'
        }
        input = emojione.toImage(input);
        return input
    }
}]);
angular.module("App").filter("parseUrlFilter", function() {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
    return function(text, target) {
        return text.replace(urlPattern, '<a target="' + target + '" href="$&">$&</a>')
    }
});
angular.module("App").filter("tipUrlFilter", function() {
    var urlPattern = /<a (.*)>(.*)<\/a>/gi;
    return function(text, target) {
        return text.replace(urlPattern, '<a rel="nofollow" target="' + target + '" $1>$2</a>')
    }
});
angular.module("App").filter("filterTxtPost", function($sce, parseUrlFilterFilter) {
    return function(text) {
        text = text.replace(/\r?\n/g, "<br />");
        text = parseUrlFilterFilter(text);
        return $sce.trustAsHtml(text)
    }
});
angular.module("App").filter("words", function() {
    return function(input, words) {
        if (isNaN(words)) {
            return input
        }
        if (words <= 0) {
            return ""
        }
        if (input) {
            var inputWords = input.split(/\s+/);
            if (inputWords.length > words) {
                input = inputWords.slice(0, words).join(" ") + "…"
            }
        }
        return input
    }
});
angular.module("App").filter("filterHtml", ["$sce", "tipUrlFilterFilter", function($sce, tipUrlFilterFilter) {
    return function(html) {
        if (!html) return false;
        html = tipUrlFilterFilter(html, "_blank");
        return $sce.trustAsHtml(html)
    }
}]);
angular.module("App").filter("trustYoutubeEmbed", ["$sce", "$rootScope", function($sce, $rootScope) {
    return function(url, autoplay) {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if (match && match[2].length == 11) {
            if ($rootScope.isMobile) return $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + match[2] + "?autohide=1&modestbranding=1&vq=hd720" + (autoplay ? "&autoplay=1" : ""));
            return $sce.trustAsResourceUrl("https://youtube.com/v/" + match[2] + "?autohide=1&version=3&modestbranding=1&vq=hd720" + (autoplay ? "&autoplay=1" : ""))
        }
        return false
    }
}]);
angular.module("App").filter("escapeHtml", function() {
    return function(input) {
        if (!input) return input;
        return he.escape(input)
    }
});
angular.module("App").filter("breakLine", function() {
    return function(input) {
        return input.replace(/\r?\n/g, "<br/>")
    }
});
angular.module("App").filter("unescapeHtml", function() {
    return function(input) {
        return he.unescape(input)
    }
});