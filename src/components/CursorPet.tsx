import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CursorPet() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if device is desktop and likely has a mouse
    const checkDesktop = () => {
        setIsDesktop(window.innerWidth > 1024 && window.matchMedia("(pointer: fine)").matches);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') || 
        target.closest('a') ||
        target.closest('[role="button"]')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    if (isDesktop) {
        window.addEventListener('mousemove', updateMousePosition);
        window.addEventListener('mouseout', handleMouseLeave);
        window.addEventListener('mouseover', handleMouseEnter);
        window.addEventListener('mouseover', handleMouseOver);
    }
    
    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('mouseover', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isDesktop, isVisible]);

  if (!isDesktop) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 left-0 z-[9998] pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            x: mousePosition.x + 15,
            y: mousePosition.y + 15,
            opacity: 1,
            scale: 1
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            x: { type: 'spring', damping: 12, stiffness: 60, mass: 0.5 },
            y: { type: 'spring', damping: 12, stiffness: 60, mass: 0.5 },
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 }
          }}
        >
          <div className="relative">
            {/* Cute blob body */}
            <div className={`w-8 h-8 bg-cyan-400 rounded-full flex flex-col items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300 \${isHovering ? 'scale-110 bg-cyan-300' : 'scale-100 bg-cyan-400'}`}>
              
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Ears */}
                <div className={`absolute -top-1.5 -left-0.5 w-3 h-3 bg-cyan-400 rounded-full transition-transform duration-300 \${isHovering ? '-rotate-12 translate-y-1' : ''}`} />
                <div className={`absolute -top-1.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full transition-transform duration-300 \${isHovering ? 'rotate-12 translate-y-1' : ''}`} />

                {/* Eyes */}
                <div className="flex gap-1.5 mb-0.5 z-10">
                  <div className={`w-1.5 bg-black rounded-full transition-all duration-300 \${isHovering ? 'h-2' : 'h-1.5'}`} />
                  <div className={`w-1.5 bg-black rounded-full transition-all duration-300 \${isHovering ? 'h-2' : 'h-1.5'}`} />
                </div>
                {/* Mouth */}
                <div className={`bg-black transition-all duration-300 z-10 \${isHovering ? 'w-3 h-2 rounded-full' : 'w-2 h-1 rounded-b-full'}`}></div>
              </div>
            </div>
            
            {/* Context bubble if hovering over interactive element */}
            <AnimatePresence>
              {isHovering && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-lg"
                >
                  Click!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
