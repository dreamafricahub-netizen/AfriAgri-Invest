'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sprout, Leaf, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function Navbar() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Accueil', href: '/', icon: Home },
        { name: 'Investir', href: '/investir', icon: Sprout },
        { name: 'Fermes', href: '/fermes', icon: Leaf },
        { name: 'Portefeuille', href: '/portefeuille', icon: Wallet },
        { name: 'Profil', href: '/profil', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 pb-safe pb-2 pt-2 z-50">
            <div className="flex justify-around items-center max-w-2xl mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center p-2 rounded-xl transition-colors duration-200",
                                isActive ? "text-agri-green" : "text-zinc-500 dark:text-zinc-400"
                            )}
                        >
                            <div className="relative">
                                <item.icon className={cn("w-6 h-6", isActive && "fill-current/20")} />
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-agri-green rounded-full"
                                    />
                                )}
                            </div>
                            <span className="text-[10px] font-medium mt-1">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
