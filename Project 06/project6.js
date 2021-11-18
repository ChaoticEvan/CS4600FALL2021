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
		r.pos = position;
		r.dir = lights[i].position - r.pos;
		bool isShadow = IntersectRay(currHit, r);

		// If no intersections are found on way to light source,
		// then shade the point
		if (!isShadow) {
			float cosTheta = dot(normal, lights[i].position);
			vec3 h = normalize(lights[i].position + view);
			float cosPhi = dot(normal, h);
			
			vec3 lhs = cosTheta * mtl.k_d;
			vec3 rhs = mtl.k_s * pow(cosPhi, mtl.n);

			color += lights[i].intensity * (lhs + rhs);			
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
		float b = dot((2.0 * ray.dir), ray.pos - spheres[i].center);
		float c = dot(ray.pos - spheres[i].center, ray.pos - spheres[i].center) - pow(spheres[i].radius, 2.0);

		float delta = pow(b, 2.0) - (4.0 * a * c);

		// If hit is found, then check to see if its closest hit
		if (delta >= 0.0) {
			foundHit = true;

			float tNumer = -b - sqrt(delta);
			float tDenom = 2.0 * a;
			float t = tNumer / tDenom;

			// If current sphere is closest, update hit information
			if (hit.t > t) {
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
			
			r.pos = hit.position;
			r.dir = hit.normal;
			
			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				clr += Shade(h.mtl, h.position, h.normal, view);
				// TO-DO: Update the loop variables for tracing the next reflection ray
				//hit = h;
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