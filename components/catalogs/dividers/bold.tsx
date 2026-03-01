import React from 'react'
import type { DividerPageProps } from './index'

export const BoldDivider = React.memo(function BoldDivider({
    categoryName,
    productCount = 0,
    description,
    primaryColor: _primaryColor = '#000000'
}: DividerPageProps) {
    return (
        <div className="relative w-full h-full bg-black text-white font-sans overflow-hidden flex flex-col justify-center p-12">
            {/* Background Typography */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none select-none">
                <span className="text-[500px] font-black leading-none whitespace-nowrap -ml-20">
                    BOLD
                </span>
            </div>

            <div className="relative z-10 border-l-[20px] border-white pl-12 py-12">
                <span className="block text-9xl font-black mb-4 leading-none text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                    {productCount < 10 ? `0${productCount}` : productCount}
                </span>

                <h2 className="text-[140px] leading-[0.8] font-black uppercase tracking-tighter mb-12 break-words">
                    {categoryName}
                </h2>

                {description && (
                    <p className="text-3xl font-bold max-w-4xl leading-tight border-t-4 border-[#FF4400] pt-6">
                        {description}
                    </p>
                )}
            </div>

            <div className="absolute bottom-12 right-12">
                <div className="bg-white text-black px-6 py-2 text-xl font-black uppercase transform -rotate-2">
                    Section Start
                </div>
            </div>
        </div>
    )
})
