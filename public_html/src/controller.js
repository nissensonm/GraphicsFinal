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

    $scope.moveSnap = 0.5;
    $scope.rotationSnap = 1;
    $scope.drawMgr = drawMgr;
    $scope.runMode = false;
    $scope.paused = true;
    $scope.hint = false;
    $scope.hintsRemaining = 3;
    $scope.hintTime = 0;

    $scope.elapsedTime = -1;
    $scope.actualTime = -1;
    $scope.fastestTime = -1;
    $scope.timesWon = 0;
    var lastUpdate = 0;

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
            15, // wc Width
            [0, 0, $scope.CANVAS_SIZE[0], $scope.CANVAS_SIZE[1]]   // viewport: left, bottom, width, height
        ),
        hintView = new Camera(
            [0, 0], // wc Center
            15, // wc Width
            [$scope.CANVAS_SIZE[0] * 0.75, $scope.CANVAS_SIZE[1] * 0.75, 
             $scope.CANVAS_SIZE[0] * 0.25, $scope.CANVAS_SIZE[1] * 0.25]   // viewport: left, bottom, width, height
        ),
        hintViewBox = new SquareArea( // shader pos size thiccness
            drawMgr.getSquareShader(),
            [$scope.CANVAS_SIZE[0] * 0.75, $scope.CANVAS_SIZE[1] * 0.75],
            [$scope.CANVAS_SIZE[0] * 0.25, $scope.CANVAS_SIZE[1] * 0.25],
            0.25
        ),

        mazeStart = new StarRenderable(drawMgr.getCircleShader()),
        mazeFinish = new StarRenderable(drawMgr.getCircleShader()),
        player = {
            Character: undefined,
            Xform: undefined,
            Moving: undefined,
            Speed: 0.02,
            move: function (x, y) {
                var pos = this.Character.getXform().getPosition();
                // Check if collision is occuring. If anything other than 0 is returned, a collision occured.
                if (drawMgr.checkCollision(pos[0] + x, pos[1] + y, manipulator) === 0)
                    this.Xform.setPosition(pos[0] + x, pos[1] + y);
            }
        },
        
        startTime = 0; // time the player started the maze

    // Fired by redrawUpdateTimer. Controller-side update logic goes here.
    function update() {
        var delta = Date.now() - lastUpdate;
        lastUpdate = Date.now();

        if ($scope.runMode) {
            var ppos = player.Xform.getPosition();
            mainView.setWCCenter(ppos[0], ppos[1]);
            
            if (!$scope.paused) {
                $scope.actualTime += delta / 1000;
                $scope.elapsedTime = Math.round($scope.actualTime); // floating point bad
                // 3 seconds of hint time per hint
                if ($scope.hint && Date.now() - $scope.hintTime > 3000) {
                    $scope.hint = false;
                    $scope.hintTime = 0;
                }

                if (player.Moving !== undefined) {
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

                if (player.Character.getXform().Contains(mazeFinish.getXform().getPosition())) {
                    // Player won. End the round.
                    $scope.retry();
                    if ($scope.actualTime < $scope.fastestTime) {
                        $scope.fastestTime = $scope.actualTime;
                    }
                    $scope.timesWon++;
                }
            }
            requestCanvasDraw = true;
        }
    }

    // Fired by redrawUpdateTimer. Controller-side draw logic goes here.
    // Only does anything if requestCanvasDraw flag is set to true, indicating
    // the next frame needs to be redrawn.
    function draw() {
        if (!requestCanvasDraw) {
            return;
        }
        requestCanvasDraw = false; // clear flag
        
        drawMgr.drawShapes(mainView);
        mazeStart.draw(mainView);
        mazeFinish.draw(mainView);
        
        if ($scope.runMode && !$scope.paused) {
            player.Character.draw(mainView);
            // Draw maze to the hint view
            if ($scope.hint) {
                drawMgr.drawShapes(hintView);
                mazeStart.draw(hintView);
                mazeFinish.draw(hintView);
                hintViewBox.draw(mainView);
            }
        } else {
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

        
/*   Camera.prototype.getWCCenter = function () { return this.mWCCenter; };
Camera.prototype.setWCWidth = function (width) { this.mWCWidth = width; };
Camera.prototype.getWCWidth = function () { return parseInt(this.mWCWidth); };
Camera.prototype.getWCHeight = function () { return this.getWCWidth() * this.mViewport[3] / this.mViewport[2]; };*/
        
//    $scope.addNewSceneNode(Math.round(dragStart[0] / $scope.moveSnap) * $scope.moveSnap, 
//                                       Math.round(dragStart[1] / $scope.moveSnap) * $scope.moveSnap);
       
    // Used to find the snapped value.
    $scope.getSnappedValue = function(val){
        return Math.round(val / $scope.moveSnap) * $scope.moveSnap;
    };
    
    // Draw the borders around the map.
    $scope.createBorders = function(){
        var center = mainView.getWCCenter();
        var height = mainView.getWCHeight();
        var width = mainView.getWCWidth();
        console.log("C / W / H: " + center + " " + width + " " + height);
        var bottomLeftCorner = [$scope.getSnappedValue(center[0] - (width / 2)), 
                                $scope.getSnappedValue(center[1] - (height / 2))];
        var bottomRightCorner = [$scope.getSnappedValue(center[0] + (width / 2)), 
                                $scope.getSnappedValue(center[1] - (height / 2))];
        var topRightCorner = [$scope.getSnappedValue(center[0] + (width / 2)), 
                                $scope.getSnappedValue(center[1] + (height / 2))];
        var topLeftCorner = [$scope.getSnappedValue(center[0] - (width / 2)), 
                                $scope.getSnappedValue(center[1] + (height / 2))];

        $scope.addNewSceneNode(bottomLeftCorner[0], bottomLeftCorner[1], "doNotDelete");
        $scope.addNewSceneNode(bottomRightCorner[0], bottomRightCorner[1], "doNotDelete");
        $scope.addNewSceneNode(topLeftCorner[0], topLeftCorner[1], "doNotDelete");
        $scope.addNewSceneNode(topRightCorner[0], topRightCorner[1], "doNotDelete");
        
        // Draw walls from corner to corner. 
        while (bottomLeftCorner[0] < bottomRightCorner[0])
            $scope.addNewSceneNode(bottomLeftCorner[0] += $scope.moveSnap, bottomLeftCorner[1], "doNotDelete");
        while (bottomRightCorner[1] < topRightCorner[1])
            $scope.addNewSceneNode(bottomRightCorner[0], bottomRightCorner[1] += $scope.moveSnap, "doNotDelete");
        while (topRightCorner[0] > topLeftCorner[0])
            $scope.addNewSceneNode(topRightCorner[0] -= $scope.moveSnap, topRightCorner[1], "doNotDelete");
        while (topLeftCorner[1] > bottomLeftCorner[1])
            $scope.addNewSceneNode(topLeftCorner[0], topLeftCorner[1] -= $scope.moveSnap, "doNotDelete");
        //console.log(bottomLeftCorner[0] + " " + bottomLeftCorner[1]);
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
        
        return newWall;
    };

    // Add a new top-level scene node at the coordinates provided.
    $scope.addNewSceneNode = function(xPos, yPos, name){
        // Name is an optional parameter. If it wasn't passed in, set it to zeroGen.
        name = name || "zeroGen";
        // Create new maze piece and add it to the scene node list.
        var piece = new MazePiece(drawMgr.getSquareShader(), name, xPos, yPos);
        drawMgr.addSceneNode(piece);
        requestCanvasDraw = true;
    };

    // Delete the object selected by the manipulator.
    $scope.deleteSelectedObject = function() {
        drawMgr.deleteScene(manipulator.getParent());
        manipulator.setParent(undefined);
        requestCanvasDraw = true;
    };
    
    $scope.toggleRunMode = function () {
        $scope.runMode = !$scope.runMode;
        if ($scope.runMode) {
            // Turn on run mode
            var tPos = mazeStart.getXform().getPosition();
            // Move the player to the maze entrance
            player.Character.getXform().setPosition(tPos[0], tPos[1]);
            $scope.hintsRemaining = 3; // reset available hints for the player
            startTime = Date.now();
            // Zoom in on the character
            mainView.setWCWidth(4);
            // Deselect any selected walls.
            manipulator.setParent(undefined);
            drawMgr.selectSceneNode(undefined);
        } else {
            // Turn off run mode
            // Zoom back out to the full view
            mainView.setWCWidth(15);
            mainView.setWCCenter(0, 0);
            
            // Reset statistics as maze layout may change
            $scope.actualTime = -1;
            $scope.timesWon = 0;
            $scope.fastestTime = -1;
        }
        requestCanvasDraw = true;
    };
    
    $scope.pause = function () {
        $scope.paused = !$scope.paused;
        requestCanvasDraw = true;
    };
    
    $scope.retry = function () {
        $scope.paused = true;
        $scope.hint = false;
        player.Moving = undefined;
        var tPos = mazeStart.getXform().getPosition();
        // Move the player to the maze entrance
        player.Character.getXform().setPosition(tPos[0], tPos[1]);
        $scope.hintsRemaining = 3; // reset available hints for the player
        startTime = Date.now();

        requestCanvasDraw = true;
    };
    
    $scope.giveHint = function () {
        if ($scope.hintsRemaining < 1 || $scope.paused) {
            return;
        } else {
            $scope.hintsRemaining--;
            $scope.hint = true;
            $scope.hintTime = Date.now();
            requestCanvasDraw = true;
        }
    };

    $scope.onClientButtonPress = function ($event) {
        var newBlock = undefined;
        
        if ($scope.paused) {
            return;
        }

        if ($event.keyCode === 119){
            // W
            if ($scope.runMode) {
                player.Moving = "Up";
            } else {
                // Check if the manipulator was set. If it was, draw child near it.
                if (manipulator.isManipulatorSet()) {
                    newBlock = $scope.drawChildNearParentWall(0, $scope.moveSnap);
                }
            }
        }
        else if ($event.keyCode === 97){
            // A
            if ($scope.runMode) {
                player.Moving = "Left";
            } else {
                if (manipulator.isManipulatorSet()) {
                    newBlock = $scope.drawChildNearParentWall(-$scope.moveSnap, 0);
                }
            }
        }
        else if ($event.keyCode === 115){
            // S
            if ($scope.runMode) {
                player.Moving = "Down";
            } else {
                if (manipulator.isManipulatorSet()) {
                    newBlock = $scope.drawChildNearParentWall(0, -$scope.moveSnap);
                }
            }
            
        }
        else if ($event.keyCode === 100){
            // D
            if ($scope.runMode) {
                player.Moving = "Right";
            } else {
                if (manipulator.isManipulatorSet()) {
                    newBlock = $scope.drawChildNearParentWall($scope.moveSnap, 0);
                }
            }
        }
        
        if (newBlock) {
            drawMgr.selectSceneNode(newBlock);
        }
        
        requestCanvasDraw = true;
    };
    $scope.onClientKeyUp = function ($event) {
        
        if ($scope.paused) {
            return;
        }
        
        // W = 119, A = 97, S = 115, D = 100
        // Keycodes on up are: 87, 65, 83, 68 for WASD respectively
        if ($scope.runMode &&
            ($event.keyCode === 87 || $event.keyCode === 65 ||
            $event.keyCode === 83 || $event.keyCode === 68)) {
            // Clear moving state
            player.Moving = undefined;
        }
        else if ($event.keyCode === 69){
            // E, for erase.
            if (manipulator.isManipulatorSet()) {
                $scope.deleteSelectedObject();
            }
        }
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
                    drawMgr.selectSceneNode(collisionSceneNode.sceneNode);
                }
            } else {
                // No object is selected
                manipulator.setParent(undefined);
                //Math.round((wcMPos[0] - pivot[0]) / $scope.moveSnap) * $scope.moveSnap
                if (!$scope.runMode) 
                $scope.addNewSceneNode($scope.getSnappedValue(dragStart[0]), 
                                       $scope.getSnappedValue(dragStart[1]));
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
                  //  manipulator.moveParent(
                  //      Math.round((wcMPos[0] - pivot[0]) / $scope.moveSnap) * $scope.moveSnap,
                  //      Math.round((wcMPos[1] - pivot[1]) / $scope.moveSnap) * $scope.moveSnap
                    //    );
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
    var piece = new MazePiece(drawMgr.getSquareShader(), "zeroGen", 1 * $scope.rotationSnap, 4 * $scope.rotationSnap);
    drawMgr.addSceneNode(piece);
   // var kid = new MazePiece(drawMgr.getSquareShader(), "firstGen", 1, -3);
   // piece.addAsChild(kid);
  //  var grandkid = new MazePiece(drawMgr.getSquareShader(), "secondGen", 2, -4);
  //  kid.addAsChild(grandkid);
    manipulator.setParent(piece);
    
    // Draw borders
    $scope.createBorders();
    
    // Build character
    player.Character = new Wizard(drawMgr.getSquareShader(), "A Powerful Wizard", 0, 0);
    player.Xform = player.Character.getXform();
   // drawMgr.addSceneNode(player.Character);
 //   var star = new Star(drawMgr.getCircleShader(), "star", -.5, 0);
   // player.Character.addAsChild(star);
    
    mazeStart.setColor([1, 1, 1, 1]);
    mazeStart.getXform().setPosition(-6.5, 4.5);
    mazeFinish.setColor([0.1, 0.9, 0.1 ,1]);
    mazeFinish.getXform().setPosition(6.5, -4.5);
    
    // Kick off update loop with initial FPS goal
    redrawUpdateTimer = $interval(function () {
        update();
        draw();
    }, 1000 / $scope.fpsGoal);
    requestCanvasDraw = true;
}]);