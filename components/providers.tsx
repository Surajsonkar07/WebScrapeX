'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/overlay';

export type AppMode = 'supabase' | 'local';

const ModeContext = React.createContext<AppMode>('local');
export const useAppMode = () => React.useContext(ModeContext);

export function Providers({ mode, children }: { mode: AppMode; children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ModeContext.Provider value={mode}>
                <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}>
                    <LazyMotion features={domAnimation} strict>
                        <TooltipProvider>{children}</TooltipProvider>
                    </LazyMotion>
                </MotionConfig>
                <Toaster
                    position="bottom-right"
                    closeButton
                    toastOptions={{
                        classNames: {
                            toast: '!rounded-lg !border !border-border !bg-card !text-foreground !shadow-panel !font-sans',
                            description: '!text-muted-foreground',
                        },
                    }}
                    className="[--mobile-offset-bottom:84px]"
                />
            </ModeContext.Provider>
        </ThemeProvider>
    );
}
