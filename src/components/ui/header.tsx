'use client';
import React from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { createPortal } from 'react-dom';
import { ArrowRight } from 'lucide-react';

export function Header() {
    const [open, setOpen] = React.useState(false);
    const scrolled = useScroll(10);

    const links = [
        {
            label: 'Features',
            href: '#features',
        },
        {
            label: 'How It Works',
            href: '#how-it-works',
        },
        {
            label: 'Extract',
            href: '/extract',
        },
    ];

    // Smooth scroll handler for anchor links
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith('#')) {
            e.preventDefault();
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setOpen(false);
        }
    };

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <header
            className={cn('sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300', {
                'bg-gray-950/95 supports-[backdrop-filter]:bg-gray-950/80 border-gray-800 backdrop-blur-lg':
                    scrolled,
            })}
        >
            <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="hover:scale-105 transition-transform duration-300">
                    <img
                        src="/logo.png"
                        alt="Text Extracteur"
                        className="h-14 w-14 object-contain"
                    />
                </Link>

                {/* Desktop Navigation - Centered */}
                <div className="hidden items-center gap-6 md:flex absolute left-1/2 -translate-x-1/2">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            className={buttonVariants({ variant: 'ghost', className: 'text-gray-300 hover:text-white hover:bg-gray-800' })}
                            href={link.href}
                            onClick={(e) => handleClick(e, link.href)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop CTA Button */}
                <div className="hidden md:flex">
                    <Link href="/extract">
                        <Button className="bg-[#35AEF3] hover:bg-[#4FBEF5] text-white gap-2">
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setOpen(!open)}
                    className="md:hidden border-gray-700 bg-transparent text-white hover:bg-gray-800"
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    aria-label="Toggle menu"
                >
                    <MenuToggleIcon open={open} className="size-5" duration={300} />
                </Button>
            </nav>

            {/* Mobile Menu */}
            <MobileMenu open={open} className="flex flex-col justify-between gap-2">
                <div className="grid gap-y-2">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            className={buttonVariants({
                                variant: 'ghost',
                                className: 'justify-start text-gray-300 hover:text-white hover:bg-gray-800',
                            })}
                            href={link.href}
                            onClick={(e) => handleClick(e, link.href)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
                <div className="flex flex-col gap-2">
                    <Link href="/extract" onClick={() => setOpen(false)}>
                        <Button className="w-full bg-[#35AEF3] hover:bg-[#4FBEF5] text-white gap-2">
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </MobileMenu>
        </header>
    );
}

type MobileMenuProps = React.ComponentProps<'div'> & {
    open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!open || !mounted) return null;

    return createPortal(
        <div
            id="mobile-menu"
            className={cn(
                'bg-gray-950/95 supports-[backdrop-filter]:bg-gray-950/90 backdrop-blur-lg',
                'fixed top-20 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-t border-gray-800 md:hidden',
            )}
        >
            <div
                data-slot={open ? 'open' : 'closed'}
                className={cn(
                    'data-[slot=open]:animate-in data-[slot=open]:fade-in-0 data-[slot=open]:zoom-in-95 ease-out duration-200',
                    'size-full p-4',
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}
