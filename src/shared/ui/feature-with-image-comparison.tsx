'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, GripVertical } from 'lucide-react';

const SAMPLE_DOCUMENT_LINES = [
    { type: 'header', text: 'ROYAUME DU MAROC / المملكة المغربية' },
    { type: 'subheader', text: 'CARTE NATIONALE D\'IDENTITE' },
    { type: 'subheader', text: 'البطاقة الوطنية للتعريف' },
    { type: 'spacer', text: '' },
    { type: 'field', label: 'Nom / اللقب', value: 'EL ALAMI / العلمي' },
    { type: 'field', label: 'Prénom / الاسم', value: 'ZAINEB / زينب' },
    { type: 'field', label: 'Née le', value: '05/12/1983' },
    { type: 'field', label: 'à / ب', value: 'OUARZAZATE / ورزازات' },
    { type: 'spacer', text: '' },
    { type: 'id', text: 'U1234567' },
    { type: 'field', label: 'Valable jusqu\'au', value: '22/07/2029' },
];

function DocumentSide() {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-6 md:p-10">
            {/* Simulated scanned document */}
            <div className="w-full max-w-sm bg-gradient-to-b from-amber-50/90 to-amber-100/80 rounded-lg shadow-xl p-5 md:p-6 transform rotate-1 relative">
                {/* Scan noise overlay */}
                <div className="absolute inset-0 rounded-lg opacity-20 mix-blend-multiply bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44Ii8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+')]"></div>

                {/* Document content - blurry/tilted to simulate raw scan */}
                <div className="relative space-y-2 text-xs md:text-sm">
                    <div className="text-center border-b border-amber-300/50 pb-2">
                        <p className="font-bold text-gray-800 text-sm md:text-base blur-[0.3px]">ROYAUME DU MAROC</p>
                        <p className="text-gray-700 blur-[0.4px]" dir="rtl">المملكة المغربية</p>
                    </div>
                    <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between blur-[0.3px]">
                            <span className="text-gray-500">Nom</span>
                            <span className="text-gray-800 font-medium">EL ALAMI</span>
                        </div>
                        <div className="flex justify-between blur-[0.3px]">
                            <span className="text-gray-500">Prénom</span>
                            <span className="text-gray-800 font-medium">ZAINEB</span>
                        </div>
                        <div className="flex justify-between blur-[0.4px]">
                            <span className="text-gray-500">Née le</span>
                            <span className="text-gray-800">05/12/1983</span>
                        </div>
                        <div className="flex justify-between blur-[0.3px]">
                            <span className="text-gray-500">à</span>
                            <span className="text-gray-800">OUARZAZATE</span>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-amber-300/50 text-center">
                        <p className="font-mono text-gray-700 tracking-widest blur-[0.3px]">U1234567</p>
                    </div>
                </div>
            </div>

            {/* Label */}
            <div className="mt-4 flex items-center gap-2 text-gray-500 text-xs">
                <FileText className="w-3.5 h-3.5" />
                <span>Raw Document Scan</span>
            </div>
        </div>
    );
}

function ExtractedSide() {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center p-6 md:p-10">
            {/* Clean extracted text */}
            <div className="w-full max-w-sm bg-gray-800/80 border border-gray-700 rounded-lg shadow-xl p-5 md:p-6 font-mono text-xs md:text-sm">
                <div className="space-y-2">
                    {SAMPLE_DOCUMENT_LINES.map((line, i) => {
                        if (line.type === 'spacer') {
                            return <div key={i} className="h-2" />;
                        }
                        if (line.type === 'header') {
                            return (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: 10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="text-[#35AEF3] font-bold text-center text-sm md:text-base"
                                    dir="auto"
                                >
                                    {line.text}
                                </motion.p>
                            );
                        }
                        if (line.type === 'subheader') {
                            return (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: 10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="text-gray-300 text-center text-xs"
                                    dir="auto"
                                >
                                    {line.text}
                                </motion.p>
                            );
                        }
                        if (line.type === 'id') {
                            return (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: 10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="text-green-400 font-bold tracking-widest text-center pt-2 border-t border-gray-700"
                                >
                                    {line.text}
                                </motion.p>
                            );
                        }
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="flex justify-between gap-2"
                            >
                                <span className="text-gray-500">{line.label}</span>
                                <span className="text-white" dir="auto">{line.value}</span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Label */}
            <div className="mt-4 flex items-center gap-2 text-[#35AEF3] text-xs">
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
                className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-black/50 cursor-col-resize select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
            >
                {/* Left side: Raw document */}
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                    <DocumentSide />
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
                    Before
                </div>
                <div className="absolute top-3 right-3 z-10 bg-[#35AEF3]/20 backdrop-blur-sm text-[#35AEF3] text-xs px-3 py-1.5 rounded-full border border-[#35AEF3]/30">
                    After
                </div>
            </div>

            <p className="text-center text-gray-500 text-xs mt-3">
                Drag the slider to compare raw document vs. extracted text
            </p>
        </div>
    );
}
