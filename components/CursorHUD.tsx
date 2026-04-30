
import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export const CursorHUD: React.FC = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const mouseX = useSpring(0, { stiffness: 500, damping: 50 });
    const mouseY = useSpring(0, { stiffness: 500, damping: 50 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('button, a, .cursor-pointer')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseover', handleMouseOver);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [mouseX, mouseY]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] hidden lg:block">
            {/* Main Ring */}
            <motion.div
                style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
                animate={{ 
                    scale: isHovering ? 1.5 : 1,
                    borderColor: isHovering ? 'rgba(225, 29, 72, 0.8)' : 'rgba(255, 255, 255, 0.2)'
                }}
                className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center transition-colors duration-300"
            >
                {/* Center Dot */}
                <div className="w-1 h-1 bg-brand-red rounded-full" />
                
                {/* HUD Lines */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-brand-red/40" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-brand-red/40" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-[1px] bg-brand-red/40" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-[1px] bg-brand-red/40" />
            </motion.div>

            {/* Coordinates Display */}
            <motion.div
                style={{ x: mouseX, y: mouseY, translateX: 20, translateY: 20 }}
                className="font-mono text-[6px] text-brand-red/40 uppercase tracking-widest"
            >
                X: {Math.round(mousePosition.x)} <br/>
                Y: {Math.round(mousePosition.y)} <br/>
                ST_D: {isHovering ? 'INT_ACT' : 'NOMINAL'}
            </motion.div>
        </div>
    );
};
