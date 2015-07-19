// main.factory('testFactory', function(){
//     var sayHello = function(text){
//         return "Factory says \"Hello " + text + "\"";
//     };
//     console.log(sayHello);
//     return {
//         sayHello: sayHello,
//         sayGoodbye: function(text){
//             return "Factory says \"Goodbye " + text + "\"";
//         }  
//     }               
// });
main.registerFtr('testFactory', function(){
    alert('hihi');
    var sayHello = function(text){
        return "Factory says \"Hello " + text + "\"";
    };
    console.log(sayHello);
    return {
        sayHello: sayHello,
        sayGoodbye: function(text){
            return "Factory says \"Goodbye " + text + "\"";
        }  
    }               
});
// main.factory('testFactory', ['$scope', function($scope){
//     return {
//         sayHello: function(text){
//             return "Factory says \"Hello " + text + "\"";
//         },
//         sayGoodbye: function(text){
//             return "Factory says \"Goodbye " + text + "\"";
//         }  
//     }
// }])
// .controller('P1Ctrl', ['testFactory', function (testFactory) {
//     $scope.fromFactory = testFactory.sayHello("World");
//     alert($scope.fromFactory);
// }]);