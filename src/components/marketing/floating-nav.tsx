"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "#features", label: "Features" },
  { href: "#connect", label: "Connect" },
  { href: "#how", label: "How it works" },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

/**
 * Floating pill navbar. Sits detached from the top, animates in on load, and
 * tightens (narrower, stronger blur, subtle shadow) once the user scrolls.
 */
export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4">
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={cn(
          "pointer-events-auto mt-3 flex w-full items-center justify-between gap-2 rounded-full border px-3 py-2 backdrop-blur-xl transition-all duration-300",
          scrolled
            ? "border-border/70 bg-background/80 max-w-3xl shadow-lg shadow-black/5"
            : "border-border/40 bg-background/55 max-w-5xl",
        )}
      >
        <Link href="/" className="shrink-0 pl-2">
          <Logo className="text-sm" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors"
            >
              {l.icon ? <l.icon className="size-3.5" /> : null}
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden rounded-full sm:inline-flex"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/login">
              Get started <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </motion.header>

      {/* On mobile, surface Docs as a small floating chip so it's never hidden. */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto fixed right-5 bottom-5 md:hidden"
          >
            <Button asChild size="sm" className="rounded-full shadow-lg">
              <Link href="/docs">
                <BookOpen className="size-4" /> Docs
              </Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
