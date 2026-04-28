import { useEffect, useRef, useState } from 'react';

export function CursorPet() {
  const frogRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [frogState, setFrogState] = useState<'idle' | 'jumping' | 'held' | 'thrown' | 'unconscious'>('idle');

  const physics = useRef({
      x: -100,
      y: -100,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      state: 'idle' as 'idle' | 'jumping' | 'held' | 'thrown' | 'unconscious',
      timer: 0,
      faceDir: 1,
      rotation: 0
  });

  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const lastMouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const mouseVel = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check if device is desktop and likely has a mouse
    const checkDesktop = () => {
        setIsDesktop(window.innerWidth > 1024 && window.matchMedia("(pointer: fine)").matches);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    physics.current.x = window.innerWidth / 2;
    physics.current.y = window.innerHeight / 2;

    const handleMM = (e: MouseEvent) => {
        mouse.current.x = e.clientX;
        mouse.current.y = e.clientY;
    };

    const handleMU = () => {
        if (physics.current.state === 'held') {
            physics.current.state = 'thrown';
            physics.current.vx = mouseVel.current.x * 0.8;
            physics.current.vy = mouseVel.current.y * 0.8;
            physics.current.vz = 0;
        }
    };

    window.addEventListener('mousemove', handleMM);
    window.addEventListener('mouseup', handleMU);

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
        const dt = Math.min((time - lastTime) / 16.66, 3);
        lastTime = time;

        const p = physics.current;
        const m = mouse.current;
        const mv = mouseVel.current;

        mv.x = m.x - lastMouse.current.x;
        mv.y = m.y - lastMouse.current.y;
        lastMouse.current.x = m.x;
        lastMouse.current.y = m.y;

        if (p.state === 'idle') {
            const dx = m.x - p.x;
            const dy = m.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            p.timer -= dt;
            if (dist > 80 && p.timer <= 0) {
                p.state = 'jumping';
                const frames = 30; 
                p.vx = dx / frames;
                p.vy = dy / frames;
                p.vz = 14; 
                p.z = 0;
                p.faceDir = dx > 0 ? 1 : -1;
            }
        } else if (p.state === 'jumping') {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.vz -= 0.8 * dt; 
            
            if (p.z <= 0) {
                p.z = 0;
                p.state = 'idle';
                p.vx = 0;
                p.vy = 0;
                p.timer = 15; 
            }
        } else if (p.state === 'held') {
            p.x = m.x;
            p.y = m.y;
            p.z = 0;
            p.vx = 0;
            p.vy = 0;
            p.rotation = 0;
        } else if (p.state === 'thrown') {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 1.2 * dt; 
            p.rotation += p.vx * dt * 2; 
            
            // Wall bounce
            if (p.x < 20) { p.x = 20; p.vx *= -0.6; }
            if (p.x > window.innerWidth - 20) { p.x = window.innerWidth - 20; p.vx *= -0.6; }

            // Floor bounce
            if (p.y > window.innerHeight - 30) {
                p.y = window.innerHeight - 30;
                p.vy *= -0.6;
                p.vx *= 0.8; // friction
                
                // When speed gets low on the floor, become unconscious
                if (Math.abs(p.vy) < 4 && Math.abs(p.vx) < 4) {
                    p.state = 'unconscious';
                    p.timer = 300; // ~5 seconds at 60fps
                    p.vx = 0; p.vy = 0; p.rotation = 180;
                }
            }
        } else if (p.state === 'unconscious') {
            p.timer -= dt;
            if (p.timer <= 0) {
                p.state = 'idle';
                p.timer = 10;
                p.faceDir = 1;
                p.rotation = 0;
            }
        }

        if (frogRef.current) {
            const displayY = p.y - p.z;
            const scaleX = (p.state === 'thrown' || p.state === 'unconscious') ? 1 : (p.faceDir > 0 ? 1 : -1);
            const rot = p.state === 'thrown' ? p.rotation : (p.state === 'unconscious' ? 180 : 0);
            
            frogRef.current.style.transform = `translate(${p.x - 20}px, ${displayY - 20}px) scaleX(${scaleX}) rotate(${rot}deg)`;
            
            const currentState = frogRef.current.getAttribute('data-state');
            if (currentState !== p.state) {
                frogRef.current.setAttribute('data-state', p.state);
                setFrogState(p.state);
            }
        }

        animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
        window.removeEventListener('mousemove', handleMM);
        window.removeEventListener('mouseup', handleMU);
        cancelAnimationFrame(animationFrameId);
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <div className="fixed top-0 left-0 z-[9998] pointer-events-none w-0 h-0">
      <div 
        ref={frogRef}
        className="absolute top-0 left-0 w-10 h-8 pointer-events-auto cursor-grab active:cursor-grabbing will-change-transform"
        onMouseDown={(e) => {
            // Can catch it only if It's not unconscious
            if (physics.current.state !== 'unconscious') {
                physics.current.state = 'held';
                physics.current.vx = 0;
                physics.current.vy = 0;
                physics.current.vz = 0;
                setFrogState('held');
            }
        }}
      >
         {/* Back legs */}
         <div className={`absolute -bottom-1 -left-2 w-4 h-4 bg-emerald-700 rounded-full transition-transform duration-100 ${frogState === 'jumping' || frogState === 'thrown' ? 'translate-y-2 translate-x-1' : ''}`} />
         <div className={`absolute -bottom-1 -right-2 w-4 h-4 bg-emerald-700 rounded-full transition-transform duration-100 ${frogState === 'jumping' || frogState === 'thrown' ? 'translate-y-2 -translate-x-1' : ''}`} />
         
         {/* Body */}
         <div className={`absolute inset-0 bg-emerald-500 rounded-[20px] shadow-[0_5px_15px_rgba(16,185,129,0.4)] border-b-[3px] border-emerald-700 transition-transform duration-100 ${(frogState === 'jumping' || frogState === 'thrown') ? 'scale-y-[1.1] scale-x-[0.9]' : 'scale-100'}`} />
         
         {/* Front legs */}
         <div className={`absolute -bottom-0.5 left-1 w-3 h-3 bg-emerald-400 rounded-full transition-transform duration-100 ${frogState === 'jumping' || frogState === 'thrown' ? 'translate-y-2' : ''}`} />
         <div className={`absolute -bottom-0.5 right-1 w-3 h-3 bg-emerald-400 rounded-full transition-transform duration-100 ${frogState === 'jumping' || frogState === 'thrown' ? 'translate-y-2' : ''}`} />

         {/* Face container */}
         <div className="absolute inset-0">
         {frogState === 'unconscious' ? (
             <>
               <div className="absolute -top-2 left-1 w-3.5 h-3.5 bg-white rounded-full flex gap-0.5 justify-center items-center shadow-sm">
                  <span className="text-[9px] font-black leading-none pb-[1px] text-black hover:cursor-pointer">X</span>
               </div>
               <div className="absolute -top-2 right-1 w-3.5 h-3.5 bg-white rounded-full flex gap-0.5 justify-center items-center shadow-sm">
                  <span className="text-[9px] font-black leading-none pb-[1px] text-black">X</span>
               </div>
               {/* Dizzy Mouth */}
               <div className="absolute bottom-2 left-3 w-4 h-1 bg-black rounded-full opacity-60" />
               
               {/* Unconscious Zzz (Counter rotated to be readable since frog is upside down) */}
               <div className="absolute -top-10 -right-2 text-sm font-black text-white pointer-events-none drop-shadow-md z-10 opacity-80" style={{ transform: 'rotate(180deg)' }}>
                 Zzz
               </div>
             </>
         ) : (
             <>
               <div className="absolute -top-2 left-1 w-3.5 h-3.5 bg-white rounded-full flex justify-center items-center shadow-sm overflow-hidden">
                  <div className={`w-1.5 h-1.5 bg-black rounded-full transition-transform ${frogState === 'held' ? 'scale-[2] translate-y-1' : ''}`} />
               </div>
               <div className="absolute -top-2 right-1 w-3.5 h-3.5 bg-white rounded-full flex justify-center items-center shadow-sm overflow-hidden">
                  <div className={`w-1.5 h-1.5 bg-black rounded-full transition-transform ${frogState === 'held' ? 'scale-[2] translate-y-1' : ''}`} />
               </div>
               {/* Happy/Surprised Mouth */}
               <div className={`absolute left-3 w-4 bg-black transition-all ${frogState === 'held' ? 'bottom-1 h-3 rounded-t-full' : (frogState === 'jumping' || frogState === 'thrown' ? 'bottom-1 h-2 rounded-full' : 'bottom-2 h-1 rounded-full')}`} />
             </>
         )}
         </div>
      </div>
    </div>
  );
}
