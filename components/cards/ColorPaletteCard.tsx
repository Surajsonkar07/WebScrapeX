import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette, Copy, Check, Hash, Type } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export function ColorPaletteCard({ colors }: { colors: string[] }) {
    const [copiedColor, setCopiedColor] = useState<string | null>(null);
    const [format, setFormat] = useState<'hex' | 'rgb'>('hex');

    if (!colors || colors.length === 0) return null;

    const copyToClipboard = (color: string) => {
        const textToCopy = format === 'hex' ? color : hexToRgb(color);
        navigator.clipboard.writeText(textToCopy);
        setCopiedColor(color);
        setTimeout(() => setCopiedColor(null), 2000);
    };

    const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${r}, ${g}, ${b})`;
    };

    return (
        <Card className="rounded-[2rem] border border-white/10 bg-card/40 backdrop-blur-2xl shadow-2xl transition-all duration-500 overflow-hidden group/card">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Color Palette Analysis
                </CardTitle>
                <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                    <button
                        onClick={() => setFormat('hex')}
                        className={cn(
                            "px-3 py-1 text-[10px] font-bold rounded-full transition-all",
                            format === 'hex' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        HEX
                    </button>
                    <button
                        onClick={() => setFormat('rgb')}
                        className={cn(
                            "px-3 py-1 text-[10px] font-bold rounded-full transition-all",
                            format === 'rgb' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        RGB
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {colors.map((color, i) => (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ scale: 1.1, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => copyToClipboard(color)}
                            className="group relative flex flex-col items-center gap-2"
                        >
                            <div
                                className="w-full aspect-square rounded-[1rem] shadow-lg border-2 border-white/10 group-hover:border-primary/50 transition-colors relative overflow-hidden"
                                style={{ backgroundColor: color }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px]">
                                    <AnimatePresence mode="wait">
                                        {copiedColor === color ? (
                                            <motion.div
                                                key="check"
                                                initial={{ scale: 0, rotate: -45 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0 }}
                                            >
                                                <Check className="w-5 h-5 text-white" />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="copy"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                            >
                                                <Copy className="w-5 h-5 text-white" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className="flex flex-col items-center w-full px-1">
                                <span className="text-[10px] font-mono font-black tracking-wider text-foreground/80 group-hover:text-primary transition-colors uppercase text-center">
                                    {format === 'hex' ? color : hexToRgb(color).replace('rgb(', '').replace(')', '')}
                                </span>
                            </div>

                            {/* Toast Notification */}
                            <AnimatePresence>
                                {copiedColor === color && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                        animate={{ opacity: 1, y: -20, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-3 py-1.5 rounded-full shadow-2xl whitespace-nowrap z-50 pointer-events-none"
                                    >
                                        COPIED!
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
