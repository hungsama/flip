Directive AngularJs with CKEditor
====================

## Bower

You can install it with Bower, just run this command :

```
bower install ckeditor-angularjs --save
```

##How to use it

Put this in your html file :

```html
<textarea ckeditor="option" ng-model="your name model"></textarea>
```

You have to add this line too :

```html
<script src="../bower_components/jquery/jquery.min.js"></script>
<script src="../bower_components/angular/angular.js"></script>
<script src="../bower_components/ckeditor/ckeditor.js"></script>
<script src="../src/ckeditor-angularjs.js"></script>
```

##Option CKEditor

You can set the options of CKeditor (here in $scope.option). Please refer you to the CKeditor Website for the option.

```js
/** Dependency (name of the directive) */
var app = angular.module('app', ['ngCke']);

/** Option CKEditor */
$scope.option = {
    language: 'fr'
};
```