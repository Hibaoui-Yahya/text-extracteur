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
            <nav className="mx-auto flex h-14 w-full max-w-4xl items-center justify-end px-4">
                {/* Back to Home Button - Right Corner */}
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
