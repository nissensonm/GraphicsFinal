/*jslint node: true, vars: true */
/*global gEngine, SimpleShader, SquareRenderable, SceneNode */
/* find out more about jslint: http://www.jslint.com/help.html */

"use strict";  // Operate in Strict mode such that variables must be declared before used!

function Wizard(shader, name, xPivot, yPivot) {
    SceneNode.call(this, shader, name, true);   // calling super class constructor

    var xf = this.getXform();
    xf.setPivot(xPivot, yPivot);

    var wizard = new WizardRenderable(shader);
    this.addToSet(wizard);
    wizard.setColor([1, 1, 0, 1]); 
    xf = wizard.getXform();
    xf.setSize(1, 1);
    xf.setPosition(xPivot, yPivot);
}
gEngine.Core.inheritPrototype(Wizard, SceneNode);