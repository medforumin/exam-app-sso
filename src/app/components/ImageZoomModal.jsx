import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export function ImageZoomModal({ src, alt = 'Enlarged Image', onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Refs for gesture calculations
  const touchStartRef = useRef({ dist: 0, scale: 1, x: 0, y: 0, posX: 0, posY: 0 });
  const lastTapRef = useRef(0);
  const containerRef = useRef(null);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Keyboard shortcut to close (Escape key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle Touch Events (Pinch-to-zoom & Pan)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        dist,
        scale,
        x: 0,
        y: 0,
        posX: position.x,
        posY: position.y
      };
    } else if (e.touches.length === 1) {
      // Check double-tap
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (scale > 1) {
          handleReset();
        } else {
          setScale(2.5);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // Pan gesture start
      touchStartRef.current = {
        dist: 0,
        scale,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y
      };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch zooming
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartRef.current.dist > 0) {
        const factor = dist / touchStartRef.current.dist;
        const newScale = Math.min(Math.max(1, touchStartRef.current.scale * factor), 5);
        setScale(newScale);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
    } else if (e.touches.length === 1 && scale > 1 && isDragging) {
      // Single finger panning when zoomed in
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;
      setPosition({
        x: touchStartRef.current.posX + deltaX,
        y: touchStartRef.current.posY + deltaY
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom for desktop
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + 0.25, 5));
    } else {
      setScale(prev => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex justify-between items-center z-10 text-white">
        <div className="text-xs sm:text-sm font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm truncate max-w-[70%]">
          {alt || 'Image Viewer'} ({Math.round(scale * 100)}%)
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/15 hover:bg-white/30 rounded-full transition-all text-white border border-white/20 shadow-lg cursor-pointer"
          title="Close Viewer (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Interactive Image Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full flex items-center justify-center overflow-hidden relative cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onClick={(e) => {
          // Close if backdrop clicked outside image
          if (e.target === containerRef.current && scale === 1) {
            onClose();
          }
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="max-w-full max-h-full object-contain pointer-events-auto rounded-lg shadow-2xl"
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="flex justify-center items-center z-10 pb-2">
        <div className="flex items-center gap-2 bg-gray-900/90 text-white border border-gray-700/80 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          
          <button
            onClick={handleReset}
            className="text-xs font-bold px-2 py-1 bg-white/15 hover:bg-white/25 rounded-md transition-all cursor-pointer flex items-center gap-1"
            title="Reset Zoom"
          >
            <RotateCcw size={13} />
            <span>{Math.round(scale * 100)}%</span>
          </button>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>

          <div className="w-[1px] h-4 bg-gray-700 mx-1" />

          <button
            onClick={onClose}
            className="text-xs font-bold px-3 py-1 bg-red-600/80 hover:bg-red-600 rounded-md transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
