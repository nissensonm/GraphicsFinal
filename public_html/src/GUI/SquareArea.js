 /*
  * Author: Andrew Hoke
  * 
  *  SquareArea.js defines behavior for the SquareArea object, which allows
  *  an area on an HTML5 canvas to be surrounded by a solid border. 
  */
 
/* global gEngine */

function SquareArea(shader, pos, size, thickness) {
    var PublicInstance;

    var _edges = {
        Top: new SquareRenderable(shader),
        Left: new SquareRenderable(shader),
        Bottom: new SquareRenderable(shader),
        Right: new SquareRenderable(shader)
        },
        // Tracks size of area as well as its target position on the canvas
        // The SquareArea is pretty much a customized SceneNode, and this is a
        // simplified PivotTransform because the pivot is always the bottom left.
        _xform = new Transform(),
        _thickness = thickness,
        _grabber = new SquareRenderable(shader),
        _drawGrabber = true;
   
    
    // Draw the area with the provided camera
    function draw(camera) {
        var vp = camera.getViewport(),
            gl = gEngine.Core.getGL();
    
        // Make sure the viewport is set up because we aren't using
        // Camera.setUpViewProjection() to avoid clearing the canvas!
        gl.viewport(vp[0], vp[1], vp[2], vp[3]);
        
        for (var i in _edges) {
            _edges[i].draw(camera);
        }
        
        if (_drawGrabber) {
            _grabber.draw(camera);
        }
    }
    
    // Set the position (bottom left) of the area
    function setPosition(x, y) {
        var halfWidth = _xform.getWidth() / 2,
            halfHeight = _xform.getHeight() / 2;
        x = parseFloat(x);
        y = parseFloat(y);
        _xform.setPosition(x, y);
        _edges.Top.getXform().setPosition(x + halfWidth, y + _xform.getHeight());
        _edges.Left.getXform().setPosition(x, y + halfHeight);
        _edges.Bottom.getXform().setPosition(x + halfWidth, y);
        _edges.Right.getXform().setPosition(x + _xform.getWidth(), y + halfHeight);
        _grabber.getXform().setPosition(x + halfWidth, y + halfHeight);
    }
    
    // Set the thickness of the border
    function setBorderThickness(thickness) {
        _thickness = parseFloat(thickness);
        _edges.Top.getXform().setHeight(_thickness);
        _edges.Left.getXform().setWidth(_thickness);
        _edges.Bottom.getXform().setHeight(_thickness);
        _edges.Right.getXform().setWidth(_thickness);
        // Width needs to be adjusted after changing the thickness
        setWidth(_xform.getWidth());
    }
    
    // Set the width of the area
    function setWidth(width) {
        width = parseFloat(width); // I hate you javascript!!!!!!!!!!!!!
        _xform.setWidth(width);
        _edges.Top.getXform().setWidth(width * 2 + _thickness);
        _edges.Bottom.getXform().setWidth(width * 2 + _thickness);
        // Transform relative to "parent" transform
        _edges.Top.getXform().setXPos(_xform.getXPos() + width / 2);
        _edges.Bottom.getXform().setXPos(_xform.getXPos() + width / 2);
        _edges.Right.getXform().setXPos(_xform.getXPos() + width);
        // Update grabber position
        _grabber.getXform().setXPos(_xform.getXPos() + width / 2);
    }

    // Set the height of the area
    function setHeight(height) {
        height = parseFloat(height); // I still hate you javascript >:#
        _xform.setHeight(height);
        _edges.Left.getXform().setHeight(height + _xform.getHeight());
        _edges.Right.getXform().setHeight(height + _xform.getHeight());
        // Transform relative to "parent" transform
        _edges.Top.getXform().setYPos(_xform.getXPos() + height);
        _edges.Left.getXform().setYPos(_xform.getYPos() + parseFloat(height) / 2);
        _edges.Right.getXform().setYPos(_xform.getYPos() + parseFloat(height) / 2);
        // Update grabber position
        _grabber.getXform().setYPos(_xform.getYPos() + height / 2);
    }
    
    function setSize(x, y) {
        setWidth(x);
        setHeight(y);
    }
    
    function setLineColor(color) {
        for (var i in _edges) {
            _edges[i].setColor(color);
        }
    }
    
    function getGrabberXform() {
        return _grabber.getXform();
    }
    
    function setGrabberSize(x, y) {
        _grabber.getXform().setSize(x, y);
    }
    
    function setGrabberColor(color) {
        _grabber.setColor(color);
    }
    
    function enableGrabber(state) {
        _drawGrabber = state;
    }
    
    function getHeight() {
        return _xform.getHeight();
    }
    
    function getWidth() {
        return _xform.getWidth();
    }
    
    function getPosition() {
        return _xform.getPosition();
    }
    
    // Initial setup using initial parameters
    setPosition(pos[0], pos[1]);
    setWidth(size[0]);
    setHeight(size[1]);
    setBorderThickness(thickness);
    
    _grabber.getXform().setSize(5,5);

    // What the application can see when it calls new SquareArea()
    PublicInstance = {
        draw: draw,
        setPosition: setPosition,
        setBorderThickness: setBorderThickness,
        setWidth: setWidth,
        setHeight: setHeight,
        setSize: setSize,
        setLineColor: setLineColor,
        getGrabberXform: getGrabberXform,
        setGrabberSize: setGrabberSize,
        setGrabberColor: setGrabberColor,
        enableGrabber: enableGrabber,
        getWidth: getWidth,
        getHeight: getHeight,
        getPosition: getPosition
    };

    return PublicInstance;
}