/*
 * File: EngineCore_VertexBuffer.js
 *  
 * defines the object that supports the loading and using of the buffer that 
 * contains vertex positions of a square onto the gGL context
 * 
 * Notice, this is a singleton object.
 */

/*jslint node: true, vars: true */
/*global gEngine: false, Float32Array: false */
/* find out more about jslint: http://www.jslint.com/help.html */

"use strict";  // Operate in Strict mode such that variables must be declared before used!

var gEngine = gEngine || { };

// The VertexBuffer object
gEngine.VertexBuffer = (function () {
    // reference to the vertex positions for the square in the gl context
    var _vertexBuffer, _starVertexBuffer, _wizardVertexBuffer = null;

    // First: define the vertices for our shapes
    var _vertices = [
        // Vertices of SQUARE
        -0.25, -0.25, 0,
        -0.25, 0.25, 0,
        0.25, -0.25, 0,
        0.25, 0.25, 0
    ];
    
    // Define the verticies for a star. 
    var _verticiesOfStar = [
        0.0, 0.0, 0.0,
        0.0, 0.5, 0.0,
        0.1, 0.1, 0.0,
        0.5, 0.1, 0.0,
        0.2, -0.2, 0.0,
        0.3, -0.6, 0.0,
        0.0, -0.3, 0.0,
        -0.3, -0.6, 0.0,
        -0.2, -0.2, 0.0,
        -0.5, 0.1, 0.0,
        -0.1, 0.1, 0.0,
        0.0, 0.5, 0.0
    ];
    
    // Define the verticies of a Wizard!
    // **NOTE: This is a very hacky way of drawing it,
    //  Many of the verticies are drawn twice because I want to start a 
    //  "new" triangle (setting them to the same spot lets me draw starting
    //  from a new point). 
    // In hindsight, Triangle Strip was probably not
    //  the best choice for this. 
    var _verticiesOfWizard = [
        // Left foot
        0.3, -0.6, 0.0,
        0.2, -0.6, 0.0,
        0.3, -0.5, 0.0,
        0.2, -0.5, 0.0,
        0.2, -0.5, 0.0,         
        // Right foot
        -0.2, -0.5, 0.0,
        -0.2, -0.5, 0.0,
        -0.2, -0.6, 0.0,
        -0.3, -0.5, 0.0,
        -0.3, -0.6, 0.0,
        // Body
        -0.2, -0.5, 0.0,
        -0.2, -0.5, 0.0,
        -0.2, 0.0, 0.0,
        0.2, -0.5, 0.0,
        0.2, 0.0, 0.0, 
        //Right Arm
        0.2, 0.0, 0.0,
        0.3, 0.0, 0.0,
        0.3, -0.1, 0.0,
        0.2, -0.1, 0.0,
        0.2, 0.0, 0.0,
        // Left Arm
        -0.2, 0.0, 0.0,
        -0.3, 0.0, 0.0,
        -0.3, -0.1, 0.0,
        -0.2, -0.1, 0.0,
        -0.2, 0.0, 0.0,
        //Beard
        0.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        0.2, 0.2, 0.0,
        -0.2, 0.2, 0.0,
        //Head + Hat
        0.2, 0.4, 0.0,
        -0.2, 0.4, 0.0,
        -0.2, 0.4, 0.0,
        -0.3, 0.4, 0.0,
        0.0, 1.0, 0.0,
        0.3, 0.4, 0.0 
    ];

    var initialize = function () {
        var gl = gEngine.Core.getGL();

        // Step A: Create a buffer on the gGL context for our vertex positions
        _vertexBuffer = gl.createBuffer();

        // Step B: Activate vertexBuffer
        gl.bindBuffer(gl.ARRAY_BUFFER, _vertexBuffer);

        // Step C: Loads vertices into the vertexBuffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_vertices), gl.STATIC_DRAW);
        
        // ** Set up star's buffer.
        _starVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, _starVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_verticiesOfStar), gl.STATIC_DRAW);
        
        // ** Set up THE WIZARD'S buffer.
        _wizardVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, _wizardVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_verticiesOfWizard), gl.STATIC_DRAW);
        
        
    };

    var getGLVertexRef = function () { return _vertexBuffer; };

    var getGLVertexRefStar = function () { return _starVertexBuffer; };
    var getGLVertexRefWizard = function() { return _wizardVertexBuffer; };

    var mPublic = {
        initialize: initialize,
        getGLVertexRef: getGLVertexRef,
        getGLVertexRefStar: getGLVertexRefStar,
        getGLVertexRefWizard: getGLVertexRefWizard
    };

    return mPublic;
}());