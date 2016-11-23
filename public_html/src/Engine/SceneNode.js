/* File: SceneNode.js 
 *
 * Support for grouping of Renderables with custom pivot ability
 */

/*jslint node: true, vars: true, nomen: true */
/*global PivotedTransform, SquareRenderable, mat4  */
/* find out more about jslint: http://www.jslint.com/help.html */

"use strict";  // Operate in Strict mode such that variables must be declared before used!


function SceneNode(shader, name, drawPivot) {
    this._name = name;
    this._set = [];
    this._children = [];
    this._xform = new PivotedTransform();

    // this is for debugging only: for drawing the pivot position
    this._pivotPos = null;
    if ((drawPivot !== undefined) && (drawPivot === true)) {
        this._pivotPos = new SquareRenderable(shader);
        this._pivotPos.setColor([1, 0, 0, 1]); // default color
        var xf = this._pivotPos.getXform();
        xf.setSize(0.2, 0.2); // always this size
    }
}
SceneNode.prototype.setName = function (n) { this._name = n; };
SceneNode.prototype.getName = function () { return this._name; };

SceneNode.prototype.getXform = function () { return this._xform; };

SceneNode.prototype.size = function () { return this._set.length; };

SceneNode.prototype.getRenderableAt = function (index) {
    return this._set[index];
};

SceneNode.prototype.addToSet = function (obj) {
    this._set.push(obj);
};
SceneNode.prototype.removeFromSet = function (obj) {
    var index = this._set.indexOf(obj);
    if (index > -1)
        this._set.splice(index, 1);
};
SceneNode.prototype._moveToLast = function (obj) {
    this.removeFromSet(obj);
    this.addToSet(obj);
};

// support children opeations
SceneNode.prototype.addAsChild = function (node) {
    this._children.push(node);
};
SceneNode.prototype.removeChild= function (node) {
    var index = this._children.indexOf(node);
    if (index > -1)
        this._children.splice(index, 1);
};
SceneNode.prototype.getChildAt = function (index) {
    return this._children[index];
};

SceneNode.prototype.draw = function (cam, parentMat) {
    var i;
    var xfMat = this._xform.getXform();
    if (parentMat !== undefined)
        mat4.multiply(xfMat, parentMat, xfMat);
    
    // Draw our own!
    for (i = 0; i < this._set.length; i++) {
        this._set[i].draw(cam, xfMat); // pass to each renderable
    }
    
    // now draw the children
    for (i = 0; i < this._children.length; i++) {
        this._children[i].draw(cam, xfMat); // pass to each renderable
    }
    
    // for debugging, let's draw the pivot position
    if (this._pivotPos !== null) {
        var pxf = this.getXform();
        var t = pxf.getPosition();
        var p = pxf.getPivot();
        var xf = this._pivotPos.getXform();
        xf.setPosition(p[0] + t[0], p[1] + t[1]);
        this._pivotPos.draw(cam, parentMat);
    }
};