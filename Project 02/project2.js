// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform(positionX, positionY, rotation, scale) {
	var x = Math.cos(rotation * (Math.PI / 180));
	var y = Math.sin(rotation * (Math.PI / 180));

	return Array(scale * x, scale * y, 0, -scale * y, scale * x, 0, positionX, positionY, 1);
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
	var a = trans2[0];
	var b = trans2[3];
	var c = trans2[6];
	var d = trans2[1];
	var e = trans2[4];
	var f = trans2[7];
	var g = trans2[2];
	var h = trans2[5];
	var i = trans2[8];

	var j = trans1[0];
	var k = trans1[3];
	var l = trans1[6];
	var m = trans1[1];
	var n = trans1[4];
	var o = trans1[7];
	var p = trans1[2];
	var q = trans1[5];
	var r = trans1[8];

	return Array((a * j) + (b * m) + (c * p), (d * j) + (e * m) + (f * p), (g * j) + (h * m) + (i * p),
				(a * k) + (b * n) + (c * q), (d * k) + (e * n) + (f * q), (g * k) + (h * n) + (i * q),
				(a * l) + (b * o) + (c * r), (d * l) + (e * o) + (f * r), (g * l) + (h * o) + (i * r));
}
