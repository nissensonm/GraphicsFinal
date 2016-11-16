/*
 * Author: Andrew Hoke
 * 
 * CollisionHelper is a static object that provides functionality for checking
 * for collisions between two objects
 */

// Init or get CollisionHelper object
var CollisionHelper = CollisionHelper || {};

// Init or get Rect utility
CollisionHelper.Rect = CollisionHelper.Rect || {};
CollisionHelper.Circ = CollisionHelper.Circ || {};

// Checks if a rectangle contains a point.
// Returns true if the point is inside the rectangle; otherwise returns false.
// All three parameters should be 2-element arrays:
//   srcRectPos = [x, y]
//   srcRectSize = [width, height]
//   point = [x, y]
CollisionHelper.Rect.Contains = function (srcRectPos, srcRectSize, point) {
    var top = srcRectPos[1] + srcRectSize[1] / 2,
        bottom = srcRectPos[1] - srcRectSize[1] / 2,
        left = srcRectPos[0] - srcRectSize[0] / 2,
        right = srcRectPos[0] + srcRectSize[0] / 2;
    return point[0] >= left && // point.x is right of left bound
           point[1] >= bottom && // point.y is above bottom bound
           point[0] <= right &&         // point.x is left of right bound
           point[1] <= top;         // point.y is below top bound
};

CollisionHelper.Circ.WithinRadius = function (circlePos, circleRad, point) {
    // distance formula: sqrt( (x-h)^2 + (y-k)^2 )
    var distanceFromCircleCenter = Math.sqrt(Math.pow(point[0] - circlePos[0],2) + Math.pow(point[1] - circlePos[1],2));
    
    return distanceFromCircleCenter <= circleRad;
};

// Checks if two rectangles collide.
// Returns true if the rectangles collide; otherwise returns false.
// All four parameters should be 2-element arrays:
//   aRectPos = [x, y]
//   aRectSize = [width, height]
//   bRectPos = [x, y]
//   bRectSize = [width, height]
CollisionHelper.Rect.Collides = function (aRectPos, aRectSize, bRectPos, bRectSize) {
    // Cheap collision that checks if any edge is contained by the other triangle's parallel edges
    var aTop = aRectPos[1];
    var aLeft = aRectPos[0];
    var aRight = aRectPos[0] + aRectSize[0];
    var aBottom = aRectPos[1] + aRectSize[1];
    var bTop = bRectPos[1];
    var bLeft = bRectPos[0];
    var bRight = bRectPos[0] + bRectSize[0];
    var bBottom = bRectPos[1] + bRectSize[1];
    
    var vCollide = false;
    var hCollide = false;
    
    // Check for collision on x axis
    hCollide = (aLeft <= bLeft && bLeft <= aRight) || // a contains bLeft
               (bLeft <= aLeft && aLeft <= bRight) || // b contains aLeft
               (aLeft <= bRight && bRight <= aRight) || // a contains bRight
               (bLeft <= aRight && aRight <= bRight);  // b contains aRight
       
    vCollide = (aTop <= bTop && bTop <= aBottom) || // a contains bTop
               (bTop <= aTop && aTop <= bBottom) || // b contains aTop
               (aTop <= bBottom && bBottom <= aBottom) || // a contains bBottom
               (bTop <= aBottom && aBottom <= bBottom); // b contains aBottom
       
    return hCollide && vCollide;
    
};