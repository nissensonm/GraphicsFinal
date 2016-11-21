/*global DrawManager: false, CollisionHelper: false, CanvasMouseSupport: false, Camera: false, setTimeout: false*/
/*global document, $, angular, console, alert*/
/* jslint node: true, vars: true */

var module = angular.module('mp5', []);

// From error fix example at http://docs.angularjs.org/error/ngModel/numfmt?p0=0
module.directive('stringToNumber', function () {
    'use strict';
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (value) {
                return '' + value;
            });
            ngModel.$formatters.push(function (value) {
                return parseFloat(value);
            });
        }
    };
});

module.controller('mp5Controller', ["$scope", "$interval", function ($scope, $interval) {
    'use strict';
    // Potentially saves on canvas redraws by limiting the number of redraws
    // per second, where the update interval is determined by the constant
    // number FPS_GOAL (i.e. the number of times per second to update, ideally)
    var redrawUpdateTimer, // Will hold a promise to an $interval() function
        drawMgr = new DrawManager("GLCanvas"),
        requestCanvasDraw = false, // This flag decides whether or not we trigger a canvas redraw in the update loop
        dragging = "",
        wcMPos = [0, 0],
        mainView = new Camera(
            [0, 0], // wc Center
            200, // wc Wdith
            [0, 0, $scope.CANVAS_SIZE[0], $scope.CANVAS_SIZE[1]]   // viewport: left, bottom, width, height
        );

    $scope.drawMgr = drawMgr;
    $scope.canvasMouse = new CanvasMouseSupport('GLCanvas');

    $scope.CANVAS_SIZE = [800, 600];

    $scope.fpsGoal = 120;

    // Fired by redrawUpdateTimer. Controller-side update logic goes here.
    function update() {
        if (requestCanvasDraw) {
            requestCanvasDraw = false; // Reset the flag
            drawMgr.drawShapes(mainView);
        }
    }

    // Utility to round 'num' to 'decimals' places
    function round(num, decimals) {
        var shift = Math.pow(10, decimals);
        return Math.round(num * shift) / shift;
    }

    // These utilities convert device coordinates (px) to WC
    function dcToWc(canvasSize, dc, camera) {
        return [dc[0] / canvasSize[0] * camera.getWCWidth(), dc[1] / canvasSize[1] * camera.getWCHeight()];
    }
    function dcXToWcX(canvasWidth, dc, camera) {
        return dc / canvasWidth * camera.getWCWidth();
    }
    function dcYToWcY(canvasHeight, dc, camera) {
        return dc / canvasHeight * camera.getWCHeight();
    }

    // Handle client mouse clicks and send to model
    $scope.onClientMouseClick = function ($event) {
        switch ($event.which) {
        case 1: // handle LMB
            requestCanvasDraw = true;
            break;
        case 3: // handle RMB
            break;
        default:
            console.log("Unsupported key/button received: " + $event.which);
        }
    };

    $scope.onClientMouseUp = function () {
        if (dragging === "") {

        } else {
            dragging = "";
        }
    };

    $scope.onClientMouseMove = function ($event) {
        // Update mouse position data
        var cam = mainView;
        // TODO: What of these do we need to keep?
        $scope.targetCam = "Main";
        $scope.clientX = $event.pageX;
        $scope.clientY = $event.pageY;
        $scope.canvasX = $scope.canvasMouse.getPixelXPos($event);
        $scope.canvasY = $scope.canvasMouse.getPixelYPos($event);
        $scope.camX = round(cam.mouseWCX($scope.canvasX), 3);
        $scope.camY = round(cam.mouseWCY($scope.canvasY), 3);
        wcMPos = [mainView.mouseWCX($scope.canvasX), mainView.mouseWCY($scope.canvasY)];

        // Now process the actual input
        switch ($event.which) {
        case 1: // left
            requestCanvasDraw = true;
            break;
        }
    };

    // Make sure canvas mouse position calculations are accurate after scrolling
    $(document).scroll(function () {
        $scope.canvasMouse.refreshBounds();
    });

    // Kick off update loop with initial FPS goal
    redrawUpdateTimer = $interval(update, 1000 / $scope.fpsGoal);
    requestCanvasDraw = true;

    // Wait a bit for the page to load and then update the canvas mouse bounds.
    // This fixes the issue where placed shapes don't always match the cursor position.
    setTimeout(function () {
        $scope.canvasMouse.refreshBounds();
    }, 500);
}]);