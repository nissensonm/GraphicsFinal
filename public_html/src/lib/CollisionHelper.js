/*
 * Author: Andrew Hoke
 * 
 * CollisionHelper is a static object that provides functionality for checking
 * for collisions between two objects
 */

/* global Transform */

// Init or get CollisionHelper object
var CollisionHelper = CollisionHelper || {};

// Checks if a rectangle contains a point.
// Returns true if the point is inside the rectangle; otherwise returns false.
// All three parameters should be 2-element arrays:
//   srcRectPos = [x, y]
//   srcRectSize = [width, height]
//   point = [x, y]
Transform.prototype.Contains = function (point) {
    /*console.log("x >= LEFT() " + point[0] + " " + this.left());
    console.log("y >= bottom() " + point[1] + " " + this.bottom());
    console.log("x <= LEFT() " + point[0] + " " + this.right());
    console.log("y <= bottom() " + point[1] + " " + this.top());*/
    return point[0] >= this.left() &&   // point.x is right of left bound
           point[1] >= this.bottom() && // point.y is above bottom bound
           point[0] <= this.right() &&  // point.x is left of right bound
           point[1] <= this.top();      // point.y is below top bound
};

CollisionHelper.WithinRadius = function (circlePos, circleRad, point) {
    // distance formula: sqrt( (x-h)^2 + (y-k)^2 )
    var distanceFromCircleCenter = Math.sqrt(Math.pow(point[0] - circlePos[0],2) + Math.pow(point[1] - circlePos[1],2));
    
    return distanceFromCircleCenter <= circleRad;
};

// Checks if two Transforms collide.
// Returns true if the Transforms collide; otherwise returns false.
// Parameter is other Transform to check for collision against.
Transform.prototype.Collides = function (other) {
    
    // Cheap collision that checks if any edge is contained by the other triangle's parallel edges
    var hCollide = (this.left() <= other.left() && other.left() <= this.right()) || // this contains other.left
                   (other.left() <= this.left() && this.left() <= other.right()) || // other contains this.left
                   (this.left() <= other.right() && other.right() <= this.right()) || // this contains other.right
                   (other.left() <= this.right() && this.right() <= other.right());  // other contains this.right
       
    var vCollide = (this.top() >= other.top() && other.top() >= this.bottom()) || // this contains other.top
                   (other.top() >= this.top() && this.top() >= other.bottom()) || // other contains this.top
                   (this.top() >= other.bottom() && other.bottom() >= this.bottom()) || // this contains other.bottom
                   (other.top() >= this.bottom() && this.bottom() >= other.bottom()); // other contains this.bottom
       
    return hCollide && vCollide;
    
};