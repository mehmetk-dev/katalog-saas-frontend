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

export interface DividerPageProps {
    categoryName: string
    productCount?: number
    description?: string | null
    image?: string | null
    firstProductImage?: string | null
    primaryColor?: string
}

export type CategoryDividerProps = DividerPageProps;

interface DividerRegistry {
    [key: string]: React.ComponentType<DividerPageProps>
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

export function CategoryDividerRenderer(props: DividerPageProps & { theme?: string }) {
    const theme = props.theme || 'modern';
    const SelectedDivider = DIVIDER_THEMES[theme] || DIVIDER_THEMES['modern'];

    // Normalize props to ensure image and productCount are available
    const normalizedProps: DividerPageProps = {
        ...props,
        image: props.image || props.firstProductImage,
        productCount: props.productCount || 0
    };

    return (
        <div style={{ width: '794px', height: '1123px', overflow: 'hidden' }}>
            <SelectedDivider {...normalizedProps} />
        </div>
    );
}
