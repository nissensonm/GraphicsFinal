/*global DrawManager: false, CollisionHelper: false, CanvasMouseSupport: false, Camera: false, setTimeout: false*/
/*global document, $, angular, console, alert*/
/* jslint node: true, vars: true */

var module = angular.module('mp4', []);

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

module.controller('mp4Controller', ["$scope", "$interval", function ($scope, $interval) {
    'use strict';
    // Potentially saves on canvas redraws by limiting the number of redraws
    // per second, where the update interval is determined by the constant
    // number FPS_GOAL (i.e. the number of times per second to update, ideally)
    var redrawUpdateTimer,
        drawMgr = new DrawManager("GLCanvas"),
        requestCanvasDraw = false,
        dragging = "",
        wcMPos = [0,0];

    $scope.drawMgr = drawMgr;
    $scope.canvasMouse = new CanvasMouseSupport('GLCanvas');

    $scope.CANVAS_SIZE = [800, 600];
    $scope.borderThickness = 1;
    $scope.showGrabbers = true;
    $scope.grabberSize = 5;
    // Variables from the GUI
    $scope.wcPosX = 0;
    $scope.wcPosY = 0;
    $scope.wcWidth = 10;
    $scope.vpLeft = 50;
    $scope.vpBottom = 50;
    $scope.vpWidth = 200;
    $scope.vpHeight = 150;

    $scope.clientX = 0;
    $scope.clientY = 0;
    $scope.canvasX = 0;
    $scope.canvasY = 0;
    $scope.vpX = 0;
    $scope.vpY = 0;
    $scope.targetCam = "";
    $scope.camX = 0;
    $scope.camY = 0;

    $scope.fpsGoal = 120;
    
    var mainView = new Camera(
            [0, 0], // wc Center
            200, // wc Wdith
            [0, 0, $scope.CANVAS_SIZE[0], $scope.CANVAS_SIZE[1]]   // viewport: left, bottom, width, height
            ),
        miniMap = new Camera(
            [0, 0], // wc Center
            50, // wc Wdith
            [50, 50, 200, 150] // viewport: left, bottom, width, height
            ),
        sqAreaViewport = new SquareArea(
            drawMgr.getSquareShader(), // Shader to draw edges
            [0,0], // Position of area on canvas (placeholder)
            [0,0], // Size of area (placeholder)
            1), // Thickness of edges
        sqAreaCanvas = new SquareArea(
            drawMgr.getSquareShader(),
            [0, 0],
            [0,0],
            1);
    
    miniMap.setBackgroundColor([0.8, 0.6, 0.6, 1]);
    sqAreaViewport.setLineColor([0, 0, 1, 1]);
    sqAreaCanvas.setLineColor([1, 1, 1, 1]);

    // Handle client mouse clicks and send to model
    $scope.onClientMouseClick = function ($event) {
        switch ($event.which) {
            case 1: // handle LMB
                var vpGrab = sqAreaViewport.getGrabberXform();
                var caGrab = sqAreaCanvas.getGrabberXform();
                // If cursor is on the viewport SquareArea grabber
                if ($scope.showGrabbers && CollisionHelper.Rect.Contains(vpGrab.getPosition(), vpGrab.getSize(), wcMPos)) {
                    var initPos = sqAreaViewport.getPosition();
                    console.log("vp collide");
                    dragging = "mini";
                // If cursor is on the canvas SquareArea grabber 
                } else if ($scope.showGrabbers && CollisionHelper.Rect.Contains(caGrab.getPosition(), caGrab.getSize(), wcMPos)) {
                    var initPos = sqAreaViewport.getPosition();
                    console.log("canvas collide");
                    dragging = "main";
                // No collision. Add a shape.
                } else {
                    drawMgr.addShapeToCanvas(5); // gl.TRIANGLE_STRIP = 5 = hard-coded square
                    drawMgr.translateSelectedShape($scope.camX, $scope.camY);
                    drawMgr.scaleSelectedShape(10, 10);
                    // Math.round hack to pick the number of decimals to keep
                    drawMgr.colorSelectedShape([
                        Math.round(Math.random() * 100) / 100,
                        Math.round(Math.random() * 100) / 100,
                        Math.round(Math.random() * 100) / 100,
                        1]);
                }
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
            drawMgr.finalizeSelectedShape();
        } else {
            dragging = "";
        }
    };

    $scope.onClientMouseMove = function ($event) {
        // Update mouse position data
        var cam = mainView;
        $scope.targetCam = "Main";
        $scope.clientX = $event.pageX;
        $scope.clientY = $event.pageY;
        $scope.canvasX = $scope.canvasMouse.getPixelXPos($event);
        $scope.canvasY = $scope.canvasMouse.getPixelYPos($event);
        $scope.vpX = $scope.canvasX;
        $scope.vpY = $scope.canvasY;
        if (miniMap.isMouseInViewport($scope.canvasX, $scope.canvasY)) {
            var vp = miniMap.getViewport();
            cam = miniMap;
            $scope.targetCam = "Minimap";
            // Overwrite viewport coords of main view since we're in the minimap viewport
            $scope.vpX = $scope.canvasX - vp[0];
            $scope.vpY = $scope.canvasY - vp[1];
        }
        $scope.camX = round(cam.mouseWCX($scope.canvasX), 3);
        $scope.camY = round(cam.mouseWCY($scope.canvasY), 3);
        wcMPos = [mainView.mouseWCX($scope.canvasX), mainView.mouseWCY($scope.canvasY)];
        
        // Now process the actual input
        switch ($event.which) {
            case 1: // left
                if (dragging === "main") { // Move the WC window and border
                    sqAreaCanvas.setPosition(
                        wcMPos[0] - miniMap.getWCWidth() / 2, 
                        wcMPos[1] - miniMap.getWCHeight() / 2);
                    miniMap.setWCCenter(
                        $scope.wcPosX = wcMPos[0],
                        $scope.wcPosY = wcMPos[1]);
                } else if (dragging === "mini") { // Move the camera viewport and border
                    sqAreaViewport.setPosition(
                        wcMPos[0] - sqAreaViewport.getWidth() / 2, 
                        wcMPos[1] - sqAreaViewport.getHeight() / 2);
                    miniMap.setViewport([
                        $scope.vpLeft = ($scope.canvasX - $scope.vpWidth / 2), 
                        $scope.vpBottom = ($scope.canvasY - $scope.vpHeight / 2),
                        $scope.vpWidth,
                        $scope.vpHeight]);
                } else {
                    var xform = drawMgr.getSelectedShapeXform(),
                        dx = Math.abs($scope.camX - xform.getXPos()),
                        dy = Math.abs($scope.camY - xform.getYPos());
                    drawMgr.scaleSelectedShape(dx * 4, dy * 4);
                }
                requestCanvasDraw = true;
                break;
        }
    };

    // Updates the transform editor GUI for the minimap
    $scope.onViewGuiChange = function () {
        miniMap.setWCWidth($scope.wcWidth);
        miniMap.setWCCenter($scope.wcPosX, $scope.wcPosY);
        miniMap.setViewport([$scope.vpLeft, $scope.vpBottom, $scope.vpWidth, $scope.vpHeight]);
        sqAreaCanvas.setSize(miniMap.getWCWidth(), miniMap.getWCHeight());
        sqAreaCanvas.setPosition($scope.wcPosX - miniMap.getWCWidth() / 2, $scope.wcPosY - miniMap.getWCHeight() / 2);
        sqAreaViewport.setSize(dcXToWcX($scope.CANVAS_SIZE[0], $scope.vpWidth, mainView),
                               dcYToWcY($scope.CANVAS_SIZE[1], $scope.vpHeight, mainView));
        sqAreaViewport.setPosition(mainView.mouseWCX($scope.vpLeft),
                                   mainView.mouseWCY($scope.vpBottom));
            
        requestCanvasDraw = true;
    };
    
    // Update SquareArea border thicknesses from controller
    $scope.updateBorderThickness = function () {
        sqAreaCanvas.setBorderThickness($scope.borderThickness || 1);
        sqAreaViewport.setBorderThickness($scope.borderThickness || 1);
        requestCanvasDraw = true;
    };
    
    // Update grabber size from controller
    $scope.updateGrabberSize = function () {
        sqAreaCanvas.setGrabberSize($scope.grabberSize, $scope.grabberSize);
        sqAreaViewport.setGrabberSize($scope.grabberSize, $scope.grabberSize);
        requestCanvasDraw = true;
    };
    
    $scope.updateGrabberVisibility = function () {
        sqAreaCanvas.enableGrabber($scope.showGrabbers);
        sqAreaViewport.enableGrabber($scope.showGrabbers);
        requestCanvasDraw = true;
    };

    // Fired by redrawUpdateTimer
    function update() {
        if (requestCanvasDraw) {
            requestCanvasDraw = false;
            drawMgr.drawShapes(mainView);
            drawMgr.drawShapes(miniMap);
            sqAreaViewport.draw(mainView);
            sqAreaCanvas.draw(mainView);
        }
    }

    function round(num, decimals) {
        var shift = Math.pow(10, decimals);
        return Math.round(num * shift) / shift;
    }
    
    function dcToWc(canvasSize, dc, camera) {
        return [dc[0] / canvasSize[0] * camera.getWCWidth(), dc[1] / canvasSize[1] * camera.getWCHeight()];
    }
    function dcXToWcX(canvasWidth, dc, camera) {
        return dc / canvasWidth * camera.getWCWidth();
    }
    function dcYToWcY(canvasHeight, dc, camera) {
        return dc / canvasHeight * camera.getWCHeight();
    }

    // Make sure canvas mouse position calculations are accurate after scrolling
    $(document).scroll(function () {
        $scope.canvasMouse.refreshBounds();
    });

    // Kick off update loop with initial FPS goal
    redrawUpdateTimer = $interval(update, 1000 / $scope.fpsGoal);
    $scope.onViewGuiChange();
    $scope.updateBorderThickness();
    $scope.updateGrabberSize();
    sqAreaViewport.setGrabberColor([1,0,0,1]);
    sqAreaCanvas.setGrabberColor([1,0,0,1]);
    requestCanvasDraw = true;

    // Wait a bit for the page to load and then update the canvas mouse bounds.
    // This fixes the issue where placed shapes don't always match the cursor position.
    setTimeout(function () {
        $scope.canvasMouse.refreshBounds();
    }, 500);
}]);