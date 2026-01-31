import React from 'react'
import { ModernDivider } from './modern'
import { MinimalDivider } from './minimal'
import { FashionDivider } from './fashion'
import { MagazineDivider } from './magazine'
import { IndustrialDivider } from './industrial'
import { CorporateDivider } from './corporate'
import { LuxuryDivider } from './luxury'
import { TechDivider } from './tech'
import { ArtisticDivider } from './artistic'
import { BoldDivider } from './bold'

export interface CategoryDividerProps {
    categoryName: string
    firstProductImage?: string | null
    primaryColor?: string
}

interface DividerRegistry {
    [key: string]: React.ComponentType<CategoryDividerProps>
}

export const DIVIDER_THEMES: DividerRegistry = {
    'modern': ModernDivider,
    'minimal': MinimalDivider,
    'fashion': FashionDivider,
    'magazine': MagazineDivider,
    'industrial': IndustrialDivider,
    'corporate': CorporateDivider,
    'luxury': LuxuryDivider,
    'tech': TechDivider,
    'artistic': ArtisticDivider,
    'bold': BoldDivider,
};

export function CategoryDividerRenderer(props: CategoryDividerProps & { theme?: string }) {
    const theme = props.theme || 'modern';
    const SelectedDivider = DIVIDER_THEMES[theme] || DIVIDER_THEMES['modern'];

    return (
        <div style={{ width: '794px', height: '1123px', overflow: 'hidden' }}>
            <SelectedDivider {...props} />
        </div>
    );
}
