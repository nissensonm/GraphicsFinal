/*
 * File: CanvasMouseSupport.js 
 * Provides support for computing mouse pixel position in the main drawing canvas
 */
/*jslint node: true, vars: true */
/*global document */
/* find out more about jslint: http://www.jslint.com/help.html */


"use strict";  // Operate in Strict mode such that variables must be declared before used!

function CanvasMouseSupport(canvasID) {
    this._canvas = document.getElementById(canvasID);
    this.refreshBounds();
}

CanvasMouseSupport.prototype.refreshBounds = function () {
    var canvasBounds = this._canvas.getBoundingClientRect();
    this.mCanvasWidth = this._canvas.width;
    this.mCanvasHeight = this._canvas.height;
    this.mCanvasBoundsTop = canvasBounds.top;
    this.mCanvasBoundsLeft = canvasBounds.left;
    this.mCanvasXRatio = this.mCanvasWidth / canvasBounds.width;
    this.mCanvasYRatio = this.mCanvasHeight / canvasBounds.height;
};

CanvasMouseSupport.prototype.getPixelXPos = function (event) {
    return Math.round((event.clientX -  this.mCanvasBoundsLeft) * this.mCanvasXRatio);
};
CanvasMouseSupport.prototype.getPixelYPos = function (event) {
    var y  = Math.round((event.clientY -  this.mCanvasBoundsTop) * this.mCanvasYRatio);
    return (this.mCanvasHeight - 1 - y);
};