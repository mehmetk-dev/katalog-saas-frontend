import React from 'react'
import { ModernCover } from './modern'
import { MinimalCover } from './minimal'
import { FashionCover } from './fashion'
import { MagazineCover } from './magazine'
import { IndustrialCover } from './industrial'
import { CorporateCover } from './corporate'
import { LuxuryCover } from './luxury'
import { TechCover } from './tech'
import { ArtisticCover } from './artistic'
import { BoldCover } from './bold'

export interface CoverPageProps {
    catalogName: string
    coverImageUrl?: string | null
    coverDescription?: string | null
    logoUrl?: string | null
    primaryColor?: string
    isExporting?: boolean
    titleFont?: string
}

interface CoverRegistry {
    [key: string]: {
        name: string;
        component: React.ComponentType<CoverPageProps>;
        description: string;
    }
}

export const COVER_THEMES: CoverRegistry = {
    'modern': {
        name: 'Modern Architectural',
        component: ModernCover,
        description: 'Large typography with grid textures and glassmorphism.'
    },
    'minimal': {
        name: 'Clean Minimalist',
        component: MinimalCover,
        description: 'Lots of white space, subtle typography, clean look.'
    },
    'fashion': {
        name: 'Fashion Editorial',
        component: FashionCover,
        description: 'Vogue-style typography, full image focus.'
    },
    'magazine': {
        name: 'Lifestyle Magazine',
        component: MagazineCover,
        description: 'Classic magazine layout with barcode and issue date details.'
    },
    'industrial': {
        name: 'Industrial Bold',
        component: IndustrialCover,
        description: 'Heavy fonts, yellow accents, caution tape aesthetics.'
    },
    'corporate': {
        name: 'Corporate Trust',
        component: CorporateCover,
        description: 'Professional blue tones, structured grid layout.'
    },
    'luxury': {
        name: 'Luxury Gold',
        component: LuxuryCover,
        description: 'Black and gold palette, serif fonts, elegant borders.'
    },
    'tech': {
        name: 'Tech Future',
        component: TechCover,
        description: 'Dark mode, neon accents, digital data patterns.'
    },
    'artistic': {
        name: 'Abstract Art',
        component: ArtisticCover,
        description: 'Asymmetric layout, brush strokes, creative vibe.'
    },
    'bold': {
        name: 'Ultra Bold',
        component: BoldCover,
        description: 'Maximum impact typography, high contrast.'
    }
};

export function CoverPageRenderer(props: CoverPageProps & { theme?: string }) {
    const theme = props.theme || 'modern';
    const SelectedCover = COVER_THEMES[theme]?.component || COVER_THEMES['modern'].component;

    return <SelectedCover {...props} />;
}
