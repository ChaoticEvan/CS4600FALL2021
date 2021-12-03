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
	varying vec3 normal;
	varying vec3 position;

	void main()
	{
		gl_Position = mvp * vec4(pos, 1);
		texCoord = txc;
		normal = norm;
		position = pos;
	}
`;
// Fragment shader source code
var modelFS = `
	precision mediump float;

	uniform sampler2D tex;
	uniform float alpha;

	// Uniforms from VS
	uniform mat3 normMat;
	uniform vec3 lightDir;	

	varying vec2 texCoord;
	varying vec3 normal;
	varying vec3 position;

	void main()
	{
		vec3 lightCol = vec3(1,1,1);
		vec4 Kd = vec4(1,1,1,1);
		vec4 Ks = vec4(1,1,1,1);
		
		// math:
		// vec4(1,1,1,1) * ((dot(transNorm, lightDir) * Kd) + 
		// (Ks * dot(transNorm, h)^alpha))

		vec3 transformedNormal = normMat * normal;
		float cosTheta = dot(transformedNormal, lightDir);		

		vec3 h = normalize(lightDir - position);
		float cosPhi = dot(transformedNormal, h);
		
		vec4 lhs = cosTheta * Kd;
		vec4 rhs = Ks * pow(cosPhi, alpha);

		//gl_FragColor = lhs + rhs;
		gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
	}
`;

class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(modelVS, modelFS);
		gl.useProgram(this.prog);

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
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh(vertPos, texCoords, normals) {
		gl.useProgram(this.prog);

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
		gl.uniform1f(this.alpha, shininess);
	}
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution) {
	var forces = Array(positions.length); // The total for per particle
	forces.fill(new Vec3(0, 0, 0));

	// Update forces
	for (var i = 0; i < forces.length; ++i) {
		forces[i].inc(gravity.mul(particleMass));
	}

	for (var i = 0; i < springs.length; ++i) {
		// Get position and velocity vectors for curr p0 and p1
		var posX0, posY0, posZ0,
			posX1, posY1, posZ1,
			velX0, velY0, velZ0,
			velX1, velY1, velZ1;

		posX0 = positions[springs[i].p0].x;
		posY0 = positions[springs[i].p0].y;
		posZ0 = positions[springs[i].p0].z;

		posX1 = positions[springs[i].p1].x;
		posY1 = positions[springs[i].p1].y;
		posZ1 = positions[springs[i].p1].z;

		velX0 = velocities[springs[i].p0].x;
		velY0 = velocities[springs[i].p0].y;
		velZ0 = velocities[springs[i].p0].z;

		velX1 = velocities[springs[i].p1].x;
		velY1 = velocities[springs[i].p1].y;
		velZ1 = velocities[springs[i].p1].z;

		// Init vectors
		var posVector0 = new Vec3();
		posVector0.init(posX0, posY0, posZ0);

		var posVector1 = new Vec3();
		posVector1.init(posX1, posY1, posZ1);

		var velVector0 = new Vec3();
		velVector0.init(velX0, velY0, velZ0);

		var velVector1 = new Vec3();
		velVector1.init(velX1, velY1, velZ1);

		// Calculate spring force
		var lVector = posVector1.sub(posVector0);
		var l = lVector.len();
		var dVector = posVector1.sub(posVector0);
		var d = dVector.div(l);
		var lhs = stiffness * (l - springs[i].rest);

		var springForce = d.mul(lhs);

		// Calculate damping Force
		var v1MinusV0 = velVector1.sub(velVector0);
		var lDot = v1MinusV0.dot(d);
		var dampingLhs = damping * lDot;

		var dampingForce = d.mul(dampingLhs);

		// Update forces
		forces[springs[i].p0].inc(springForce.add(dampingForce));
		forces[springs[i].p1].dec(springForce.add(dampingForce));
	}

	// Update positions and velocities using semi-implicit euler integration
	for (var i = 0; i < positions.length; ++i) {
		// Calculate new acceleration
		var a = forces[i].div(particleMass);

		// Calculate new velocity
		var dtA = a.mul(dt);
		velocities[i].inc(dtA);

		// Calculate new position
		var dtV = velocities[i].mul(dt);
		positions[i].inc(dtV);
	}

	// [TO-DO] Handle collisions


}

