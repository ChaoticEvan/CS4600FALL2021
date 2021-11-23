var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		HitInfo currHit;
		Ray r;

		vec3 lightDir = normalize(lights[i].position - position);
		r.pos = position + (0.001 * lightDir);
		r.dir = lightDir;
		
		bool isShadow = IntersectRay(currHit, r);

		float cosTheta = dot(normal, lightDir);
		vec3 h = normalize(lightDir + view);
		float cosPhi = dot(normal, h);

		// If no intersections are found on way to light source,
		// then shade the point
		if (!isShadow) {			
			vec3 lhs = max(0.0, cosTheta) * mtl.k_d;
			vec3 rhs = mtl.k_s * pow(max(0.0, cosPhi), mtl.n);

			color += lhs + rhs;
			//color += mtl.k_d * lights[i].intensity;
		} 
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;	
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		float a = dot(ray.dir, ray.dir);
		vec3 twoD = 2.0 * ray.dir;
		vec3 pc = ray.pos - spheres[i].center;
		float b = dot(twoD, pc);
		float radSquare = pow(spheres[i].radius, 2.0);
		float c = dot(pc, pc) - radSquare;

		float delta = pow(b, 2.0) - (4.0 * a * c);

		// If hit is found, then check to see if its closest hit
		if (delta >= 0.0) {
			float tNumer = -b - sqrt(delta);
			float tDenom = 2.0 * a;
			float t = tNumer / tDenom;

			// If current sphere is closest, update hit information
			if (hit.t > t && t > 0.0) {
				foundHit = true;
				hit.t = t;
				hit.position = ray.pos + (hit.t * ray.dir);
				hit.normal = hit.position - spheres[i].center;
				hit.mtl = spheres[i].mtl;
			}
		}
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			r.dir = -view - 2.0 * dot(-view, hit.normal) * hit.normal;
			r.pos = hit.position + (r.dir * 0.001);
			
			if ( IntersectRay( h, r ) ) {
				clr += Shade(h.mtl, h.position, h.normal, view);
				
				hit = h;
				k_s = h.mtl.k_s;
				view = normalize(-r.dir);
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;