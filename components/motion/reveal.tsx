'use client';

import { m } from 'motion/react';

/** Fades and lifts content in once as it scrolls into view. */
export function Reveal({ as = 'div', className, children, delay = 0 }: { as?: 'div' | 'section' | 'li'; className?: string; children: React.ReactNode; delay?: number }) {
    const Comp = m[as];
    return (
        <Comp className={className} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.3, delay, ease: [0.25, 1, 0.5, 1] }}>
            {children}
        </Comp>
    );
}
