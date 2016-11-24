/*
 * Author: Andrew Hoke
 * 
 * DrawManager defines behavior via the Singleton model, including adding,
 * removing, transforming, and drawing of shapes.
 */

/*jslint nomen: true, devel: true*/
/*global gEngine: false, SimpleShader: false, SquareRenderable: false, Renderable: false, mat4: false, vec3: false */

// Pseudo-enum to allow external calling code to request only shapes that we
// support in the DrawManager.
var PrimitiveShape = {};

function DrawManager(canvasId) {
    'use strict';
    console.log("Loading DrawManager");

    gEngine.Core.initializeWebGL(canvasId);
    gEngine.Core.clearCanvas([0.8, 0.8, 0.8, 1]);

    console.log("Setting up DrawManager with id " + canvasId);

    var self = {},
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
        _sceneNodes = [],
        _shapeInfo = [],
        _selectedShape = null,
        _selectedShapeIndex = 0;

    self.removeAllShapes = function () {
        _renderedShapes = [];
        _selectedShape = null;
    };

    self.drawShapes = function (camera) {
        var i = 0;
        camera.setupViewProjection();

        for (i in _renderedShapes) {
            _renderedShapes[i].draw(camera);
        }

        for (i in _sceneNodes) {
            _sceneNodes[i].draw(camera);
        }
    };

    self.getSupportedShapes = function () {
        return PrimitiveShape;
    };

    self.getRenderedShapeCount = function () {
        return _renderedShapes.length;
    };

    self.getRenderedShapeInfo = function () {
        return _shapeInfo;
    };

    self.getShapeXform = function (index) {
        // Bounds checking
        if (index < _renderedShapes.length) {
            return _renderedShapes[index].getXform();
        } else {
            console.log("Tried to get shape out of bounds with index " + index);
        }
    };

    self.getSquareShader = function () {
        return _squareShader;
    };

    self.getCircleShader = function () {
        return _circleShader;
    };

    self.selectShape = function (index) {
        // Bounds checking
        if (index < _renderedShapes.length) {
            _selectedShape = _renderedShapes[index];
            _selectedShapeIndex = index;
            console.log("Selected shape at index " + index);
        } else {
            console.log("Tried to select shape out of bounds with index " + index);
        }
    };

    self.addShapeToCanvas = function (shapeType) {
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

    self.removeShape = function (index) {
        // Bounds checking
        if (index < _renderedShapes.length) {
            _renderedShapes[index] = null;

            // If we remove from the middle of the array we need to shift down
            // all the other values
            _renderedShapes.splice(index, 1);
            // We should also remove it from our shape info collection
            _shapeInfo.splice(index, 1);

            // "Erase" the removed shape
            self.drawShapes();
        } else {
            console.log("Tried to remove shape out of bounds with index " + index);
        }
    };

    self.scaleSelectedShape = function (x, y) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.getXform().setSize(x, y);
        //PublicInstance.drawShapes();
    };
    self.rotateSelectedShapeInRad = function (rot) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.getXform().setRotationInRad(rot);
        self.drawShapes();
    };
    self.rotateSelectedShapeInDeg = function (rot) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.getXform().setRotationInDegree(rot);
        self.drawShapes();
    };
    self.translateSelectedShape = function (x, y) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.getXform().setPosition(x, y);
        //updateShapeInfo(_selectedShapeIndex);
        //PublicInstance.drawShapes();
    };
    self.colorSelectedShape = function (color) {
        if (_selectedShape === null) {
            console.log("Cannot manipulate selected shape because no shape is selected.");
            return;
        }
        _selectedShape.setColor(color);
        //updateShapeInfo(_selectedShapeIndex);
        //PublicInstance.drawShapes();
    };

    self.getSelectedShapeXform = function () {
        return _selectedShape.getXform() || null;
    };

    self.getSelectedShapeColorInHex = function () {
        return _selectedShape.getColorInHex();
    };

    self.isShapeSelected = function () {
        return _selectedShape !== null && _selectedShape !== undefined;
    };

    self.finalizeSelectedShape = function () {
        console.log("Finalizing selected shape");
        // Cut reference to selected shape
        _selectedShape = null;
    };

    self.addSceneNode = function (node) {
        _sceneNodes.push(node);
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
    self.update = function () {
        //TODO: Any update logic to do in the model?
    };

    // Checks the manipulator object for collisions.
    self.checkManipulatorCollision = function(xPos, yPos, manipulator){
        var manipulatorXforms = manipulator.getPositions();
        var wcXform = manipulatorXforms.wcXform; 
        
        // Check move manipulator position.
        if (CollisionHelper.WithinRadius([wcXform.getXPos(), wcXform.getYPos()],  
                                        0.5, [xPos, yPos])) {
            return { sceneNode: manipulator, handleType: "Move" };
        }
        
        // Check rotate handle position.
        var rotateHandleXform = manipulatorXforms.rotateHandle.getXform();
        if (CollisionHelper.WithinRadius([wcXform.getXPos() + rotateHandleXform.getXPos(), 
                                        wcXform.getYPos() + rotateHandleXform.getYPos()],  
                                        0.5, [xPos, yPos])) {
            return { sceneNode: manipulator, handleType: "Rotate" };
        }
        
        // Check scale handle position.
        var scaleHandleXform = manipulatorXforms.scaleHandle.getXform();
        if (CollisionHelper.WithinRadius([wcXform.getXPos() + scaleHandleXform.getXPos(), 
                                        wcXform.getYPos() + scaleHandleXform.getYPos()],  
                                        0.5, [xPos, yPos])) {
            return { sceneNode: manipulator, handleType: "Scale" };
        }
        
        // If no collisions, return 0.
        return 0;
    };

    // This checks collision based on the xPos and yPos passed in.
    // Collision is checked against ALL Scene Nodes, their children, and their 
    // associated renderable objects. 
    self.checkCollision = function(xPos, yPos, manipulator) {
        var i = 0;
        var x = 0;
        var foundCollision = 0;
        
        // Check manipulator points to see if a collision occured there.
        var collisionWithManipulator = self.checkManipulatorCollision(xPos, yPos, manipulator);
        if (collisionWithManipulator !== 0)
        {
            // returns in the following format.
            // { sceneNode: RenderableManipulator, handleType: "Scale" || "Rotate" || "Move" }
            return collisionWithManipulator;
        }
        
        // First check all renderables of of top-level parent scene nodes.
        // Done outside of recursion to make logic easier.
        for (x in _sceneNodes){
            for (i = 0; i < _sceneNodes[x].length; i++ ){
                var currRenderable = _sceneNodes[x].getRenderableAt(i);
                var wall = currRenderable.getXform();
                if(wall.Contains([xPos, yPos])){
                    //return _sceneNodes[x];
                    var sceneAndObject = { sceneNode: _sceneNodes[x], renderableObj: currRenderable };
                    return sceneAndObject;
                }
            }
        }
        
        i = 0;
        // Now recursively check all children of scene nodes.
        for (i in _sceneNodes) {
             foundCollision = self.recursiveCheckCollision(xPos, yPos, _sceneNodes[i]);
            // If a value that is not 0 is returned, then some sort of collision was found.  
            // Pass the sceneNode back up.
            if (foundCollision !== 0){
                return foundCollision;
            }
        }
        // If nothing was found, return 0.
        return 0;
    };
    
    // Helper function, recusively checks all scene nodes and their renderable object.
    // Returns of 0 means nothing was found. 
    // Return sceneNode returns the corresponding sceneNode.
    self.recursiveCheckCollision = function(xPos, yPos, currSceneNode) {
        var i, foundCollision;
        foundCollision = 0;
        
        // Caution: This is a hack...
        if (currSceneNode.getName() === "manipulator") {
            return 0;
        }
       
       // Check all children of the parent scene node. 
        for (i = 0; i < currSceneNode.sizeChildren(); i++){
            foundCollision = self.recursiveCheckCollision(xPos, yPos, currSceneNode.getChildAt(i));
            // If foundCollision is no longer 0, then a collision was found. 
            // Stop comparing and return it back up through the stack frames.
            if (foundCollision !== 0){
                return foundCollision;
            }
        }
        
        // Check all renderable objects inside passed in scene node for collision.
        for (i = 0; i < currSceneNode.size(); i++ ){
            var currRenderable = currSceneNode.getRenderableAt(i);
            
            // This is a hack...
//            if (currRenderable.getName() === "manipulator") {
//                continue;
//            }
            
            var wall = currRenderable.getXform();
            // If collision detected, return scene node. 
            if(wall.Contains([xPos, yPos])){
                // return currentSceneNode if collision was found. 
                var sceneAndObject = { sceneNode: currSceneNode, wallObject: currRenderable };
                return sceneAndObject;
            }
        }

        // Return 0 to indicate no collision detected.
        return 0;
    };

    console.log("DrawManager is ready");
    return self;
}