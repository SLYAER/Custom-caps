import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Decal, ContactShadows } from '@react-three/drei';
import { TextureLoader, Texture } from 'three';
import { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';

// 1. Utilities for Decals

function LogoDecal({ url, scale = 1, positionY = 0, radius = 1 }: { url: string, scale?: number, positionY?: number, radius?: number }) {
  const [texture, setTexture] = useState<Texture | null>(null);
  useEffect(() => {
    if (!url) {
       setTexture(null);
       return;
    }
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.needsUpdate = true;
      setTexture(tex);
    };
  }, [url]);

  if (!texture) return null;
  return (
    <Decal
      position={[0, positionY, radius]} 
      rotation={[0, 0, 0]}
      scale={[radius * 2 * scale, radius * 2 * scale, radius * 8]}
    >
      <meshStandardMaterial 
        map={texture} 
        transparent={true}
        depthWrite={false}
        alphaTest={0.01}
        polygonOffset={true}
        polygonOffsetFactor={-10}
        color="#ffffff"
        roughness={0.2}
      />
    </Decal>
  );
}

function TextDecal({ text, color, scale = 1, positionY = 0, radius = 1, font = 'Inter' }: { text: string; color: string; scale?: number, positionY?: number, radius?: number, font?: string }) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const [aspect, setAspect] = useState(1);

  useEffect(() => {
    if (!text) {
      setTexture(null);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 1024;
    
    // We want the text to be massive on the canvas so it resolves sharply
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let fontSize = 350 * scale;
      if (text.length > 8) fontSize = 300 * scale;
      if (text.length > 12) fontSize = 240 * scale;
      if (text.length > 16) fontSize = 180 * scale;
      if (text.length > 20) fontSize = 150 * scale;
      
      ctx.font = `bold ${fontSize}px ${font}, sans-serif`;
      
      // We'll use a maximum width so long text squeezes nicely to wrap the bottle
      ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 40);
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      
      setAspect(canvas.height / canvas.width);
      setTexture(tex);
    }
  }, [text, color, font]);

  if (!texture) return null;

  const circumference = 2 * Math.PI * radius;
  // A taller cylinder looks better, allowing large text scaling
  // We decouple the canvas scaling from the 3D height scale, which avoids stretching
  const cylinderHeight = circumference * aspect * 3.0;

  return (
    <mesh position={[0, positionY, 0]} rotation={[0, Math.PI, 0]}>
      <cylinderGeometry args={[radius + 0.005, radius + 0.005, cylinderHeight, 64, 1, true]} />
      <meshStandardMaterial 
        map={texture} 
        transparent={true}
        depthWrite={false}
        alphaTest={0.01}
        polygonOffset={true}
        polygonOffsetFactor={-4}
        color="#ffffff"
        roughness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// 2. Geometries

const getBorosilPoints = () => {
    const pts = [];
    const h = 4.8;
    const r = 0.95;
    for (let i = 0; i <= 5; i++) {
      const a = (i / 5) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.sin(a) * r, (1 - Math.cos(a)) * 0.15));
    }
    pts.push(new THREE.Vector2(r, 0.15));
    pts.push(new THREE.Vector2(r, h - 0.4));
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * (Math.PI / 2);
      pts.push(new THREE.Vector2(r - (1 - Math.cos(a)) * (r - 0.65), h - 0.4 + Math.sin(a) * 0.4));
    }
    pts.push(new THREE.Vector2(0.65, h + 0.1));
    return pts;
};

const getMiltonPoints = () => {
    const pts = [];
    for ( let i = 0; i <= 5; i ++ ) {
        const a = (i / 5) * (Math.PI / 2);
        pts.push( new THREE.Vector2( Math.sin(a) * 0.85, (1 - Math.cos(a)) * 0.15 ) );
    }
    for ( let i = 0; i <= 10; i ++ ) {
        const t = i / 10;
        pts.push( new THREE.Vector2( 0.85 + Math.sin(t*Math.PI)*0.02, 0.15 + t * 2.2 ) );
    }
    for ( let i = 0; i <= 20; i ++ ) {
        const t = i / 20;
        const r = 0.85 * (1 - t) * (1 - t) + 0.55 * 2 * (1 - t) * t + 0.35 * t * t;
        const y = 2.35 + t * 1.5;
        pts.push( new THREE.Vector2( r, y ) );
    }
    pts.push( new THREE.Vector2( 0.35, 3.85 ) );
    pts.push( new THREE.Vector2( 0.4, 3.9 ) );
    pts.push( new THREE.Vector2( 0.35, 3.95 ) );
    return pts;
};

const getGlassPoints = () => {
    const pts = [];
    const h = 4.0;
    const r = 0.9;
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(r, 0));
    pts.push(new THREE.Vector2(r, h));
    pts.push(new THREE.Vector2(r - 0.1, h + 0.3));
    pts.push(new THREE.Vector2(0.4, h + 0.5));
    pts.push(new THREE.Vector2(0.4, h + 0.8));
    return pts;
};

const getPlasticPoints = () => {
    const pts = [];
    const h = 3.6;
    const r = 0.9;
    for (let i = 0; i <= 5; i++) {
        const a = (i / 5) * (Math.PI / 2);
        pts.push(new THREE.Vector2(Math.sin(a) * r, (1 - Math.cos(a)) * 0.1));
    }
    // Wavy body
    for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        pts.push(new THREE.Vector2(r - 0.05 + Math.sin(t * Math.PI * 4) * 0.05, 0.1 + t * h));
    }
    // Neck
    for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        pts.push(new THREE.Vector2(r - 0.05 - t * (r - 0.5), 0.1 + h + t * 0.5));
    }
    pts.push(new THREE.Vector2(0.4, h + 0.6));
    pts.push(new THREE.Vector2(0.4, h + 1.0));
    return pts;
};

// 3. Main Component

function RealisticBottle({ selection, material, color, capColor, customText, textColor, logo }: any) {
  const { pts, cap, glassMat, metalMat, plasticMat } = useMemo(() => {
    return {
      borosilPts: getBorosilPoints(),
      miltonPts: getMiltonPoints(),
      glassPts: getGlassPoints(),
      plasticPts: getPlasticPoints(),
    }
  }, []);

  const glassMaterialProps = {
      color: color === '#ffffff' ? '#fafafa' : color, transmission: 0.95, opacity: 1, metalness: 0,
      roughness: 0.1, ior: 1.52, thickness: 1.5, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 2, transparent: true,
  };
  const metalMaterialProps = {
      color: color, metalness: 0.85, roughness: 0.25, envMapIntensity: 2.5, clearcoat: 0.2,
  };
  const plasticMaterialProps = {
      color: color, transmission: color === '#ffffff' ? 0.4 : 0.1, opacity: 0.95, metalness: 0.05,
      roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 1.5, transparent: true,
  };

  const isStainless = material === 'stainless'; // Borosil
  const isTitanium = material === 'titanium'; // Milton
  const isGlass = material === 'glass';
  const isPlastic = material === 'plastic';

  let currentPoints = getBorosilPoints();
  let materialProps = metalMaterialProps;
  let decalRadius = 1;
  let decalCenter = 2.4;

  if (isTitanium) {
    currentPoints = getMiltonPoints();
    decalRadius = 0.85;
    decalCenter = 2.0;
  } else if (isGlass) {
    currentPoints = getGlassPoints();
    materialProps = glassMaterialProps;
    decalRadius = 0.9;
    decalCenter = 2.0;
  } else if (isPlastic) {
    currentPoints = getPlasticPoints();
    materialProps = plasticMaterialProps;
    decalRadius = 0.9;
    decalCenter = 1.9;
  }

  return (
    <group position={[0, -2.5, 0]}>
      {/* Bottle Body */}
      <mesh>
        <latheGeometry args={[currentPoints, 64]} />
        {isGlass && <meshPhysicalMaterial {...glassMaterialProps} />}
        {(isStainless || isTitanium) && <meshPhysicalMaterial {...metalMaterialProps} />}
        {isPlastic && <meshPhysicalMaterial {...plasticMaterialProps} />}

        {/* Decals aligned to center of lathe */}
        {customText && <TextDecal text={customText} color={textColor} radius={decalRadius} font={selection.textFont} scale={selection.textScale} positionY={decalCenter + (selection.textPosition * 1.5)} />}
        {logo && <LogoDecal url={logo} radius={decalRadius} scale={selection.logoScale} positionY={decalCenter + (selection.logoPosition * 1.5)} />}
      </mesh>

      {/* Caps based on type */}
      {isStainless && (
        <group position={[0, 4.9, 0]}>
           <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.65, 0.65, 0.8, 64]} />
              <meshStandardMaterial color={capColor || "#1a1a1a"} roughness={0.7} metalness={0.1} />
           </mesh>
           <mesh position={[0, 0, 0]}>
              <torusGeometry args={[0.65, 0.08, 16, 64]} />
              <meshStandardMaterial color={capColor || "#dc2626"} roughness={0.3} />
           </mesh>
           {/* Strap representation */}
           <mesh position={[0.7, -1.0, 0]} rotation={[0, 0, 0.1]}>
              <torusGeometry args={[1.0, 0.02, 16, 64, Math.PI]} />
              <meshStandardMaterial color={capColor || "#1a1a1a"} roughness={0.8} />
           </mesh>
        </group>
      )}

      {isTitanium && (
        <group position={[0, 3.95, 0]}>
           <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.7, 32]} />
              <meshPhysicalMaterial {...metalMaterialProps} color={capColor || "#eeeeee"} />
           </mesh>
           <mesh position={[0, 0.7, 0]}>
              <sphereGeometry args={[0.35, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial {...metalMaterialProps} color={capColor || "#eeeeee"} />
           </mesh>
           {/* Ribbed grips */}
           {[...Array(12)].map((_, i) => (
             <mesh key={i} position={[Math.cos((i/12)*Math.PI*2)*0.35, 0.5, Math.sin((i/12)*Math.PI*2)*0.35]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
                <meshPhysicalMaterial {...metalMaterialProps} color={capColor || "#cccccc"} />
             </mesh>
           ))}
        </group>
      )}

      {isGlass && (
         <group position={[0, 4.8, 0]}>
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.4, 64]} />
                <meshStandardMaterial color={capColor || "#E6C27A"} metalness={0.8} roughness={0.2} envMapIntensity={2} /> 
            </mesh>
         </group>
      )}

      {isPlastic && (
         <group position={[0, 4.6, 0]}>
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.4, 0.45, 0.6, 64]} />
                <meshStandardMaterial color={capColor || "#222"} roughness={0.5} metalness={0.1} />
            </mesh>
            <mesh position={[0, -0.05, 0]}>
                <torusGeometry args={[0.45, 0.05, 16, 64]} />
                <meshStandardMaterial color={capColor || "#222"} />
            </mesh>
         </group>
      )}
    </group>
  );
}

export function Bottle3DPreview({ selection }: { selection: any }) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 45 }} 
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={0.8} color="#e0f2fe" />
        <spotLight position={[0, 15, 0]} intensity={1.2} angle={0.4} penumbra={1} />

        <Environment preset="studio" />
        
        <group position={[0, 0, 0]}>
           <RealisticBottle 
              selection={selection}
              material={selection.material.id} 
              color={selection.bottleColor}
              capColor={selection.capColor} 
              customText={selection.customText} 
              textColor={selection.textColor} 
              logo={selection.logo} 
           />
           <ContactShadows 
              position={[0, -2.5, 0]} 
              opacity={0.6} 
              scale={15} 
              blur={2.5} 
              far={5} 
           />
        </group>

        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={15}
          minPolarAngle={Math.PI / 2 - 0.6}
          maxPolarAngle={Math.PI / 2 + 0.6}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

