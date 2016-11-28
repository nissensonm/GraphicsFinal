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
        ),

        // TODO
        mazeStart = new StarRenderable(drawMgr.getCircleShader()),
        mazeFinish = new StarRenderable(drawMgr.getCircleShader()),
        player = {
            Character: undefined,
            Xform: undefined,
            Moving: undefined,
            Speed: 0.2,
            move: function (x, y) {
                var pos = this.Character.getXform().getPosition();
                this.Xform.setPosition(pos[0] + x, pos[1] + y);
            }
        };

    $scope.rotationSnap = 1;
    $scope.drawMgr = drawMgr;

    // Fired by redrawUpdateTimer. Controller-side update logic goes here.
    function update() {
        if (requestCanvasDraw) {
            requestCanvasDraw = false; // Reset the flag
            drawMgr.drawShapes(mainView);
            mazeStart.draw(mainView);
            mazeFinish.draw(mainView);
            manipulator.draw(mainView);
            if ($scope.runMode) {
                if (player.Moving !== undefined) {
                    console.log(player.Moving);
                    // Oh so hacky :)
                    if (player.Moving === "Right") {
                        player.move(player.Speed, 0);
                    } else if (player.Moving === "Left") {
                        player.move(-1 * player.Speed, 0);
                    } else if (player.Moving === "Down") {
                        player.move(0, -1 * player.Speed);
                    } else if (player.Moving === "Up") {
                        player.move(0, player.Speed);
                    } else {
                        console.log("WHAT THE!? " + player.Moving);
                    }
                }
                
                player.Character.draw(mainView);
                
                if (player.Character.getXform().Contains(mazeFinish.getXform().getPosition())) {
                    // Player won. End the round.
                    $scope.runMode = false;
                }
            }
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
    
    $scope.toggleRunMode = function () {
        if ($scope.runMode) {
            // Turn on run mode
            var tPos = mazeStart.getXform().getPosition();
            // Move the player to the maze entrance
            player.Character.getXform().setPosition(tPos[0], tPos[1]);
        } else {
            // Turn off run mode
        }
    };

    $scope.onClientButtonPress = function($event) {
        if ($event.keyCode === 119){
            // W
            if ($scope.runMode) {
                player.Moving = "Up";
            } else {
                // Check if the manipulator was set. If it was, draw child near it.
                if (manipulator.isManipulatorSet()) {
                    $scope.drawChildNearParentWall(0, 0.50);
                }
            }
        }
        else if ($event.keyCode === 97){
            // A
            if ($scope.runMode) {
                player.Moving = "Left";
            } else {
                if (manipulator.isManipulatorSet()) {
                    $scope.drawChildNearParentWall(-0.50, 0);
                }
            }
        }
        else if ($event.keyCode === 115){
            // S
            if ($scope.runMode) {
                player.Moving = "Down";
            } else {
                if (manipulator.isManipulatorSet()) {
                    $scope.drawChildNearParentWall(0, -0.5);
                }
            }
            
        }
        else if ($event.keyCode === 100){
            // D
            if ($scope.runMode) {
                player.Moving = "Right";
            } else {
                if (manipulator.isManipulatorSet()) {
                    $scope.drawChildNearParentWall(0.50, 0);
                }
            }
        }
    };
    
    $scope.onClientKeyUp = function ($event) {
        
        // W = 119, A = 97, S = 115, D = 100
        if ($scope.runMode &&
            ($event.which === 97 || $event.which === 100 ||
            $event.which === 115 || $event.which === 119)) {
            // Clear moving state
            console.log("CLEARED MOVE STATE ==========================");
            player.Moving = undefined;
        }
        else if ($event.keyCode === 101){
            // E, for erase.
            if (manipulator.isManipulatorSet())
                $scope.deleteSelectedObject();
        }
    };
    
    // Draws a new wall based on the delta passed in from the manipulator's target.
    $scope.drawChildNearParentWall = function(xDelta, yDelta) {
        // Get manipulator's current position.
        var position = manipulator.getParentPosition();
        // Adjust position with delta.
        var position = [position[0] + xDelta, position[1] + yDelta];
        //console.log("Piv: " + position[0] + ", " + position[1]);
        
        // Create new wall, have manipulator pass it to its parent and add it.
        var newWall = new MazePiece(drawMgr.getSquareShader(), "newWallChild", position[0], position[1]);
        manipulator.addNewBlockAsChild(newWall);

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
    
    // Set up demo hierarchy
    var piece = new MazePiece(drawMgr.getSquareShader(), "zeroGen", 0, -5);
    drawMgr.addSceneNode(piece);
    var kid = new MazePiece(drawMgr.getSquareShader(), "firstGen", 1, -3);
    piece.addAsChild(kid);
    var grandkid = new MazePiece(drawMgr.getSquareShader(), "secondGen", 2, -4);
    kid.addAsChild(grandkid);
    manipulator.setParent(piece);
    
    // Build character
    player.Character = new Wizard(drawMgr.getSquareShader(), "A Powerful Wizard", 0, 0);
    player.Xform = player.Character.getXform();
    drawMgr.addSceneNode(player.Character);
    var star = new Star(drawMgr.getCircleShader(), "star", -.5, 0);
    player.Character.addAsChild(star);
    star = new Star(drawMgr.getCircleShader(), "star", .5, 0);
    player.Character.addAsChild(star);
    star = new Star(drawMgr.getCircleShader(), "star", -.35, 1);
    player.Character.addAsChild(star);
    star = new Star(drawMgr.getCircleShader(), "star", .35, 1);
    player.Character.addAsChild(star);
    star = new Star(drawMgr.getCircleShader(), "star", 0, 1.25);
    player.Character.addAsChild(star);
    
    mazeStart.setColor([1, 1, 1, 1]);
    mazeStart.getXform().setPosition(-8, 4);
    mazeFinish.setColor([0.1, 0.9, 0.1 ,1]);
    mazeFinish.getXform().setPosition(8, -4);
    
    // Kick off update loop with initial FPS goal
    redrawUpdateTimer = $interval(update, 1000 / $scope.fpsGoal);
    requestCanvasDraw = true;
}]);