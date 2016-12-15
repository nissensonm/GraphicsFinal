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
        _selectedShape = undefined,
        _selectedShapeIndex = 0,
        _selectedSceneNode = undefined;

    self.removeAllShapes = function () {
        _renderedShapes = [];
        _selectedShape = undefined;
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
    
    self.getSceneNodes = function (){
        return _sceneNodes;
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
    
    self.selectSceneNode = function (node, color) {
        if (_selectedSceneNode) {
            _selectedSceneNode.unHighlight(true);
        }
        if (node === undefined) {
            return;
        }
        _selectedSceneNode = node;
        _selectedSceneNode.highlight(color || [1, 0.1, 0.1, 1], true);
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
    
    self.getLastSceneNode = function () {
        return _sceneNodes[_sceneNodes.length - 1];
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

    };

    // Delete the object selected by the manipulator.
    self.deleteScene = function(xformToDelete) {
        var i, found = 0;
        for (i in _sceneNodes) {
            // Keep checking until we find the scene node corresponding the the scene node.
            if (_sceneNodes[i].getXform() === xformToDelete) {
                // Make sure the scene node is safe to delete.
                if (_sceneNodes[i].getName() !== "doNotDelete"){
                    // If the scene node 
                    if (_sceneNodes[i] === _selectedSceneNode) {
                        self.selectSceneNode(undefined); // clear selection before deleting
                    }
                    // Splice out just the one parent node.
                    _sceneNodes.splice(i, 1);
                    return 0;
                }
            }
            else {
                // Recursively check the rest of the children for the correct scene node.
                found = self.findSceneToDeleteRecursive(xformToDelete, _sceneNodes[i]);         
                
                // If a 1 was returned, something was found, exit to avoid wasting time
                // checking other children.
                if (found === 1)
                    return 0;
            }
        }
    };
    
    // Check down the tree for the SN
    self.findSceneToDeleteRecursive = function(xformToDelete, currSceneNode) {
        var i, found = 0;

        if (currSceneNode.getName() === "manipulator") {
            return 0;
        }
        
        for (i = 0; i < currSceneNode.sizeChildren(); i++){
            // If a 1 was returned, something was found, exit to avoid wasting time
            // checking other children.
            if (found === 1)
                return 1;
            
            // Test each child. If child fails then call recursion.
            if (currSceneNode.getChildAt(i).getXform() === xformToDelete){
                // Found node, delete it.
                currSceneNode.removeChildByIndex(i);
                
                // And we're done as we found a match, return out.
                return 1;
            }
            
            // Didn't find, keep checking children.
            found = self.findSceneToDeleteRecursive(xformToDelete, currSceneNode.getChildAt(i));         
        }
        return 0;
    };
    

    // Checks the manipulator object for collisions.
    self.checkManipulatorCollision = function(xPos, yPos, manipulator){
        try {
        var manipulatorXforms = manipulator.getPositions();  
        var moveHandleMat = manipulatorXforms.moveHandle.getXform().getXform(); 
        var xFormWithPiv = manipulatorXforms.wcXform.getXform();
        var parentMat = manipulatorXforms.parentMat;
        var otherParents = manipulator.getOtherParents();
        var i = 0;
        
        // Calculate the collision boundaries for move handle.
      if (otherParents.length > 0)
            for (i in otherParents){
                mat4.multiply(moveHandleMat, otherParents[i], moveHandleMat);}
        mat4.multiply(moveHandleMat, xFormWithPiv, moveHandleMat);   
        mat4.multiply(moveHandleMat, parentMat, moveHandleMat);
        if (CollisionHelper.WithinRadius([moveHandleMat[12], moveHandleMat[13]],  
                                         0.40, [xPos, yPos])) {
            return { sceneNode: manipulator, handleType: "Move" };
        }
        
    }catch(err) {}
        // If no collisions, return 0.
        return 0;
    };

    // This checks collision based on the xPos and yPos passed in.
    // Collision is checked against ALL Scene Nodes, their children, and their 
    // associated renderable objects. 
    // This is used for selecting objects with the mouse.
    self.checkCollision = function(xPos, yPos, manipulator) {
        var i = 0;
        var x = 0;
        var foundCollision = 0;
        
        // Check manipulator points to see if a collision occured there.
        var collisionWithManipulator = self.checkManipulatorCollision(xPos, yPos, manipulator);
        if (collisionWithManipulator !== 0)
        {
            // returns in the following format.
            // { sceneNode: sceneNode, renderableObj: currRenderable }
            return collisionWithManipulator;
        }
        
        // First check all renderables of of top-level parent scene nodes.
        // Done outside of recursion to make logic easier.
        for (x in _sceneNodes){
            for (i = 0; i < _sceneNodes[x].length; i++ ){
                var currRenderable = _sceneNodes[x].getRenderableAt(i);
                var wall = currRenderable.getXform();
                var wallMat = wall.getXform();
                var snMat = _sceneNodes[x].getXform().getXform();
                mat4.multiply(wallMat, snMat, wallMat);

                // If we're within range, return it.
                if(CollisionHelper.WithinRadius([wallMat[12], wallMat[13]],  
                                        0.35, [xPos, yPos])){
                    var sceneAndObject = { sceneNode: _sceneNodes[x], renderableObj: currRenderable };
                    return sceneAndObject;
                }
            }
        }
        
        var holdParentsMat = [];
        i = 0;
        // Now recursively check all children of scene nodes.
        for (i in _sceneNodes) {
             foundCollision = self.recursiveCheckCollision(xPos, yPos, _sceneNodes[i], holdParentsMat);
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
    self.recursiveCheckCollision = function(xPos, yPos, currSceneNode, holdParentsMat) {
        var i, foundCollision;
        foundCollision = 0;
        
        // If manipulator was selected, do nothing.
        if (currSceneNode.getName() === "manipulator") {
            return 0;
        }
        
       // Check all children of the parent scene node. 
        for (i = 0; i < currSceneNode.sizeChildren(); i++){
            // Add parent mat.
            holdParentsMat.push(currSceneNode.getXform().getXform());

            foundCollision = self.recursiveCheckCollision(xPos, yPos, currSceneNode.getChildAt(i), holdParentsMat);
            // If foundCollision is no longer 0, then a collision was found. 
            // Stop comparing and return it back up through the stack frames.
            if (foundCollision !== 0){
                return foundCollision;
            }
            
            // Remove parent mat so it does not get added to the next child.
            holdParentsMat.pop(currSceneNode.getXform().getXform());
        }
        
        // Check all renderable objects inside passed in scene node for collision.
        for (i = 0; i < currSceneNode.size(); i++ ){
            var currRenderable = currSceneNode.getRenderableAt(i);
            
            var wall = currRenderable.getXform();
            var wallMat = wall.getXform();
            var snMat = currSceneNode.getXform().getXform();
            
            var x = 0;
            var snMats = [];
            if (holdParentsMat.length > 0)
                for (x = holdParentsMat.length - 1; x >= 0; x--){
                    mat4.multiply(wallMat, holdParentsMat[x], wallMat);
                    // Gather parent matricies to help with transformations down the line.
                    snMats.push(holdParentsMat[x]);
                }
            mat4.multiply(wallMat, snMat, wallMat);

            // If collision detected, return scene node, currRenderable, and parent mats. 
            if(CollisionHelper.WithinRadius([wallMat[12], wallMat[13]],  
                                        0.35, [xPos, yPos])){
                var sceneAndObject = { sceneNode: currSceneNode, wallObject: currRenderable, wallMat: snMats };
                return sceneAndObject;
            }
        }

        // Return 0 to indicate no collision detected.
        return 0;
    };
    
    // This checks collision based on the xPos and yPos passed in for the player character.
    // Uses similar code to the manipulator selection collision, except
    // stripped out a lot of unnessary code as it will be called much more often. 
    self.checkCollisionPlayer = function(xPos, yPos) {
        var i = 0;
        var x = 0;
        var foundCollision = 0;
        
        // First check all renderables of of top-level parent scene nodes.
        // Done outside of recursion to make logic easier.
        for (x in _sceneNodes){
            for (i = 0; i < _sceneNodes[x].length; i++ ){
                var currRenderable = _sceneNodes[x].getRenderableAt(i);
                var wall = currRenderable.getXform();
                if(wall.LessStrictContains([xPos, yPos])){
                    //return -1 to indicate collision.
                    return -1;
                }
            }
        }
        
        i = 0;
        // Now recursively check all children of scene nodes.
        for (i in _sceneNodes) {
             foundCollision = self.recursiveCheckCollisionPlayer(xPos, yPos, _sceneNodes[i]);
            // If a value that is not 0 is returned, then some sort of collision was found.  
            // Stop iterating and return it back up.
            if (foundCollision !== 0){
                return foundCollision;
            }
        }
        // If nothing was found, return 0.
        return 0;
    };
    
    // Helper function, recusively checks all scene nodes and their renderable object.
    // Returns of 0 means nothing was found. 
    // Return 0 to indicate no collision or -1 to indicate collision.
    self.recursiveCheckCollisionPlayer = function(xPos, yPos, currSceneNode) {
        var i, foundCollision;
        foundCollision = 0;
        
       // Check all children of the parent scene node. 
        for (i = 0; i < currSceneNode.sizeChildren(); i++){
            // Add parent mat.
            foundCollision = self.recursiveCheckCollisionPlayer(xPos, yPos, currSceneNode.getChildAt(i));
            // If foundCollision is no longer 0, then a collision was found. 
            // Stop recursion and return it up.
            if (foundCollision !== 0){
                return foundCollision;
            }
        }
        
        // Check all renderable objects inside passed in scene node for collision.
        for (i = 0; i < currSceneNode.size(); i++ ){
            var currRenderable = currSceneNode.getRenderableAt(i);
            var wall = currRenderable.getXform();

            // If collision detected, return -1
            if(wall.LessStrictContains([xPos, yPos])){
                return -1;
            }
        }

        // Return 0 to indicate no collision detected.
        return 0;
    };

    console.log("DrawManager is ready");
    return self;
}