/*jslint node: true, vars: true */
/*global gEngine, SimpleShader, SquareRenderable, SceneNode */
/* find out more about jslint: http://www.jslint.com/help.html */

"use strict";  // Operate in Strict mode such that variables must be declared before used!

function Star(shader, name, xPivot, yPivot) {
    SceneNode.call(this, shader, name, true);   // calling super class constructor

    var xf = this.getXform();
    xf.setPivot(xPivot, yPivot);

    var star = new StarRenderable(shader);
    this.addToSet(star);
    star.setColor([1, 0, 0, 1]); 
    xf = star.getXform();
    xf.setSize(.5, .5);
    xf.setPosition(xPivot, yPivot);
}
gEngine.Core.inheritPrototype(Star, SceneNode);