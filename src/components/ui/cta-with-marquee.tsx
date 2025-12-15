"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface VerticalMarqueeProps {
    children: ReactNode;
    pauseOnHover?: boolean;
    reverse?: boolean;
    className?: string;
    speed?: number;
}

function VerticalMarquee({
    children,
    pauseOnHover = false,
    reverse = false,
    className,
    speed = 30,
}: VerticalMarqueeProps) {
    return (
        <div
            className={cn(
                "group flex flex-col overflow-hidden",
                className
            )}
            style={
                {
                    "--duration": `${speed}s`,
                } as React.CSSProperties
            }
        >
            <div
                className={cn(
                    "flex shrink-0 flex-col animate-marquee-vertical",
                    reverse && "[animation-direction:reverse]",
                    pauseOnHover && "group-hover:[animation-play-state:paused]"
                )}
            >
                {children}
            </div>
            <div
                className={cn(
                    "flex shrink-0 flex-col animate-marquee-vertical",
                    reverse && "[animation-direction:reverse]",
                    pauseOnHover && "group-hover:[animation-play-state:paused]"
                )}
                aria-hidden="true"
            >
                {children}
            </div>
        </div>
    );
}

const marqueeItems = [
    "CVs & Resumes",
    "Invoices",
    "Contracts",
    "Receipts",
    "Forms",
    "Books",
    "Manuals",
];

export function CTAWithMarquee() {
    const marqueeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const marqueeContainer = marqueeRef.current;
        if (!marqueeContainer) return;

        const updateOpacity = () => {
            const items = marqueeContainer.querySelectorAll('.marquee-item');
            const containerRect = marqueeContainer.getBoundingClientRect();
            const centerY = containerRect.top + containerRect.height / 2;

            items.forEach((item) => {
                const itemRect = item.getBoundingClientRect();
                const itemCenterY = itemRect.top + itemRect.height / 2;
                const distance = Math.abs(centerY - itemCenterY);
                const maxDistance = containerRect.height / 2;
                const normalizedDistance = Math.min(distance / maxDistance, 1);
                const opacity = 1 - normalizedDistance * 0.75;
                (item as HTMLElement).style.opacity = opacity.toString();
            });
        };

        const animationFrame = () => {
            updateOpacity();
            requestAnimationFrame(animationFrame);
        };

        const frame = requestAnimationFrame(animationFrame);

        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <section className="bg-gray-950 text-white flex items-center justify-center px-6 py-24 overflow-hidden">
            <div className="w-full max-w-6xl animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 max-w-xl">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
                            Ready to{" "}
                            <span className="bg-gradient-to-r from-[#35AEF3] to-[#4FBEF5] bg-clip-text text-transparent">
                                Extract Text?
                            </span>
                        </h2>
                        <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                            Start using our AI-powered OCR engine for free. No signup required.
                            Extract text from any document in seconds.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/extract"
                                className="group relative px-8 py-4 bg-[#35AEF3] text-white rounded-full font-medium overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#35AEF3]/25 flex items-center gap-2"
                            >
                                <span className="relative z-10">Try Text Extracteur Now</span>
                                <ArrowRight className="w-5 h-5 relative z-10" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                            </Link>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500 text-sm">
                            <div className="w-2 h-2 rounded-full bg-[#35AEF3] animate-pulse"></div>
                            <span>Powered by Mistral AI Pixtral</span>
                            <span>•</span>
                            <span>Your data is never stored</span>
                        </div>
                    </div>

                    {/* Right Marquee */}
                    <div ref={marqueeRef} className="relative h-[400px] lg:h-[500px] flex items-center justify-center">
                        <div className="relative w-full h-full">
                            <VerticalMarquee speed={25} className="h-full">
                                {marqueeItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight py-6 text-gray-300 marquee-item"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </VerticalMarquee>

                            {/* Top vignette */}
                            <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-950 via-gray-950/50 to-transparent z-10"></div>

                            {/* Bottom vignette */}
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent z-10"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
