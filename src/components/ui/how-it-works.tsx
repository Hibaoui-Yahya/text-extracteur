"use client";

import { cn } from "@/lib/utils";
import { Upload, Cpu, Copy } from "lucide-react";
import type React from "react";

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> { }

interface StepCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    benefits: string[];
}

const StepCard: React.FC<StepCardProps> = ({
    icon,
    title,
    description,
    benefits,
}) => (
    <div
        className={cn(
            "relative rounded-2xl border border-gray-800 bg-gray-900/50 p-6 text-white transition-all duration-300 ease-in-out",
            "hover:scale-105 hover:shadow-lg hover:border-[#35AEF3]/50 hover:bg-gray-800/70"
        )}
    >
        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#35AEF3]/10 text-[#35AEF3]">
            {icon}
        </div>
        {/* Title and Description */}
        <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
        <p className="mb-6 text-gray-400">{description}</p>
        {/* Benefits List */}
        <ul className="space-y-3">
            {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                    <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#35AEF3]/20">
                        <div className="h-2 w-2 rounded-full bg-[#35AEF3]"></div>
                    </div>
                    <span className="text-gray-400 text-sm">{benefit}</span>
                </li>
            ))}
        </ul>
    </div>
);

export const HowItWorks: React.FC<HowItWorksProps> = ({
    className,
    ...props
}) => {
    const stepsData = [
        {
            icon: <Upload className="h-6 w-6" />,
            title: "Upload Document",
            description:
                "Drop your PDF or image file into the upload area. We support multiple formats.",
            benefits: [
                "PDF, PNG, JPG, WEBP supported",
                "Up to 20MB file size",
                "Drag & drop or click to browse",
            ],
        },
        {
            icon: <Cpu className="h-6 w-6" />,
            title: "AI Extraction",
            description:
                "Our AI analyzes your document and extracts all text with structure preserved.",
            benefits: [
                "Powered by Mistral Pixtral",
                "Multi-language support",
                "Preserves formatting & layout",
            ],
        },
        {
            icon: <Copy className="h-6 w-6" />,
            title: "Copy & Use",
            description:
                "Get formatted text ready to use anywhere. Copy with one click.",
            benefits: [
                "Clean Markdown output",
                "One-click copy to clipboard",
                "Use anywhere instantly",
            ],
        },
    ];

    return (
        <section
            id="how-it-works"
            className={cn("w-full bg-gray-950 py-16 sm:py-24", className)}
            {...props}
        >
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="mx-auto mb-16 max-w-4xl text-center">
                    <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        How It Works
                    </h2>
                    <p className="mt-4 text-lg text-gray-400">
                        Extract text from any document in three simple steps
                    </p>
                </div>

                {/* Step Indicators with Connecting Line */}
                <div className="relative mx-auto mb-8 w-full max-w-4xl">
                    <div
                        aria-hidden="true"
                        className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2 bg-gray-800"
                    ></div>
                    <div className="relative grid grid-cols-3">
                        {stepsData.map((_, index) => (
                            <div
                                key={index}
                                className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full bg-[#35AEF3] font-bold text-white ring-4 ring-gray-950 shadow-lg shadow-[#35AEF3]/25"
                            >
                                {index + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Steps Grid */}
                <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
                    {stepsData.map((step, index) => (
                        <StepCard
                            key={index}
                            icon={step.icon}
                            title={step.title}
                            description={step.description}
                            benefits={step.benefits}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
