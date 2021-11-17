// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
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
	return trans;
}

// Helper function to conver to degrees. 
function ConvertToDegrees(number) {
	return number * (180 / Math.PI);
}


// Vertex shader source code
var modelVS = `
	attribute vec3 pos;
	attribute vec3 norm;
	attribute vec2 txc;

	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 normMat;
	uniform vec3 lightDir;	

	varying vec2 texCoord;	
	varying float cosTheta;
	varying float cosPhi;

	void main()
	{
		gl_Position = mvp * vec4(pos, 1);
		texCoord = txc;


		// rough math:
		// ((norm * lightDir) * texCoord)
		// + (lightCol * (norm * ( (lightDir - pos) / |lightDir - pos|) )^alpha ) 

		vec3 transformedNormal = normMat * norm;
		cosTheta = dot(transformedNormal, lightDir);		
		vec3 h = (lightDir - normalize(pos)) / (abs(lightDir - normalize(pos)));
		cosPhi = dot(transformedNormal, h);
	}
`;
// Fragment shader source code
var modelFS = `
	precision mediump float;

	uniform sampler2D tex;
	uniform float alpha;

	varying vec2 texCoord;
	varying float cosTheta;
	varying float cosPhi;

	void main()
	{
		vec3 lightCol = vec3(1,1,1);
		vec4 texelColor = texture2D(tex, texCoord);
		gl_FragColor = (cosTheta * texelColor) + vec4((lightCol * pow(cosPhi, alpha), 1));				
	}
`;

class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(modelVS, modelFS);

		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		this.sampler = gl.getUniformLocation(this.prog, 'tex');
		this.lightDir = gl.getUniformLocation(this.prog, 'lightDir');
		this.mv = gl.getUniformLocation(this.prog, 'mv');
		this.normMat = gl.getUniformLocation(this.prog, 'normMat');
		this.alpha = gl.getUniformLocation(this.prog, 'alpha');

		this.vertPos = gl.getAttribLocation(this.prog, 'pos');
		this.textureCoord = gl.getAttribLocation(this.prog, 'txc');
		this.normals = gl.getAttribLocation(this.prog, 'norm');
	}

	// This method is called every time the user opens an OBJ file.
	//
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	//
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	//
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	//
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	//
	// Note that this method can be called multiple times.
	setMesh(vertPos, texCoords, normals) {
		this.vertbuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		this.texBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.normBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}

	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap) {
		for (let i = 0; i < this.vertPos.length; i += 3) {
			var tempY = this.vertPos[i + 1];
			this.vertPos[i + 1] = this.vertPos[i + 2];
			this.vertPos[i + 2] = tempY;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertPos), gl.STATIC_DRAW);
	}

	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw(matrixMVP, matrixMV, matrixNormal) {
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix4fv(this.mv, false, matrixMV);
		gl.uniformMatrix3fv(this.normMat, false, matrixNormal);


		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.vertPos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.vertexAttribPointer(this.textureCoord, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.textureCoord);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.vertexAttribPointer(this.normals, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normals);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		gl.useProgram(this.prog);

		this.tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.tex);

		// You can set the texture image data using the following command.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			gl.LINEAR_MIPMAP_LINEAR
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_S,
			gl.REPEAT
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_T,
			gl.REPEAT
		);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tex);
		gl.uniform1i(this.sampler, 0);
	}

	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture(show) {
		if (show) {

		}
		else {

		}
	}

	// This method is called to set the incoming light direction
	setLightDir(x, y, z) {
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDir, x, y, z);
	}

	// This method is called to set the shininess of the material
	setShininess(shininess) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.alpha, shininess);
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