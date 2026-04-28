import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Decal, ContactShadows } from '@react-three/drei';
import { Texture } from 'three';
import { useEffect, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDrag } from '@use-gesture/react';

// 1. Utilities for Decals

function DragScaleWrapper({ isMoveEnabled, setControlsEnabled, onUpdate, children }: { isMoveEnabled: boolean, setControlsEnabled: any, onUpdate: any, children: any }) {
  const [active, setActive] = useState(false);
  const lastY = useRef(0);
  const lastX = useRef(0);

  return (
    <group
      onPointerDown={(e) => {
        if (!isMoveEnabled) return;        
        e.stopPropagation();
        setActive(true);
        lastY.current = e.clientY;
        lastX.current = e.clientX;
        setControlsEnabled(false);
        (e.target as any).setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        setActive(false);
        setControlsEnabled(true);
        (e.target as any).releasePointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!active) return;
        e.stopPropagation();
        const delta = e.clientY - lastY.current;
        const deltaX = e.clientX - lastX.current;
        lastY.current = e.clientY;
        lastX.current = e.clientX;
        onUpdate({ deltaY: -delta * 0.02, deltaX: deltaX * 0.02 });
      }}
      onWheel={(e) => {
        e.stopPropagation();
        const scaleChange = e.deltaY > 0 ? -0.05 : 0.05;
        onUpdate({ deltaScale: scaleChange });
      }}
    >
      {children}
    </group>
  );
}

function LogoDecal({ url, scale = 1, positionY = 0, radius = 1 }: { url: string, scale?: number, positionY?: number, radius?: number }) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const [aspect, setAspect] = useState(1);

  useEffect(() => {
    if (!url) {
       setTexture(null);
       return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 1024;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const maxDim = Math.max(img.width, img.height);
      const renderW = (img.width / maxDim) * 800 * scale;
      const renderH = (img.height / maxDim) * 800 * scale;
      
      ctx.drawImage(img, (canvas.width - renderW)/2, (canvas.height - renderH)/2, renderW, renderH);
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      
      setAspect(canvas.height / canvas.width);
      setTexture(tex);
    };
  }, [url, scale]);

  if (!texture) return null;
  const circumference = 2 * Math.PI * radius;
  const cylinderHeight = circumference * aspect;

  return (
    <mesh position={[0, positionY, 0]} rotation={[0, Math.PI, 0]} renderOrder={2}>
      <cylinderGeometry args={[radius + 0.008, radius + 0.008, cylinderHeight, 64, 1, true]} />
      <meshStandardMaterial 
        map={texture} 
        transparent={true}
        depthWrite={false}
        alphaTest={0.01}
        polygonOffset={true}
        polygonOffsetFactor={-6}
        color="#ffffff"
        roughness={0.6}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function TextDecal({ text, color, scale = 1, positionY = 0, radius = 1, font = 'Inter', rotation = 0 }: { text: string; color: string; scale?: number, positionY?: number, radius?: number, font?: string, rotation?: number }) {
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
      
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotation);
      // We'll use a maximum width so long text squeezes nicely to wrap the bottle
      ctx.fillText(text, 0, 0, (rotation ? canvas.height : canvas.width) - 40);
      ctx.restore();
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      
      setAspect(canvas.height / canvas.width);
      setTexture(tex);
    }
  }, [text, color, font, rotation, scale]);

  if (!texture) return null;

  const circumference = 2 * Math.PI * radius;
  // A taller cylinder looks better, allowing large text scaling
  // We decouple the canvas scaling from the 3D height scale, which avoids stretching
  const cylinderHeight = circumference * aspect * 3.0;

  return (
    <mesh position={[0, positionY, 0]} rotation={[0, Math.PI, 0]} renderOrder={1}>
      <cylinderGeometry args={[radius + 0.005, radius + 0.005, cylinderHeight, 64, 1, true]} />
      <meshStandardMaterial 
        map={texture} 
        transparent={true}
        depthWrite={false}
        alphaTest={0.01}
        polygonOffset={true}
        polygonOffsetFactor={-4}
        color="#ffffff"
        roughness={0.6}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}


function generateOccasionTexture(occasion: string, color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 1024, 1024);

  // Base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1024, 1024);

  // Pattern logic
  if (occasion === 'birthday') {
    // Confetti
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 60%)`;
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 15 + 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (occasion === 'wedding') {
    // Elegant circles
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 15;
    for(let i=0; i<40; i++) {
        ctx.beginPath();
        const x = Math.random()*1024;
        const y = Math.random()*1024;
        ctx.arc(x, y, 40, 0, Math.PI*2);
        ctx.stroke();
    }
  } else if (occasion === 'corporate') {
    // Geometric lines
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 30;
    for(let i=0; i<10; i++) {
        ctx.strokeRect(i*150, i*100, 300, 300);
    }
  } else if (occasion === 'sports') {
      // Stripes
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for(let i=0; i<20; i++) {
          ctx.fillRect(0, i*150, 1024, 50);
      }
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
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

function RealisticBottle({ selection, setSelection, setControlsEnabled, material, color, capColor, customText, textColor, logo, isMoveEnabled }: any) {
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
  const isGlass = material === 'glass';
  const isPlastic = material === 'plastic';

  const occasionTexture = useMemo(() => {
    if (selection.occasion.id === 'minimal') return null;
    return generateOccasionTexture(selection.occasion.id, selection.bottleColor);
  }, [selection.occasion.id, selection.bottleColor]);

  let currentPoints = getBorosilPoints();
  let materialProps = { ...metalMaterialProps, map: occasionTexture };
  let glassProps = { ...glassMaterialProps, map: occasionTexture };
  let plasticProps = { ...plasticMaterialProps, map: occasionTexture }; 
  let decalRadius = 1;
  let decalCenter = 2.4;

  const sizeScale = selection?.size === '1L' ? 1.2 : selection?.size === '750ml' ? 1.1 : 1;

  if (isGlass) {
    currentPoints = getGlassPoints();
    materialProps = glassProps;
    decalRadius = 0.9;
    decalCenter = 2.0;
  } else if (isPlastic) {
    currentPoints = getPlasticPoints();
    materialProps = plasticProps;
    decalRadius = 0.9;
    decalCenter = 1.9;
  } else {
    materialProps = { ...metalMaterialProps, map: occasionTexture };
  }

  return (
    <group position={[0, -2.5 * sizeScale, 0]} scale={[sizeScale, sizeScale, sizeScale]}>
      {/* Bottle Body */}
      <mesh>
        <latheGeometry args={[currentPoints, 64]} />
        {isGlass && <meshPhysicalMaterial {...glassProps} />}
        {isStainless && <meshPhysicalMaterial {...materialProps} />}
        {isPlastic && <meshPhysicalMaterial {...plasticProps} />}


        {/* Decals aligned to center of lathe */}
        {customText && (
          <DragScaleWrapper
            isMoveEnabled={isMoveEnabled}
            setControlsEnabled={setControlsEnabled}
            onUpdate={({ deltaY, deltaX, deltaScale }: any) => {
              if (setSelection) {
                setSelection((prev: any) => ({
                  ...prev,
                  textPosition: prev.textPosition + (deltaY || 0),
                  textRotationX: prev.textRotationX + (deltaX || 0),
                  textScale: Math.max(0.2, Math.min(3, prev.textScale + (deltaScale || 0)))
                }));
              }
            }}
          >
            <group rotation={[0, selection.textRotationX || 0, 0]}>
              <TextDecal text={customText} color={textColor} radius={decalRadius} font={selection.textFont} scale={selection.textScale} positionY={decalCenter + (selection.textPosition * 1.5)} rotation={selection.textRotationZ || 0} />
            </group>
          </DragScaleWrapper>
        )}
        {logo && (
          <DragScaleWrapper
            isMoveEnabled={isMoveEnabled}
            setControlsEnabled={setControlsEnabled}
            onUpdate={({ deltaY, deltaX, deltaScale }: any) => {
              if (setSelection) {
                setSelection((prev: any) => ({
                  ...prev,
                  logoPosition: prev.logoPosition + (deltaY || 0),
                  logoRotationX: prev.logoRotationX + (deltaX || 0),
                  logoScale: Math.max(0.2, Math.min(3, prev.logoScale + (deltaScale || 0)))
                }));
              }
            }}
          >
            <group rotation={[0, selection.logoRotationX || 0, 0]}>
              <LogoDecal url={logo} radius={decalRadius} scale={selection.logoScale} positionY={decalCenter + (selection.logoPosition * 1.5)} />
            </group>
          </DragScaleWrapper>
        )}
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

export function Bottle3DPreview({ selection, setSelection }: { selection: any, setSelection?: (s: any) => void }) {
  const [controlsEnabled, setControlsEnabled] = useState(true);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas 
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 10], fov: 45 }} 
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2, powerPreference: "high-performance" }}
        dpr={[1, 2.5]} // Setting up to 2.5 dpr for 4K quality feels
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={0.8} color="#e0f2fe" />
        <spotLight position={[0, 15, 0]} intensity={1.2} angle={0.4} penumbra={1} />

        <Environment preset="studio" />
        
        <group position={[0, 0, 0]}>
           <RealisticBottle 
              selection={selection}
              setSelection={setSelection}
              setControlsEnabled={setControlsEnabled}
              material={selection.material.id} 
              color={selection.bottleColor}
              capColor={selection.capColor} 
              customText={selection.customText} 
              textColor={selection.textColor} 
              logo={selection.logo}
              isMoveEnabled={selection.isMoveEnabled}
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
          enabled={controlsEnabled}
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

