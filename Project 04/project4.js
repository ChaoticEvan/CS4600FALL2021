// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	var rotXDeg = ConvertToDegrees(rotationX);
	var rotYDeg = ConvertToDegrees(rotationY);

	var rotationXMat = [
		1, 0, 0, 0,
		0, Math.cos(rotXDeg), -Math.sin(rotXDeg), 0,
		0, Math.sin(rotXDeg), Math.cos(rotXDeg), 0,
		0, 0, 0, 1
	];
	var rotationYMat = [
		Math.cos(rotYDeg), 0, Math.sin(rotYDeg), 0,
		0, 1, 0, 0,
		-Math.sin(rotYDeg), 0, Math.cos(rotYDeg), 0,
		0, 0, 0, 1
	];

	var rotationMatrix = MatrixMult(rotationXMat, rotationYMat);


	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	trans = MatrixMult(trans, rotationMatrix);

	var mvp = MatrixMult(projectionMatrix, trans);
	return mvp;
}

// Helper function to conver to degrees. 
function ConvertToDegrees(number) {
	return number * (180 / Math.PI);
}


// Vertex shader source code
var modelVS = `
	attribute vec3 pos;
	uniform mat4 mvp;

	void main()
	{
		gl_Position = mvp * vec4(pos,1);
	}
`;
// Fragment shader source code
var modelFS = `
	precision mediump float;
	void main()
	{
		gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
	}
`;
class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(modelVS, modelFS);
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		this.vertPos = gl.getAttribLocation(this.prog, 'pos');
	}

	// This method is called every time the user opens an OBJ file.
	//
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	//
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	//
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	//
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// 
	// Note that this method can be called multiple times.
	setMesh(vertPos, texCoords) {
		// [TO-DO] Get texCoords integrated
		this.vertbuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		this.numTriangles = vertPos.length / 3;
	}

	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap) {
		// [TO-DO] Set the uniform parameter(s) of the vertex shader


		if (swap) {

		}
		else {

		}
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		// [TO-DO] Maybe need to change this code for adding texture?
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvp, false, trans);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		// [TO-DO] Bind the texture

		// You can set the texture image data using the following command.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
	}

	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture(show) {
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
	}

}
// This is a helper function for compiling the given vertex and fragment shader source code into a program.
function InitShaderProgram(vsSource, fsSource) {
	const vs = CompileShader(gl.VERTEX_SHADER, vsSource);
	const fs = CompileShader(gl.FRAGMENT_SHADER, fsSource);

	const prog = gl.createProgram();
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);

	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(prog));
		return null;
	}
	return prog;
}