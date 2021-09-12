// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	var x = Math.cos(rotation * (Math.PI / 180));
	var y = Math.sin(rotation * (Math.PI / 180));
	var n = scale * positionX;
	var k = scale * positionY;	

	return Array( x, y, 0, -y, x, 0, n, k, 1 );
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	return Array( 1, 0, 0, 0, 1, 0, 0, 0, 1 );
}
