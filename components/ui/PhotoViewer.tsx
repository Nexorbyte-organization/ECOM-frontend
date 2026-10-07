'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export interface Photo { src: string; alt: string }

interface PhotoViewerProps {
    photos: Photo[];
    /** Index of the photo on screen; null keeps the viewer closed. */
    index: number | null;
    onClose: () => void;
    onIndexChange: (index: number) => void;
    /** Optional panel under the photo: name, stats, actions. */
    children?: React.ReactNode;
    label?: string;
}

/** A larger view of a photo (or a few). Esc and the backdrop close it; arrow keys move between photos. */
export default function PhotoViewer({ photos, index, onClose, onIndexChange, children, label = 'Photo' }: PhotoViewerProps) {
    const { dir } = useLanguage();
    const dialogRef = useRef<HTMLDivElement>(null);
    const open = index !== null && photos.length > 0 && typeof document !== 'undefined';
    const count = photos.length;

    useEffect(() => {
        if (!open) return;
        const previousFocus = document.activeElement as HTMLElement | null;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => dialogRef.current?.focus());
        const step = (delta: number) => onIndexChange(((index as number) + delta + count) % count);
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (count < 2) return;
            // Arrow direction follows reading direction.
            const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
            const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
            if (event.key === forward) step(1);
            if (event.key === back) step(-1);
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
            previousFocus?.focus();
        };
    }, [open, index, count, dir, onClose, onIndexChange]);

    if (!open) return null;
    const photo = photos[index as number];
    const arrow = 'absolute top-[min(36vh,18rem)] z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-lg transition-transform hover:scale-105';

    return createPortal(
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto p-3 sm:p-6" role="presentation">
            <div className="fixed inset-0 bg-ink/80 animate-fade-in" onClick={onClose} />
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
                className="relative my-auto w-full max-w-2xl animate-scale-in focus:outline-none">
                <button type="button" onClick={onClose} aria-label="Close"
                    className="absolute end-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-white text-ink shadow-md transition-transform hover:scale-105">
                    <X size={18} />
                </button>
                {count > 1 && (
                    <>
                        <button type="button" aria-label="Previous photo" onClick={() => onIndexChange(((index as number) - 1 + count) % count)} className={`${arrow} start-3`}>
                            <ChevronLeft size={20} className="rtl:rotate-180" />
                        </button>
                        <button type="button" aria-label="Next photo" onClick={() => onIndexChange(((index as number) + 1) % count)} className={`${arrow} end-3`}>
                            <ChevronRight size={20} className="rtl:rotate-180" />
                        </button>
                    </>
                )}
                <div className="overflow-hidden rounded-2xl bg-dark-900 shadow-2xl">
                    <div className="flex max-h-[72vh] min-h-[16rem] items-center justify-center bg-ink">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.src} alt={photo.alt} className="max-h-[72vh] w-full object-contain" />
                    </div>
                    {(children || count > 1) && (
                        <div className="p-4 sm:p-5">
                            {children}
                            {count > 1 && <p className="mt-3 text-center text-xs tabular-nums text-dark-400">{(index as number) + 1} / {count}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
