import React from 'react'
import type { DividerPageProps } from './index'

export const TechDivider = React.memo(function TechDivider({
    categoryName,
    productCount = 0,
    description,
    primaryColor: _primaryColor = '#00ff41'
}: DividerPageProps) {
    return (
        <div className="relative w-full h-full bg-black text-[#00ff41] font-mono overflow-hidden flex flex-col p-12">
            {/* Matrix Rain Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden select-none text-[10px] leading-none break-all">
                {Array.from({ length: 5000 }).map((_, i) => i % 3 === 0 ? '1' : '0').join('')}
            </div>

            {/* Header Status */}
            <div className="w-full flex justify-between border-b border-[#00ff41]/50 pb-4 z-10">
                <span className="uppercase text-xs font-bold">&gt; SYSTEM_CHECK: OK</span>
                <span className="uppercase text-xs font-bold animate-pulse">LOADING_MODULE...</span>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center relative z-10">
                <div className="border-[2px] border-[#00ff41] p-16 shadow-[0_0_20px_rgba(0,255,65,0.2)] bg-black/80 max-w-5xl w-full">
                    <h2 className="text-8xl font-black uppercase tracking-tighter mb-8 glitched-text" data-text={categoryName}>
                        {categoryName}
                    </h2>

                    <div className="grid grid-cols-2 gap-8 border-t border-[#00ff41]/30 pt-8 mt-8">
                        <div>
                            <span className="text-xs text-[#00ff41]/60 block mb-2">&gt; DESCRIPTION_LOG</span>
                            {description && (
                                <p className="text-lg leading-relaxed font-bold">
                                    {description}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-[#00ff41]/60 block mb-2">&gt; OBJECT_COUNT</span>
                            <span className="text-6xl font-bold">{productCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ascii Art / Footer */}
            <div className="border-t border-[#00ff41]/50 pt-4 flex justify-between text-[10px] z-10">
                <pre>
                    {`   /\\
  /  \\
 /____\\`}
                </pre>
                <span className="self-end block">SECURE CONNECTION ESTABLISHED</span>
            </div>

            <style jsx>{`
                .glitched-text {
                    position: relative;
                }
                .glitched-text::before,
                .glitched-text::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                .glitched-text::before {
                    left: 2px;
                    text-shadow: -1px 0 red;
                    clip: rect(24px, 550px, 90px, 0);
                    animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
                }
                .glitched-text::after {
                    left: -2px;
                    text-shadow: -1px 0 blue;
                    clip: rect(85px, 550px, 140px, 0);
                    animation: glitch-anim-2 3s infinite linear alternate-reverse;
                }
                @keyframes glitch-anim-1 {
                    0% { clip: rect(20px, 9999px, 80px, 0); }
                    100% { clip: rect(60px, 9999px, 120px, 0); }
                }
                @keyframes glitch-anim-2 {
                    0% { clip: rect(100px, 9999px, 160px, 0); }
                    100% { clip: rect(10px, 9999px, 60px, 0); }
                }
            `}</style>
        </div>
    )
})
