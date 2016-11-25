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


                parentMat[12] =  xformCalculatePosition[12];
                parentMat[13] =  xformCalculatePosition[13];
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
            
            // If the parent xform is a PivotedTransform, use the pivot as the position
            //if (pxf.getPivot !== undefined) {
                //var pivot = pxf.getPivot();
                //_xform.setPivot(pivot[0], pivot[1]);
                //_xform.setPosition(pivot[0], pivot[1]);
            //}    
            //_xform.setSize(pxf.getWidth(), pxf.getHeight());
            //_xform.setRotationInRad(pxf.getRotationInRad());
        } else {
            // "Hide" the manipulator
            _xform.setPosition(-999,-999);
        }
    };

    self.scaleParent = function (x, y) {
        //_xform.setSize(x, y);
        _parent.getXform().incSizeBy(x, y);
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
    
    // Top
    _rotateHandle.setColor([0, 0.9, 0, 1]);
    var xf = _rotateHandle.getXform();
    xf.setSize(0.75, 0.75);
    xf.setPosition(0, 1.5);
    
    _rotateLine.setColor([0, 0, 0, 1]);
    xf = _rotateLine.getXform();
    xf.setSize(0.125, 3);
    xf.setPosition(0, 0.75);
    
    // Right
    _scaleHandle.setColor([0, 0, 0.9, 1]);
    xf = _scaleHandle.getXform();
    xf.setSize(0.75, 0.75);
    xf.setPosition(1.5, 0);
    
    _scaleLine.setColor([0, 0, 0, 1]);
    xf = _scaleLine.getXform();
    xf.setSize(3, 0.125);
    xf.setPosition(0.75, 0);
    
    // Center
    _moveHandle.setColor([0.9, 0, 0, 1]);
    xf = _moveHandle.getXform();
    xf.setSize(0.75, 0.75);
    xf.setPosition(0, 0);
    
    self.getName = function () {
        return _name;
    };

    return self;
}