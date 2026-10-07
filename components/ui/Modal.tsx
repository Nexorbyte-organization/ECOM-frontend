'use client';

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            const previousFocus = document.activeElement as HTMLElement | null;
            requestAnimationFrame(() => dialogRef.current?.focus());
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleKeyDown);
                previousFocus?.focus();
            };
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-3 sm:p-6" role="presentation">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-ink/50 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                tabIndex={-1}
                className={cn(
                    'relative bg-dark-900 rounded-xl shadow-2xl border border-dark-600 w-full max-w-lg my-8 max-h-[88dvh] overflow-y-auto animate-scale-in focus:outline-none',
                    className
                )}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between p-6 border-b border-dark-700">
                        <h2 id={titleId} className="display-sm text-lg text-dark-50">{title}</h2>
                        <button
                            onClick={onClose}
                            aria-label="Close dialog"
                            className="p-1.5 rounded-md hover:bg-dark-800 text-dark-400 hover:text-dark-50 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-4 sm:p-6">{children}</div>
            </div>
        </div>,
        document.body
    );
}
