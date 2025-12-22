'use client';
import React from 'react';
import Link from 'next/link';
import { useScroll } from '@/components/ui/use-scroll';
import { cn } from '@/lib/utils';
import { ArrowLeft, Home } from 'lucide-react';

interface ExtractHeaderProps {
    className?: string;
}

export function ExtractHeader({ className }: ExtractHeaderProps) {
    const scrolled = useScroll(10);

    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300',
                {
                    'bg-gray-950/95 supports-[backdrop-filter]:bg-gray-950/80 border-gray-800/50 backdrop-blur-xl shadow-lg shadow-black/10':
                        scrolled,
                },
                className
            )}
        >
            <nav className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4">
                {/* Logo + Brand */}
                <Link
                    href="/"
                    className="flex items-center gap-3 group"
                >
                    <div className="relative">
                        <img
                            src="/logo.png"
                            alt="Text Extracteur"
                            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-[#35AEF3]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="hidden sm:block">
                        <span className="text-white font-semibold text-lg">Text Extracteur</span>
                        <span className="text-gray-500 text-xs block -mt-0.5">AI-Powered OCR</span>
                    </div>
                </Link>

                {/* Back to Home Button */}
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-all duration-200 group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                    <span className="hidden sm:inline">Back to Home</span>
                    <Home className="w-4 h-4 sm:hidden" />
                </Link>
            </nav>
        </header>
    );
}
