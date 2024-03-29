/* 
 * File: Transform.js
 * Encapsulates the matrix transformation functionality, meant to work with
 * Renderable
 */

/*jslint node: true, vars: true */
/*global gEngine: false, vec2: false, Math: false, mat4: false, vec3: false */
/* find out more about jslint: http://www.jslint.com/help.html */

"use strict";

function Transform() {
    this._position = vec2.fromValues(0, 0);  // this is the translation
    this._scale = vec2.fromValues(1, 1);     // this is the width (x) and height (y)
    this._rotationInRad = 0.0;               // in radians!
}

// <editor-fold desc="Public Methods">

//<editor-fold desc="Setter/Getter methods">
// // <editor-fold desc="Position setters and getters ">
Transform.prototype.setPosition = function (xPos, yPos) { this.setXPos(xPos); this.setYPos(yPos); };
Transform.prototype.getPosition = function () { return this._position; };
Transform.prototype.getXPos = function () { return this._position[0]; };
Transform.prototype.setXPos = function (xPos) { this._position[0] = parseFloat(xPos); };
Transform.prototype.incXPosBy = function (delta) { this._position[0] += parseFloat(delta); };
Transform.prototype.getYPos = function () { return this._position[1]; };
Transform.prototype.setYPos = function (yPos) { this._position[1] = parseFloat(yPos); };
Transform.prototype.incYPosBy = function (delta) { this._position[1] += parseFloat(delta); };

Transform.prototype.left = function () { return this._position[0]; };
Transform.prototype.right = function () { return this._position[0] + this._scale[0]; };
Transform.prototype.top = function () { return this._position[1] + this._scale[1]; };
Transform.prototype.bottom = function () { return this._position[1]; };
//</editor-fold>

// <editor-fold desc="size setters and getters">
Transform.prototype.setSize = function (width, height) {
    this.setWidth(width);
    this.setHeight(height);
};
Transform.prototype.getSize = function () { return this._scale; };
Transform.prototype.incSizeBy = function (delta) {
    this.incWidthBy(delta);
    this.incHeightBy(delta);
};
Transform.prototype.getWidth = function () { return parseFloat(this._scale[0]); };
Transform.prototype.setWidth = function (width) { this._scale[0] = parseFloat(width); };
Transform.prototype.incWidthBy = function (delta) { this._scale[0] += parseFloat(delta); };
Transform.prototype.getHeight = function () { return parseFloat(this._scale[1]); };
Transform.prototype.setHeight = function (height) { this._scale[1] = parseFloat(height); };
Transform.prototype.incHeightBy = function (delta) { this._scale[1] += parseFloat(delta); };
//</editor-fold>

// <editor-fold desc="rotation getters and setters">
Transform.prototype.setRotationInRad = function (rotationInRadians) {
    this._rotationInRad = rotationInRadians;
    while (this._rotationInRad > (2 * Math.PI)) {
        this._rotationInRad -= (2 * Math.PI);
    }
};
Transform.prototype.setRotationInDegree = function (rotationInDegree) {
    this.setRotationInRad(rotationInDegree * Math.PI / 180.0);
};
Transform.prototype.incRotationByDegree = function (deltaDegree) {
    this.incRotationByRad(deltaDegree * Math.PI / 180.0);
};
Transform.prototype.incRotationByRad = function (deltaRad) {
    this.setRotationInRad(this._rotationInRad + deltaRad);
};
Transform.prototype.getRotationInRad = function () {  return this._rotationInRad; };
Transform.prototype.getRotationInDegree = function () { return this._rotationInRad * 180.0 / Math.PI; };
//</editor-fold>

//</editor-fold>

// returns the matrix the concatenates the transformations defined
Transform.prototype.getXform = function () {
    // Creates a blank identity matrix
    var matrix = mat4.create();

    // The matrices that WebGL uses are transposed, thus the typical matrix
    // operations must be in reverse.

    // Step A: compute translation, for now z is always at 0.0
    mat4.translate(matrix, matrix, vec3.fromValues(this.getXPos(), this.getYPos(), 0.0));
    // Step B: concatenate with rotation.
    mat4.rotateZ(matrix, matrix, this.getRotationInRad());
    // Step C: concatenate with scaling
    mat4.scale(matrix, matrix, vec3.fromValues(this.getWidth(), this.getHeight(), 1.0));

    return matrix;
};
//</editor-fold>