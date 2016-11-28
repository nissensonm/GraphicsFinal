/*global DrawManager: false, CollisionHelper: false, CanvasMouseSupport: false, Camera: false, setTimeout: false*/
/*global document, $, angular, console, alert, RenderableManipulator*/
/* jslint node: true, vars: true, nomen: true */

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

    $scope.moveSnap = 0.25;
    $scope.rotationSnap = 1;

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
        manipulator = new RenderableManipulator(undefined, "manipulator", drawMgr.getSquareShader()),
        mainView = new Camera(
            [0, 0], // wc Center
            15, // wc Wdith
            [0, 0, $scope.CANVAS_SIZE[0], $scope.CANVAS_SIZE[1]]   // viewport: left, bottom, width, height
        );

    $scope.rotationSnap = 1;
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

    $scope.deleteSelectedObject = function() {
        drawMgr.deleteScene(manipulator.getParent());
        manipulator.setParent(undefined);
        requestCanvasDraw = true;
    };

    // Handle client mouse clicks and send to model
    $scope.onClientMouseClick = function ($event) {
        switch ($event.which) {
        case 1: // handle LMB
            dragStart[0] = mainView.mouseWCX($scope.canvasMouse.getPixelXPos($event));
            dragStart[1] = mainView.mouseWCY($scope.canvasMouse.getPixelYPos($event));
            requestCanvasDraw = true;
            // Returns a non-0 value if a collision occured with the mouse.            
            var collisionSceneNode = drawMgr.checkCollision(mainView.mouseWCX($scope.canvasMouse.getPixelXPos($event)),
                mainView.mouseWCY($scope.canvasMouse.getPixelYPos($event)), manipulator);


            // If collisionSceneNode !== 0, then the scene node was returned.
            // If it is 0 then no collision occured.
            if (collisionSceneNode !== 0) {
                // Do something with the returned XForm or object: 
                // var sceneXForm = collisionSceneNode.sceneNode.getXform();
                // var wallXForm = collisionSceneNode.wallObject.getXform();
                if (collisionSceneNode.sceneNode.getName() === "manipulator") {
                    dragging = collisionSceneNode.handleType;
                    dragTargetXform = collisionSceneNode.sceneNode.getXform();
                } else {
                    manipulator.setOtherParents(collisionSceneNode.wallMat);
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
        // Something was being dragged
        if (dragging !== undefined) {
            dragging = undefined;
        } //else { // Something was being dragged
        //}
    };

    $scope.onClientMouseMove = function ($event) {
        // Update mouse position data
        wcMPos = [mainView.mouseWCX($scope.canvasMouse.getPixelXPos($event)), mainView.mouseWCY($scope.canvasMouse.getPixelYPos($event))];

        // Now process the actual input
        switch ($event.which) {
        case 1: // left
            try {
            var mDelta = [wcMPos[0] - dragStart[0], wcMPos[1] - dragStart[1]],
                pivot =  dragTargetXform.getPivot();
                
            if (dragging === "Scale") {
                    // scale down by 1000 to make it feel smoother.
                    mDelta[0] = mDelta[0] / 1000;
                    //mDelta[1] = mDelta[1] / 1000;
                manipulator.scaleParentWidth(mDelta[0]);
            } else if (dragging === "Move") {
                // Movement is relative to the pivot, but the translation won't be the same WC position...
                manipulator.moveParent(
                    Math.round((wcMPos[0] - pivot[0]) / $scope.moveSnap) * $scope.moveSnap,
                    Math.round((wcMPos[1] - pivot[1]) / $scope.moveSnap) * $scope.moveSnap
                    );
            } else if (dragging === "Rotate") {
                // pivot is the point to rotate about
                // calculate distance in x and y from the pivot point
                var fromCenter = [wcMPos[0] - pivot[0], wcMPos[1] - pivot[1]],
                    // Compute the angle of the triangle made from the two sides on the last line
                    angle = Math.atan(fromCenter[1] / fromCenter[0]) - Math.PI; // sin / cos

                // Domain of arctan is ( -PI/2, PI/2 ), only half of a circle...
                if (fromCenter[0] >= 0) {
                    angle -= Math.PI;
                }

                // Fix angle offset
                angle -= Math.PI / 2;

                if ($scope.rotationSnap) {
                    var snap = parseInt($scope.rotationSnap) * Math.PI / 180;
                    angle = Math.round(angle / snap) * snap; // round to nearest 90 degree angle, in radians
                }
                manipulator.rotateParent(angle);

            }
            requestCanvasDraw = true;
            break;
        }
            catch(err) {}
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
    
    var aWizard = new Wizard(drawMgr.getSquareShader(), "A Powerful Wizard", 0, 0);
    drawMgr.addSceneNode(aWizard);
    var star = new Star(drawMgr.getCircleShader(), "star", -.5, 0);
    aWizard.addAsChild(star);
    
    // Kick off update loop with initial FPS goal
    redrawUpdateTimer = $interval(update, 1000 / $scope.fpsGoal);
    requestCanvasDraw = true;
}]);