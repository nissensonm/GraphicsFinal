/*
 * Author: Andrew Hoke, Michael Nissenson
 * RenderableManipulator class defines behavior for a manipulator object used
 * to manipulate a Renderable object on a WebGL canvas.
 */

/*jslint nomen: true, devel: true*/
/*global SquareRenderable, Transform, mat4*/

function RenderableManipulator(parent, name, shader, otherParents) {
    'use strict';
    var self = {},
        _parent = parent,
        _name = name,
        _xform = new PivotedTransform(),              // Handle locations:
        _moveHandle = new SquareRenderable(shader),   // center
        _rotateHandle = new SquareRenderable(shader), // top
        _rotateLine = new SquareRenderable(shader),
        _scaleHandle = new SquareRenderable(shader),  // right
        _scaleLine = new SquareRenderable(shader),
        _otherParents = [];

    self.draw = function (camera) {        
        var parentMat = undefined;
        // Only get parent transform matrix if the parent is defined
        if (_parent !== undefined) {  
            try {
                var otherParents = _otherParents;
                parentMat = _parent.getXform().getXform();
                // Transform pivot point by parent transform
                
                var i = 0;
                if (otherParents.length > 0)
                    for (i in otherParents)
                        mat4.multiply(parentMat, otherParents[i], parentMat);
                mat4.multiply(parentMat, _xform.getXform(), parentMat);
                
                // Calculate the proper pivot location.
                var xformCalculatePosition = _xform.getXform();
                if (otherParents.length > 0)
                    for (i in otherParents){
                        mat4.multiply(xformCalculatePosition, otherParents[i], xformCalculatePosition);}
                mat4.multiply(xformCalculatePosition, _parent.getXform().getXform(), xformCalculatePosition);

               parentMat[12] = xformCalculatePosition[12] ;// * parentMat[0];
               parentMat[13] = xformCalculatePosition[13];// * parentMat[0];
            } catch(err) {}
        } else {
            parentMat = _xform.getXform();
        }
  
        _rotateLine.draw(camera, parentMat);
        _scaleLine.draw(camera, parentMat);
        // Draw handles on top of connecting lines
        _moveHandle.draw(camera, parentMat);
        _rotateHandle.draw(camera, parentMat);
        _scaleHandle.draw(camera, parentMat);
    };
    
    self.setOtherParents = function (newParents) {
        _otherParents = newParents;
    };
    
    self.getOtherParents = function () {
        return _otherParents;
    };
    
    self.setParent = function (newParent) {
        // Detach from old parent if we had one
        if (_parent !== undefined) {
            _parent.removeChild(this);
        }
        
        // NOW set new parent
        _parent = newParent;
        // If the new parent exists, update our information
        if (_parent !== undefined) {
            _parent.addAsChild(this);
            
            
            var pxf = _parent.getXform();
            var pivot = pxf.getPivot();
            
            _xform.setPosition(pivot[0], pivot[1]);            
            // Update manipulator xform to match the parent xform
              
        } else {
            // "Hide" the manipulator
            _xform.setPosition(-999,-999);
        }
    };

    // Get parent's x, y position.
    self.getParentPosition = function () {
        // Calculate the proper location.
        var i;
        var xformCalculatePosition = _xform.getXform();
        if (_otherParents.length > 0)
            for (i in _otherParents){
                mat4.multiply(xformCalculatePosition, _otherParents[i], xformCalculatePosition);}
        mat4.multiply(xformCalculatePosition, _parent.getXform().getXform(), xformCalculatePosition);
        
        return [xformCalculatePosition[12], xformCalculatePosition[13]];
    };

    self.scaleParentHeight = function (delta) {
        //_xform.setSize(x, y);
        _parent.getXform().incHeightBy(delta);
    };
    
    self.scaleParentWidth = function (delta) {
        //_xform.setSize(x, y);
        _parent.getXform().incWidthBy(delta);
    };

    self.moveParent = function (x, y) {
        //_xform.setPosition(x, y);
        _parent.getXform().setPosition(x, y);
    };
    
    self.moveParentBy = function (x, y) {
        //_xform.incXPosBy(x);
        //_xform.incYPosBy(y);
        _parent.getXform().incXPosBy(x);
        _parent.getXform().incYPosBy(y);
    };

    self.rotateParent = function (rad) {
        //_xform.setRotationInRad(rad);
        _parent.getXform().setRotationInRad(rad);
    };
    
    // Returns parent xform to manipulate it.
    self.getXform = function () {
        return _parent.getXform();
    };
    
    self.getParent = function () {
        return _parent.getXform();
    };
        
    // Gets and returns all manipulator objects to easily tell where they live 
    // (in case their position changes).
    self.getPositions = function () {
        return {    wcXform: _xform,
                    rotateHandle: _rotateHandle, 
                    scaleHandle: _scaleHandle,
                    moveHandle: _moveHandle,
                    parentMat: _parent.getXform().getXform()};
    };
    
    // Check if the manipulator has been set.
    self.isManipulatorSet = function () {
         if (_parent === undefined)
             return false;
         else
             return true;
    };
    
    // Add a new block that was created to the manipulator's parent.
    self.addNewBlockAsChild = function (newBlock) {
        _parent.addAsChild(newBlock);
        self.setParent(newBlock);  
    };

    // Center
    _moveHandle.setColor([0.9, 0, 0, 1]);
    var xf = _moveHandle.getXform();
    xf.setSize(0.75, 0.75);
    xf.setPosition(0, 0);
    
    self.getName = function () {
        return _name;
    };

    return self;
}