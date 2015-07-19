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
main.registerCtrl('P1Ctrl', function($scope, $rootScope, testFactory)
{
   $scope.content = 'vao 1'; 
   $scope.fromFactory = testFactory.sayHello("World");
   console.log($scope.fromFactory);
});