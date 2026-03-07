'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Sparkles, GripVertical } from 'lucide-react';

const EXTRACTED_LINES = [
    { type: 'ministry', text: 'MINISTERE DE LA GUERRE' },
    { type: 'header', text: 'REPUBLIQUE FRANCAISE.' },
    { type: 'spacer' },
    { type: 'sub', text: 'CABINET DU MINISTRE' },
    { type: 'sub', text: 'BUREAU DES DECORATIONS.' },
    { type: 'spacer' },
    { type: 'title', text: 'DECORATION ETRANGERE.' },
    { type: 'spacer' },
    { type: 'body', text: 'M. Bonis, Jean Marie François' },
    { type: 'body', text: 'Caporal au 50e Régiment d\'Infanterie' },
    { type: 'body', text: 'est informé que la décoration de Chevalier de l\'Ordre du' },
    { type: 'body', text: 'Nichan el Iktibar de Tunis' },
    { type: 'body', text: 'lui a été conférée.' },
    { type: 'spacer' },
    { type: 'body', text: 'Il est autorisé à porter cette décoration en vertu des dispositions du décret' },
    { type: 'body', text: 'du 29 novembre 1915.' },
    { type: 'spacer' },
    { type: 'date', text: 'Paris, le 15 MAI 1919' },
];

function ExtractedSide() {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col justify-center overflow-y-auto p-4 md:p-8">
            <div className="w-full max-w-md mx-auto bg-gray-800/80 border border-gray-700 rounded-lg shadow-xl p-4 md:p-6 text-[10px] md:text-xs leading-relaxed">
                {EXTRACTED_LINES.map((line, i) => {
                    if (line.type === 'spacer') {
                        return <div key={i} className="h-1.5 md:h-2" />;
                    }
                    if (line.type === 'header') {
                        return (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: 8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.03 }}
                                className="text-[#35AEF3] font-bold text-center text-xs md:text-sm"
                            >
                                {line.text}
                            </motion.p>
                        );
                    }
                    if (line.type === 'ministry') {
                        return (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: 8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.03 }}
                                className="text-gray-400 text-center text-[10px] md:text-xs uppercase tracking-wider"
                            >
                                {line.text}
                            </motion.p>
                        );
                    }
                    if (line.type === 'sub') {
                        return (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: 8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.03 }}
                                className="text-gray-500 text-center italic text-[9px] md:text-[11px]"
                            >
                                {line.text}
                            </motion.p>
                        );
                    }
                    if (line.type === 'title') {
                        return (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: 8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.03 }}
                                className="text-white font-bold text-center text-sm md:text-base tracking-wide"
                            >
                                {line.text}
                            </motion.p>
                        );
                    }
                    if (line.type === 'date') {
                        return (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: 8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.03 }}
                                className="text-green-400 font-semibold text-center pt-1 border-t border-gray-700"
                            >
                                {line.text}
                            </motion.p>
                        );
                    }
                    return (
                        <motion.p
                            key={i}
                            initial={{ opacity: 0, x: 8 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.03 }}
                            className="text-gray-300"
                        >
                            {line.text}
                        </motion.p>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-[#35AEF3] text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Extracted Text</span>
            </div>
        </div>
    );
}

export function FeatureWithImageComparison() {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const updateSlider = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.min(Math.max((x / rect.width) * 100, 5), 95);
        setSliderPosition(percent);
    }, []);

    const handleMouseDown = useCallback(() => {
        isDragging.current = true;
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();
        updateSlider(e.clientX);
    }, [updateSlider]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        updateSlider(e.touches[0].clientX);
    }, [updateSlider]);

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div
                ref={containerRef}
                className="relative w-full aspect-[3/4] md:aspect-[4/3] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-black/50 cursor-col-resize select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
            >
                {/* Left side: Real document image */}
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                    <div className="absolute inset-0 bg-gray-900">
                        <Image
                            src="/demo-document.png"
                            alt="Original document scan"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Right side: Extracted text */}
                <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
                    <ExtractedSide />
                </div>

                {/* Slider handle */}
                <div
                    className="absolute top-0 bottom-0 z-20"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                >
                    <div className="absolute inset-y-0 w-0.5 bg-[#35AEF3] shadow-[0_0_10px_rgba(53,174,243,0.5)]" />
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-[#35AEF3] rounded-full flex items-center justify-center shadow-lg shadow-[#35AEF3]/30 border-2 border-white/20">
                        <GripVertical className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute top-3 left-3 z-10 bg-gray-900/80 backdrop-blur-sm text-gray-300 text-xs px-3 py-1.5 rounded-full border border-gray-700">
                    Original
                </div>
                <div className="absolute top-3 right-3 z-10 bg-[#35AEF3]/20 backdrop-blur-sm text-[#35AEF3] text-xs px-3 py-1.5 rounded-full border border-[#35AEF3]/30">
                    Extracted
                </div>
            </div>

            <p className="text-center text-gray-500 text-xs mt-3">
                Drag the slider to compare original document vs. AI extracted text
            </p>
        </div>
    );
}
