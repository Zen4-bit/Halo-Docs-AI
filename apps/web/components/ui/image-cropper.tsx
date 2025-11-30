'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Crop as CropIcon } from 'lucide-react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageUrl: string;
  onCropChange: (crop: CropArea) => void;
  aspectRatio?: number;
}

export function ImageCropper({ imageUrl, onCropChange, aspectRatio }: ImageCropperProps) {
  const [crop, setCrop] = useState<CropArea>({ x: 50, y: 50, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current) {
        setImageSize({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight,
        });
      }
    };

    updateImageSize();
    window.addEventListener('resize', updateImageSize);
    return () => window.removeEventListener('resize', updateImageSize);
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (isDragging) {
      const newX = Math.max(0, Math.min(crop.x + deltaX, imageSize.width - crop.width));
      const newY = Math.max(0, Math.min(crop.y + deltaY, imageSize.height - crop.height));
      
      const newCrop = { ...crop, x: newX, y: newY };
      setCrop(newCrop);
      onCropChange(newCrop);
    } else if (isResizing) {
      const newWidth = Math.max(50, Math.min(crop.width + deltaX, imageSize.width - crop.x));
      const newHeight = aspectRatio 
        ? newWidth / aspectRatio 
        : Math.max(50, Math.min(crop.height + deltaY, imageSize.height - crop.y));

      const newCrop = { ...crop, width: newWidth, height: newHeight };
      setCrop(newCrop);
      onCropChange(newCrop);
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isResizing) {
        handleMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, dragStart, crop, aspectRatio]);

  const presetAspects = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4/3 },
    { label: '16:9', value: 16/9 },
    { label: '3:2', value: 3/2 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <CropIcon className="h-4 w-4 text-gray-400" />
        <select
          value={aspectRatio || ''}
          onChange={(e) => {
            const ratio = e.target.value ? parseFloat(e.target.value) : null;
            if (ratio && imageSize.width > 0) {
              const newHeight = crop.width / ratio;
              const newCrop = { ...crop, height: newHeight };
              setCrop(newCrop);
              onCropChange(newCrop);
            }
          }}
          className="text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
        >
          {presetAspects.map((preset) => (
            <option key={preset.label} value={preset.value || ''}>
              {preset.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {crop.width} × {crop.height}px
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative bg-gray-900 rounded-lg overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Crop preview"
          className="w-full h-auto max-h-96 object-contain"
          draggable={false}
        />

        {/* Crop overlay */}
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 cursor-move"
          style={{
            left: `${crop.x}px`,
            top: `${crop.y}px`,
            width: `${crop.width}px`,
            height: `${crop.height}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
            onMouseDown={(e) => handleMouseDown(e, 'resize')}
          />
          
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/20" />
            ))}
          </div>
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-black/50"
            style={{
              clipPath: `polygon(
                0% 0%,
                0% 100%,
                ${crop.x}px 100%,
                ${crop.x}px ${crop.y}px,
                ${crop.x + crop.width}px ${crop.y}px,
                ${crop.x + crop.width}px ${crop.y + crop.height}px,
                ${crop.x}px ${crop.y + crop.height}px,
                ${crop.x}px 100%,
                100% 100%,
                100% 0%,
                ${crop.x + crop.width}px 0%,
                ${crop.x + crop.width}px ${crop.y}px,
                ${crop.x}px ${crop.y}px,
                ${crop.x}px 0%
              )`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
