/*
 * Author: Andrew Hoke
 * 
 * DrawManager defines behavior via the Singleton model, including adding,
 * removing, transforming, and drawing of shapes.
 */

/*jslint nomen: true, devel: true*/
/*global gEngine: false, SimpleShader: false, Renderable: false, mat4: false, vec3: false */

// Pseudo-enum to allow external calling code to request only shapes that we
// support in the DrawManager.
var PrimitiveShape = {};

function DrawManager(canvasId) {
    'use strict';
    console.log("Loading DrawManager");

    gEngine.Core.initializeWebGL(canvasId);
    gEngine.Core.clearCanvas([0.8, 0.8, 0.8, 1]);

    console.log("Setting up DrawManager with id " + canvasId);

    var PublicInstance = {},
    // I define local/instance variables and functions with an underscore.
    // More consistent and easier to read.
        _gl = gEngine.Core.getGL(),

        _squareShader = new SimpleShader(
            "src/GLSLShaders/SimpleVS.glsl", // Path to the VertexShader 
            "src/GLSLShaders/SimpleFS.glsl", // Path to the Simple FragmentShader
            _gl.TRIANGLE_STRIP
        ), // vertex buffer type
        _circleShader = new SimpleShader(
            "src/GLSLShaders/SimpleVS.glsl", // Path to the VertexShader 
            "src/GLSLShaders/SimpleFS.glsl", // Path to the Simple FragmentShader
            _gl.TRIANGLE_FAN
        ), // vertex buffer type

        _renderedShapes = [],
        _shapeInfo = [],
        _selectedShape = null,
        _selectedShapeIndex = 0;

    PublicInstance.removeAllShapes = function () {
        _renderedShapes = [];
        _selectedShape = null;
    };

    PublicInstance.drawShapes = function (camera) {
        camera.setupViewProjection();

        for (var shape in _renderedShapes) {
            _renderedShapes[shape].draw(camera);
        }
    };

    PublicInstance.getSupportedShapes = function () {
        return PrimitiveShape;
    };
    
    PublicInstance.getRenderedShapeCount = function () {
        return _renderedShapes.length;
    };
    
    PublicInstance.getRenderedShapeInfo = function () {
        return _shapeInfo;
    };
    
    PublicInstance.getShapeXform = function (index) {
        // Bounds checking
        if (index < _renderedShapes.length) {
            return _renderedShapes[index].getXform();
        } else {
            console.log("Tried to get shape out of bounds with index " + index);
        }
    };
    
    PublicInstance.getSquareShader = function () {
        return _squareShader;
    };
    
    PublicInstance.getCircleShader = function () {
        return _circleShader;
    };
    
    PublicInstance.selectShape = function (index) {
        // Bounds checking
        if (index < _renderedShapes.length) {
            _selectedShape = _renderedShapes[index];
            _selectedShapeIndex = index;
            console.log("Selected shape at index " + index);
        } else {
            console.log("Tried to select shape out of bounds with index " + index);
        }
    };

    PublicInstance.addShapeToCanvas = function (shapeType) {
        console.log("Adding shape to canvas of glArrayType " + shapeType);
        if (shapeType === PrimitiveShape.Circle.Value) {
            console.log("Creating a circle");
            _selectedShape = new Renderable(_circleShader, 52);
        } else {
            console.log("Creating a square");
            _selectedShape = new SquareRenderable(_squareShader);
        }
        // Put new shape in array of all shapes on the canvas
        _selectedShapeIndex = _renderedShapes.length;
        _renderedShapes[_renderedShapes.length] = _selectedShape;
        //PublicInstance.drawShapes();
    };
    
    PublicInstance.removeShape = function (index) {
        // Bounds checking
        if (index < _renderedShapes.length) {
            _renderedShapes[index] = null;
            
            // If we remove from the middle of the array we need to shift down
            // all the other values
            _renderedShapes.splice(index, 1);
            // We should also remove it from our shape info collection
            _shapeInfo.splice(index, 1);
            
            // "Erase" the removed shape
            PublicInstance.drawShapes();
        } else {
            console.log("Tried to remove shape out of bounds with index " + index);
        }
    };
    
    PublicInstance.scaleSelectedShape = function (x, y) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.getXform().setSize(x, y);
        //PublicInstance.drawShapes();
    };
    PublicInstance.rotateSelectedShapeInRad = function (rot) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.getXform().setRotationInRad(rot);
        PublicInstance.drawShapes();
    };
    PublicInstance.rotateSelectedShapeInDeg = function (rot) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.getXform().setRotationInDegree(rot);
        PublicInstance.drawShapes();
    };
    PublicInstance.translateSelectedShape = function (x, y) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.getXform().setPosition(x, y);
        //updateShapeInfo(_selectedShapeIndex);
        //PublicInstance.drawShapes();
    };
    PublicInstance.colorSelectedShape = function (color) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.setColor(color);
        //updateShapeInfo(_selectedShapeIndex);
        //PublicInstance.drawShapes();
    };

    PublicInstance.getSelectedShapeXform = function () {
        return _selectedShape.getXform() || null;
    };

    PublicInstance.getSelectedShapeColorInHex = function () {
        return _selectedShape.getColorInHex();
    };

    PublicInstance.isShapeSelected = function () {
        return _selectedShape !== null && _selectedShape !== undefined;
    };

    PublicInstance.finalizeSelectedShape = function () {
        console.log("Finalizing selected shape");
        // Cut reference to selected shape
        _selectedShape = null;
    };

    PrimitiveShape = Object.freeze({
        Square : {
            Name : "Square",
            Value : gEngine.Core.getGL().TRIANGLE_STRIP
        },
        Circle : {
            Name : "Circle",
            Value : gEngine.Core.getGL().TRIANGLE_FAN
        }
    });

    // Runs an update loop and returns how many, if any, shapes were removed
    PublicInstance.update = function () {
        var numRemoved = 0;
        for (var i = 0; i < _renderedShapes.length; i++) {
            _renderedShapes[i].getXform().incYPosBy(-1);
            if (_renderedShapes[i].getXform().getYPos() < 0) {
                PublicInstance.removeShape(i);
                numRemoved++;
                // since Array.splice will move all the elements after i up one
                // element, we need to remain in the same position to avoid
                // skipping any shapes
                i--;
            }
        }
        return numRemoved;
    };

    console.log("DrawManager is ready");
    return PublicInstance;
}