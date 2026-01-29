'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Scan, Globe, Zap, Shield, Copy } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { FeatureCard } from '@/shared/ui/grid-feature-cards';
import { HowItWorks } from '@/shared/ui/how-it-works';
import { Header } from '@/shared/ui/header';
import { CTAWithMarquee } from '@/shared/ui/cta-with-marquee';

const features = [
    {
        title: "AI-Powered OCR with Mistral",
        icon: Scan,
        description: "Advanced Mistral OCR (mistral-ocr-2512) with 94.9% accuracy for universal document processing.",
    },
    {
        title: "Smart Document Classification",
        icon: FileText,
        description: "Automatically detects 9 document types: IDs, CVs, invoices, contracts, forms, certificates, bank statements, medical records.",
    },
    {
        title: "Structured Data Extraction",
        icon: Globe,
        description: "Extracts key fields with evidence tracking - never hallucinates, preserves exact text and formatting.",
    },
    {
        title: "Complete Document Model",
        icon: Zap,
        description: "Full layout preservation with headings, tables, lists, and reading order - not just raw text.",
    },
    {
        title: "Zero Storage Architecture",
        icon: Shield,
        description: "In-memory processing only - your documents are never stored, logged, or persisted anywhere.",
    },
    {
        title: "Quality Assessment",
        icon: Copy,
        description: "Automatic confidence scoring and review recommendations with comprehensive warnings system.",
    },
];

type ViewAnimationProps = {
    delay?: number;
    className?: string;
    children: React.ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
            whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.8 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export default function HeroSection() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header with scroll effect */}
            <Header />

            {/* Hero Section */}
            <section className="relative w-full text-sm pb-24">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#35AEF3]/10 via-transparent to-transparent"></div>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#35AEF3]/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#35AEF3]/5 rounded-full blur-3xl"></div>
                </div>

                {/* Badge */}
                <AnimatedContainer delay={0.1} className="relative z-10 flex items-center gap-2 border border-[#35AEF3]/30 bg-gray-800/50 backdrop-blur-sm hover:border-[#35AEF3]/50 rounded-full w-max mx-auto px-4 py-2 mt-16 md:mt-12 transition-colors">
                    <span className="text-gray-300">🤖 Powered by Mistral OCR 2512</span>
                    <Link href="/extract" className="flex items-center gap-1 font-medium text-[#35AEF3]">
                        <span>Try it now</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </AnimatedContainer>

                {/* Headline */}
                <AnimatedContainer delay={0.2}>
                    <h1 className="relative z-10 text-4xl md:text-6xl lg:text-7xl font-bold max-w-[900px] text-center mx-auto mt-8 px-4">
                        <span className="text-white">Intelligent Document </span>
                        <span className="bg-gradient-to-r from-[#35AEF3] to-[#4FBEF5] bg-clip-text text-transparent">AI Extraction</span>
                    </h1>
                </AnimatedContainer>

                {/* Subtitle */}
                <AnimatedContainer delay={0.3}>
                    <p className="relative z-10 text-base md:text-lg mx-auto max-w-2xl text-center mt-6 text-gray-400 px-4">
                        Advanced Mistral OCR with smart classification, structured extraction, and zero-storage architecture. Process IDs, CVs, invoices, contracts, and more with 94.9% accuracy.
                    </p>
                </AnimatedContainer>

                {/* CTA Buttons */}
                <AnimatedContainer delay={0.4} className="relative z-10 mx-auto w-full flex items-center justify-center gap-3 mt-8">
                    <Link
                        href="/extract"
                        className="flex items-center gap-2 bg-[#35AEF3] hover:bg-[#4FBEF5] text-white px-8 py-4 rounded-full font-medium transition shadow-lg shadow-[#35AEF3]/25"
                    >
                        🤖 Try Mistral OCR
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                        href="#features"
                        className="flex items-center gap-2 border border-gray-700 bg-gray-800/50 hover:bg-gray-800 rounded-full px-8 py-4 text-gray-300 font-medium transition"
                    >
                        <span>See All Features</span>
                    </Link>
                </AnimatedContainer>

                {/* Demo Preview */}
                <AnimatedContainer delay={0.5} className="relative z-10 max-w-4xl mx-auto mt-16 px-4">
                    <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl shadow-black/50 p-8 hover:border-[#35AEF3]/30 transition-colors duration-500">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-dashed border-gray-700 hover:border-[#35AEF3]/50 p-12 flex flex-col items-center justify-center transition-all duration-300 group">
                            {/* Animated Icon */}
                            <motion.div
                                className="w-20 h-20 rounded-2xl bg-[#35AEF3]/10 border border-[#35AEF3]/20 flex items-center justify-center mb-6 group-hover:bg-[#35AEF3]/20 transition-colors"
                                animate={{
                                    y: [0, -8, 0],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <FileText className="w-10 h-10 text-[#35AEF3]" />
                            </motion.div>

                            {/* Animated Text */}
                            <motion.p
                                className="text-gray-300 text-lg"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                Smart Document Processing
                            </motion.p>
                            <p className="text-gray-500 text-sm mt-2">PDF, PNG, JPG, WEBP • Max 50MB • Mistral OCR 2512</p>

                            {/* Animated Button */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    href="/extract"
                                    className="mt-6 inline-block bg-[#35AEF3] hover:bg-[#4FBEF5] text-white px-6 py-3 rounded-lg font-medium transition shadow-lg shadow-[#35AEF3]/25"
                                >
                                    Upload Document
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </AnimatedContainer>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 md:py-32 bg-gray-950">
                <div className="mx-auto w-full max-w-5xl space-y-8 px-4">
                    <AnimatedContainer className="mx-auto max-w-3xl text-center">
                        <h2 className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl xl:font-extrabold text-white">
                            🤖 Advanced OCR Features
                        </h2>
                        <p className="text-gray-400 mt-4 text-sm tracking-wide text-balance md:text-base">
                            Mistral OCR 2512 with smart classification, structured extraction, and zero-storage processing.
                        </p>
                    </AnimatedContainer>

                    <AnimatedContainer
                        delay={0.4}
                        className="grid grid-cols-1 divide-x divide-y divide-dashed divide-gray-800 border border-dashed border-gray-800 sm:grid-cols-2 md:grid-cols-3 bg-gray-900/30"
                    >
                        {features.map((feature, i) => (
                            <FeatureCard key={i} feature={feature} patternIndex={i} />
                        ))}
                    </AnimatedContainer>
                </div>
            </section>

            {/* How It Works */}
            <HowItWorks />

            {/* CTA Section with Marquee */}
            <CTAWithMarquee />

            {/* Footer */}
            <footer className="py-8 px-4 bg-gray-950 border-t border-gray-800/50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col items-center text-center gap-4">
                        {/* Logo */}
                        <img
                            src="/Conqrai_logo.svg"
                            alt="ConqrAI"
                            className="h-16 object-contain"
                        />

                        {/* Info */}
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <div className="w-2 h-2 rounded-full bg-[#35AEF3] animate-pulse"></div>
                            <span>Powered by ConqrOCR</span>
                            <span>•</span>
                            <span>Your data is never stored</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
