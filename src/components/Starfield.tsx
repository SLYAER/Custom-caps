import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Stars() {
  const count = 5000;
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        p[i * 3] = (Math.random() - 0.5) * 100;
        p[i * 3 + 1] = (Math.random() - 0.5) * 100;
        p[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return p;
  }, []);

  const ref = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (ref.current) {
        ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        ref.current.rotation.x = state.clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <points ref={ref}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.15} color="#ffffff" transparent opacity={0.8} />
    </points>
  );
}

export function StarfieldBackground() {
    return <Stars />;
}
