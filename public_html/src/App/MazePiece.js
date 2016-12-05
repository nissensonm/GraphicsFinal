/*jslint node: true, vars: true */
/*global gEngine, SimpleShader, SquareRenderable, SceneNode */
/* find out more about jslint: http://www.jslint.com/help.html */

"use strict";  // Operate in Strict mode such that variables must be declared before used!

function MazePiece(shader, name, xPivot, yPivot) {
    SceneNode.call(this, shader, name, true);   // calling super class constructor

    var xf = this.getXform();
    xf.setPivot(xPivot, yPivot);

    var piece = new SquareRenderable(shader);
    this.addToSet(piece);
    piece.setColor([0, 0, 0, 1]); // red
    piece.setDefaultColor([0, 0, 0, 1]);
    xf = piece.getXform();
    xf.setSize(1, 1);
    xf.setPosition(xPivot, yPivot);

   /* piece = new SquareRenderable(shader);
    this.addToSet(piece);
    piece.setColor([1, 0.5, 0, 1]); // orange
    xf = piece.getXform();
    xf.setSize(2.5, 0.5);
    xf.setPosition(xPivot + 0.5, yPivot + 1);

    piece = new SquareRenderable(shader);
    this.addToSet(piece);
    piece.setColor([1, 1, 0, 1]); // yellow
    xf = piece.getXform();
    xf.setSize(0.5, 2);
    xf.setPosition(xPivot + 1, yPivot + 1.5);

    piece = new SquareRenderable(shader);
    this.addToSet(piece);
    piece.setColor([0.5, 1, 0, 1]); // yellow-green
    xf = piece.getXform();
    xf.setSize(2, 0.5);
    xf.setPosition(xPivot + 0.5, yPivot);*/
}
gEngine.Core.inheritPrototype(MazePiece, SceneNode);

SceneNode.prototype.highlight = function (color, recursive) {
    var i;
    
    for (i = 0; i < this.size(); i++) {
        var cur = this.getRenderableAt(i);
        cur.setColor(color);
    }
    
    if (recursive) {
        for (i = 0; i < this.sizeChildren(); i++) {
            var kid = this.getChildAt(i);
            if (kid.highlight) {
                kid.highlight(color, recursive);
            }
        }
    }
};

SceneNode.prototype.unHighlight = function (recursive) {
    var i;
    
    for (i = 0; i < this.size(); i++) {
        var cur = this.getRenderableAt(i);
        cur.setColor(cur.getDefaultColor());
    }
    
    if (recursive) {
        for (i = 0; i < this.sizeChildren(); i++) {
            var kid = this.getChildAt(i);
            if (kid.unHighlight) {
                kid.unHighlight(recursive);
            }
        }
    }
};