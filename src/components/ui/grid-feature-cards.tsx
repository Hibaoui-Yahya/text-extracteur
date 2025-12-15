'use client';

import { cn } from '@/lib/utils';
import React from 'react';

type FeatureType = {
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    description: string;
};

type FeatureCardPorps = React.ComponentProps<'div'> & {
    feature: FeatureType;
    patternIndex?: number;
};

// Fixed patterns to avoid hydration mismatch
const FIXED_PATTERNS: number[][][] = [
    [[8, 2], [9, 4], [7, 1], [10, 3], [8, 5]],
    [[7, 3], [9, 1], [8, 4], [10, 2], [7, 5]],
    [[9, 2], [8, 3], [7, 4], [10, 1], [9, 5]],
    [[10, 3], [7, 2], [8, 1], [9, 4], [8, 6]],
    [[8, 1], [10, 4], [7, 3], [9, 2], [8, 5]],
    [[7, 4], [8, 2], [9, 3], [10, 5], [7, 1]],
];

export function FeatureCard({ feature, className, patternIndex = 0, ...props }: FeatureCardPorps) {
    const p = FIXED_PATTERNS[patternIndex % FIXED_PATTERNS.length];
    // Use deterministic ID based on patternIndex to avoid hydration mismatch
    const patternId = `feature-grid-pattern-${patternIndex}`;

    return (
        <div className={cn('relative overflow-hidden p-6', className)} {...props}>
            <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
                <div className="from-[#35AEF3]/10 to-[#35AEF3]/5 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
                    <GridPattern
                        width={20}
                        height={20}
                        x="-12"
                        y="4"
                        squares={p}
                        patternId={patternId}
                        className="fill-[#35AEF3]/10 stroke-[#35AEF3]/30 absolute inset-0 h-full w-full mix-blend-overlay"
                    />
                </div>
            </div>
            <feature.icon className="text-[#35AEF3] size-6" strokeWidth={1.5} aria-hidden />
            <h3 className="mt-10 text-sm md:text-base text-white font-medium">{feature.title}</h3>
            <p className="text-gray-400 relative z-20 mt-2 text-xs font-light">{feature.description}</p>
        </div>
    );
}

interface GridPatternProps extends React.ComponentProps<'svg'> {
    width: number;
    height: number;
    x: string;
    y: string;
    squares?: number[][];
    patternId: string;
}

function GridPattern({
    width,
    height,
    x,
    y,
    squares,
    patternId,
    ...props
}: GridPatternProps) {
    return (
        <svg aria-hidden="true" {...props}>
            <defs>
                <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
                    <path d={`M.5 ${height}V.5H${width}`} fill="none" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
            {squares && (
                <svg x={x} y={y} className="overflow-visible">
                    {squares.map(([sx, sy], index) => (
                        <rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={sx * width} y={sy * height} />
                    ))}
                </svg>
            )}
        </svg>
    );
}
