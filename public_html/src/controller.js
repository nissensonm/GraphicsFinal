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
    
    $scope.canvasMouse = new CanvasMouseSupport('GLCanvas');
    $scope.CANVAS_SIZE = [800, 600];
    $scope.fpsGoal = 120;
    
    $scope.collision = undefined;
    
    $scope.rotationSnap = false;

    // Potentially saves on canvas redraws by limiting the number of redraws
    // per second, where the update interval is determined by the constant
    // number FPS_GOAL (i.e. the number of times per second to update, ideally)
    var redrawUpdateTimer, // Will hold a promise to an $interval() function
        drawMgr = new DrawManager("GLCanvas"),
        requestCanvasDraw = false, // This flag decides whether or not we trigger a canvas redraw in the update loop
        dragging = "",
        dragStart = [0, 0],
        dragTargetXform,
        wcMPos = [0, 0],
        clientX = 0,
        clientY = 0,
        canvasX = 0,
        canvasY = 0,
        manipulator = new RenderableManipulator(undefined, "manipulator", drawMgr.getSquareShader()),
        mainView = new Camera(
            [0, 0], // wc Center
            15, // wc Wdith
            [0, 0, $scope.CANVAS_SIZE[0], $scope.CANVAS_SIZE[1]]   // viewport: left, bottom, width, height
        );

    $scope.drawMgr = drawMgr;

    // Fired by redrawUpdateTimer. Controller-side update logic goes here.
    function update() {
        if (requestCanvasDraw) {
            requestCanvasDraw = false; // Reset the flag
            drawMgr.drawShapes(mainView);
            manipulator.draw(mainView);
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
            // Returns a non-0 value if a collision occured with the mouse.
            var collisionSceneNode = drawMgr.checkCollision(mainView.mouseWCX($scope.canvasMouse.getPixelXPos($event)) + 0.3, 
                mainView.mouseWCY($scope.canvasMouse.getPixelYPos($event)) + 0.4);

            // If collisionSceneNode !== 0, then the scene node was returned.
            // If it is 0 then no collision occured.
            if (collisionSceneNode !== 0)
            {
                // Do something with the returned XForm or object: 
                // var sceneXForm = collisionSceneNode.sceneNode.getXform();
                // var wallXForm = collisionSceneNode.wallObject.getXform();
                // TODO: Need to be able to check collision on manipulator as well
                if (collisionSceneNode.sceneNode.getName() === "manipulator") {
                    dragging = collisionSceneNode.handleType;
                    dragTargetXform = collisionSceneNode.sceneNode.getXform();
                } else {
                    manipulator.setParent(collisionSceneNode.sceneNode);
                }
            } else {
                // No object is selected
                manipulator.setParent(undefined);
            }
            break;
        case 3: // handle RMB
            break;
        default:
            console.log("Unsupported key/button received: " + $event.which);
        }
    };

    $scope.onClientMouseUp = function () {
        // If not dragging anything
        if (dragging === undefined) {

        } else { // Something was being dragged
            dragging = "";
        }
    };

    $scope.onClientMouseMove = function ($event) {
        // Update mouse position data
        // TODO: What of these do we need to keep?
        clientX = $event.pageX;
        clientY = $event.pageY;
        canvasX = $scope.canvasMouse.getPixelXPos($event);
        canvasY = $scope.canvasMouse.getPixelYPos($event);
        wcMPos = [mainView.mouseWCX($scope.canvasX), mainView.mouseWCY($scope.canvasY)];

        // Now process the actual input
        switch ($event.which) {
        case 1: // left
            var mDelta = [wcMPos[0] - dragStart[0], wcMPos[1] - dragStart[1]];
            if (dragging === "Scale") {
                manipulator.scaleParent(mDelta[0], mDelta[1]);
            } else if (dragging === "Move") {
                manipulator.moveParentBy(mDelta[0], mDelta[1]);
            } else if (dragging === "Rotate") {
                var center = dragTargetXform.getPivot(),
                    fromCenter = [wcMPos[0] - center[0], wcMPos[1] - center[1]],
                    angle = dragTargetXform.getRotationInRad() - Math.atan(fromCenter[1] / fromCenter[0]); // sin / cos

                if ($scope.rotationSnap) {
                    var quarter = Math.PI / 2;
                    angle = Math.round(angle / quarter) * quarter; // round to nearest 90 degree angle, in radians
                } else {
                    manipulator.rotateParent(dragTargetXform.getRotationInRad() + angle);
                }
            }
            requestCanvasDraw = true;
            break;
        }
    };

    // Make sure canvas mouse position calculations are accurate after scrolling
    $(document).scroll(function () {
        $scope.canvasMouse.refreshBounds();
    });

    // Wait a bit for the page to load and then update the canvas mouse bounds.
    // This fixes the issue where placed shapes don't always match the cursor position.
    setTimeout(function () {
        $scope.canvasMouse.refreshBounds();
    }, 500);
    
    // Set up hierarchy
    var piece = new MazePiece(drawMgr.getSquareShader(), "zeroGen", 0, -5);
    drawMgr.addSceneNode(piece);
    var kid = new MazePiece(drawMgr.getSquareShader(), "firstGen", 1, -3);
    piece.addAsChild(kid);
    var grandkid = new MazePiece(drawMgr.getSquareShader(), "secondGen", 2, -4);
    kid.addAsChild(grandkid);
    manipulator.setParent(piece);
    requestCanvasDraw = true;
    
    // Kick off update loop with initial FPS goal
    redrawUpdateTimer = $interval(update, 1000 / $scope.fpsGoal);
    requestCanvasDraw = true;
}]);