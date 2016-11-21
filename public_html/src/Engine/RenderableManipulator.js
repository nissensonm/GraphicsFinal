/*
 * Author: Andrew Hoke, Michael Nissenson
 * RenderableManipulator class defines behavior for a manipulator object used
 * to manipulate a Renderable object on a WebGL canvas.
 */

/*jslint nomen: true, devel: true*/
/*global SquareRenderable, Transform, mat4*/

function RenderableManipulator(parent, shader) {
    'use strict';
    var self = {},
        _parent = parent,
        _xform = new Transform(),
        _moveHandle = new SquareRenderable(shader),
        _rotateHandle = new SquareRenderable(shader),
        _rotateLine = new SquareRenderable(shader),
        _scaleHandle = new SquareRenderable(shader),
        _scaleLine = new SquareRenderable(shader);

    self.draw = function (camera) {
        var parentMat = _parent.getXform().getXform();
        // Transform pivot point by parent transform
        mat4.multiply(parentMat, _xform.getXform(), parentMat);

        _moveHandle.draw(camera, parentMat);
        _rotateHandle.draw(camera, parentMat);
        _rotateLine.draw(camera, parentMat);
        _scaleHandle.draw(camera, parentMat);
        _scaleLine.draw(camera, parentMat);
    };

    self.setParent = function (newParent) {
        _parent = newParent;
        updatePos();
    };

    self.scaleParent = function (x, y) {
        _xform.setSize(x, y);
    };

    self.moveParent = function (x, y) {
        _xform.setPosition(x, y);
    };

    self.rotateParent = function (rad) {
        _xform.setRotationInRad(rad);
    };

    return self;
}