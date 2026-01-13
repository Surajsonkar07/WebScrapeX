import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Type, ArrowRight, MousePointer2 } from "lucide-react"
import { motion } from "framer-motion"

export function FontsCard({ fonts }: { fonts: string[] }) {
    if (!fonts || fonts.length === 0) return null;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <Card className="rounded-[2.5rem] border border-white/10 bg-card/40 backdrop-blur-2xl shadow-2xl h-full transition-all duration-500 group/card overflow-hidden">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" />
                    Typography & Typefaces
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-2 space-y-6">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-2 gap-3"
                >
                    {fonts.map((font, i) => (
                        <motion.div
                            key={i}
                            variants={item}
                            className="group/font p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white/5 border border-white/5 hover:border-primary/20 transition-all hover:bg-white/10 relative overflow-hidden flex flex-col justify-between h-auto min-h-[140px]"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 max-w-[80%]">
                                    <span className="text-[9px] md:text-[10px] font-mono font-black text-primary/60 uppercase tracking-widest truncate w-full">{font}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground/20 group-hover/font:text-primary transition-all group-hover/font:translate-x-1 shrink-0" />
                            </div>

                            <motion.p
                                whileHover={{ scale: 1.05, x: 5 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="text-2xl md:text-4xl leading-tight text-foreground/90 origin-left cursor-default select-none break-words"
                                style={{ fontFamily: font }}
                            >
                                The quick...
                            </motion.p>

                            <div className="absolute right-4 bottom-4 opacity-0 group-hover/font:opacity-100 transition-opacity">
                                <MousePointer2 className="w-3 h-3 md:w-4 md:h-4 text-primary animate-pulse" />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </CardContent>
        </Card>
    )
}
