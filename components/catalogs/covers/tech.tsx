import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function TechCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    productCount = 0,
    primaryColor = '#00ff41'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-black text-[#00ff41] overflow-hidden font-mono text-sm selection:bg-[#003B00] selection:text-white">
            {/* CRT Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-50" />

            <div className="relative z-10 w-full h-full flex flex-col p-8 border-[20px] border-[#0a0a0a] shadow-[inset_0_0_100px_rgba(0,255,65,0.1)]">
                {/* Header Terminal */}
                <div className="border-b border-[#00ff41]/30 pb-4 mb-4 flex justify-between items-end">
                    <div>
                        <span className="block opacity-50">root@system:~/catalog# ./init_sequence.sh</span>
                        <h1 className="text-4xl font-bold tracking-tighter uppercase mt-2 glow-text">
                            {catalogName}
                        </h1>
                    </div>
                    <div className="text-right">
                        <span className="block opacity-70">UPTIME: 99.99%</span>
                        <span className="font-bold">{new Date().toISOString().split('T')[0]}</span>
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="flex-1 grid grid-cols-12 gap-4">
                    {/* Left Data Column */}
                    <div className="col-span-4 border-r border-[#00ff41]/30 pr-4 flex flex-col justify-between">
                        <div className="space-y-4 text-xs opacity-80">
                            <p>&gt; MOUNTING ASSETS...</p>
                            <p>&gt; VERIFYING CHECKSUMS...</p>
                            <p>&gt; DECRYPTING SECURE DATA...</p>
                            <p className="text-white bg-[#00ff41]/20 p-1">&gt; STATUS: ONLINE</p>
                        </div>

                        <div className="border border-[#00ff41] p-2 mt-auto">
                            <div className="flex justify-between border-b border-[#00ff41]/50 mb-2">
                                <span>SKU_COUNT</span>
                                <span>{productCount}</span>
                            </div>
                            <div className="h-16 w-full bg-[#00ff41]/10 flex items-end gap-1">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="bg-[#00ff41]" style={{ width: '10%', height: `${Math.random() * 100}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Visual Area */}
                    <div className="col-span-8 relative">
                        {coverImageUrl ? (
                            <div className="w-full h-full relative border border-[#00ff41]/50 p-1">
                                <Image src={coverImageUrl} alt="Tech" fill className="object-cover grayscale contrast-150 brightness-75 sepia-[.5] hue-rotate-[90deg]" />
                                <div className="absolute inset-0 bg-[#00ff41]/10 mix-blend-hard-light" />

                                {/* HUD overlay */}
                                <div className="absolute top-4 right-4 text-xs border border-[#00ff41] px-2 py-1 bg-black/80">TARGET_LOCKED</div>
                                <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-[#00ff41]" />
                                <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-[#00ff41]" />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center flex-col border border-dashed border-[#00ff41]/50">
                                <span className="text-6xl animate-pulse">NO_SIGNAL</span>
                                <span className="text-xs mt-4 opacity-50">CHECK CONNECTION CABLE</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Description */}
                {coverDescription && (
                    <div className="mt-4 border-t border-[#00ff41]/30 pt-4">
                        <p className="text-sm font-bold opacity-90 max-w-3xl">
                            <span className="mr-2 text-white bg-[#00ff41]/50 px-1">&gt; INFO:</span>
                            {coverDescription}
                        </p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .glow-text {
                    text-shadow: 0 0 5px #00ff41, 0 0 10px #00ff41;
                }
            `}</style>
        </div>
    )
}
