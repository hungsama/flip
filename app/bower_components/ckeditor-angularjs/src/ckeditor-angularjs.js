/**
 * Created by shini on 03/03/2015.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) define(['angular'], factory);
    else factory(angular);
}(angular || null, function (angular) {
    var app = angular.module('ngCke', []);

    app.directive('ckeditor', ['$timeout', '$q', function ($timeout, $q) {
        return {
            restrict: 'A',
            require: [
                'ngModel',
                '^?form'
            ],
            link: function ($scope, element, attrs, ctrls) {
                var form = ctrls[1] || null;
                var ready = false;
                var data = [];
                var editor;

                if (element[0].tagName.toLowerCase() != 'textarea') {
                    element.attr('contenteditable', true);
                }

                var initCKEditor = function () {
                    /** Stock option of the editor */
                    var addToolbar = {};

                    /** Add the option in the object defined in your controller */
                    addToolbar = angular.extend(addToolbar, $scope[attrs.ckeditor]);

                    /** Set the element (Object) */
                    if (element[0].tagName.toLowerCase() == 'textarea')
                        editor = CKEDITOR.replace(element[0], addToolbar);
                    else
                        editor = CKEDITOR.inline(element[0], addToolbar);

                    /** Update a model in time (Better view) */
                    var setModel = function (dataArray) {
                        var data = editor.getData();
                        if (data == '') data = null;

                        /** Set or reset the form given */
                        var updateModel = function () {
                            if (!dataArray || data != ctrls[0].$viewValue)
                                ctrls[0].$setViewValue(data); // Set
                            else if (dataArray && form)
                                form.$setPristine(); // Reset
                        };
                        $timeout(updateModel, 0);
                    };

                    /** Update each data in the form */
                    var updateModel = function (dataArray) {
                        if (!data.length) {
                            return;
                        }
                        var item = data.pop() || '';
                        editor.setData(item, function () {
                            setModel(dataArray);
                            ready = true;
                        });
                    };

                    /** Set all changes done in the editor in a real time */
                    var setInstance = function () {

                        /** Add your state change if you want more here */
                        var instanceChange = [
                            'pasteState',
                            'change',
                            'blur',
                            'key'
                        ];
                        for (var i = 0; i < instanceChange.length; i++)
                            editor.on(instanceChange[i], setModel);

                        editor.on('instanceReady', function () {
                            $scope.$broadcast('ckeditor.ready');
                            $scope.$apply(function () {
                                updateModel(true);
                            });
                            editor.document.on('keyup', setModel);
                        });
                        editor.on('customConfigload', function () {
                            $q.defer().resolve();
                        });

                    };
                    setInstance();

                    ctrls[0].$render = function () {
                        data.push(ctrls[0].$viewValue);
                        if (ready)
                            updateModel();
                    };
                };
                /**
                 * Launch the editor
                 *
                 * Main function
                 */
                initCKEditor()
            }
        };
    }]);

    /**
     * Load the editor and print it in the view
     *
     * Retry it if the loading failed
     */
    app.run(['$q', '$timeout', function ($q, $timeout) {
        var $defered = $q.defer();

        if (angular.isUndefined(CKEDITOR)) {
            throw new Error('The editor is not found');
        }
        CKEDITOR.disableAutoInline = false;
        function isLoading() {
            if (CKEDITOR.status == 'loaded') {
                $defered.resolve();
                CKEDITOR.on('load', isLoading);
            } else
                isLoading();
        }

        $timeout(isLoading, 50);
    }]);
    return app;
}));