import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  void main() {
    // Standard projection for the massive sphere
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float iTime;
  uniform vec2 iResolution;

  void main() {
      // Screen space UVs!
      vec2 uv = gl_FragCoord.xy / iResolution.xy;
      uv = (uv - 0.5) * 2.0;
      uv.x *= iResolution.x / iResolution.y;

      vec3 col = vec3(0.0);

      // Simple 2D approximation of a black hole (Gargantua style)
      float d = length(uv);
      
      // Black hole event horizon
      float eventHorizonRadius = 0.35;
      float eventHorizon = smoothstep(eventHorizonRadius, eventHorizonRadius + 0.02, d);
      
      // Angle for rotation
      float angle = atan(uv.y, uv.x);
      
      // Accretion disk (the main glowing ring)
      float diskDist = abs(d - 0.6);
      float disk = smoothstep(0.4, 0.0, diskDist);
      
      // Add Doppler beaming
      float doppler = 1.0 + 0.6 * sin(angle);
      
      // The horizontal "ring" across the front of the black hole
      float crossRingRadius = length(vec2(uv.x, uv.y * 5.0));
      float crossRing = smoothstep(0.8, 0.4, crossRingRadius) * smoothstep(0.3, 0.4, crossRingRadius);
      crossRing *= step(0.0, -uv.y + 0.1); 
      crossRing *= (1.0 + 0.8 * sign(uv.x)); 
      
      // Combine disk & cross ring
      float accretion = (disk + crossRing) * doppler;
      
      // Swirling noise animation
      float noise = sin(d * 20.0 - iTime * 3.0 + angle * 4.0) * 0.5 + 0.5;
      accretion *= mix(0.5, 1.0, noise);
      
      // Lensing effect on the stars
      float lens = 1.0 - smoothstep(eventHorizonRadius, eventHorizonRadius + 0.5, d);
      vec2 lensedUv = uv * (1.0 + lens * 0.5);
      float stars = pow(fract(sin(dot(lensedUv, vec2(12.9898, 78.233))) * 43758.5453) * 1.5, 20.0);
      
      // Colorization
      vec3 diskColor = vec3(1.0, 0.5, 0.2); 
      vec3 coreGlow = vec3(1.0, 0.8, 0.5) * smoothstep(0.4, 0.35, d); 
      
      col = mix(vec3(stars), diskColor * accretion * 2.0 + coreGlow * 2.0, smoothstep(0.0, 0.5, accretion));
      
      col *= eventHorizon;
      
      float glow = exp(-d * 3.0);
      col += diskColor * glow * 0.4;
      
      col += vec3(0.05, 0.02, 0.05) * (1.0 - length(uv) * 0.5);

      gl_FragColor = vec4(col, 1.0);
  }
`;

export function AnimatedBlackHole() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.iTime.value = state.clock.elapsedTime * 0.5;
      materialRef.current.uniforms.iResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh renderOrder={-10}>
      {/* Massive sphere wrapping the entire scene */}
      <sphereGeometry args={[50, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          iTime: { value: 0 },
          iResolution: { value: new THREE.Vector2() }
        }}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
