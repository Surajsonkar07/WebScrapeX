'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

/** Animates a number from 0 when it scrolls into view. */
export function CountUp({ value }: { value: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    const reduce = useReducedMotion();

    useEffect(() => {
        const el = ref.current;
        if (!el || !inView) return;
        if (reduce) {
            el.textContent = value.toLocaleString();
            return;
        }
        const controls = animate(0, value, {
            duration: 0.7,
            ease: [0.25, 1, 0.5, 1],
            onUpdate: (v) => {
                el.textContent = Math.round(v).toLocaleString();
            },
        });
        return () => controls.stop();
    }, [inView, value, reduce]);

    return <span ref={ref}>{value.toLocaleString()}</span>;
}
