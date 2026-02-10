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
    productCount?: number
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
        name: 'Modern Mimari',
        component: ModernCover,
        description: 'Izgara dokular ve glassmorphism ile büyük tipografi.'
    },
    'minimal': {
        name: 'Sade Minimalist',
        component: MinimalCover,
        description: 'Bol beyaz alan, ince tipografi, temiz görünüm.'
    },
    'fashion': {
        name: 'Moda Editoryal',
        component: FashionCover,
        description: 'Vogue tarzı tipografi, tam görsel odağı.'
    },
    'magazine': {
        name: 'Yaşam Tarzı Dergisi',
        component: MagazineCover,
        description: 'Barkod ve sayı tarihi detaylarıyla klasik dergi düzeni.'
    },
    'industrial': {
        name: 'Endüstriyel Kalın',
        component: IndustrialCover,
        description: 'Ağır fontlar, sarı vurgular, dikkat bandı estetiği.'
    },
    'corporate': {
        name: 'Kurumsal Güven',
        component: CorporateCover,
        description: 'Profesyonel mavi tonlar, yapılandırılmış ızgara düzeni.'
    },
    'luxury': {
        name: 'Lüks Altın',
        component: LuxuryCover,
        description: 'Siyah ve altın paleti, serif fontlar, zarif kenarlıklar.'
    },
    'tech': {
        name: 'Gelecek Teknoloji',
        component: TechCover,
        description: 'Karanlık mod, neon vurgular, dijital veri desenleri.'
    },
    'artistic': {
        name: 'Soyut Sanat',
        component: ArtisticCover,
        description: 'Asimetrik düzen, fırça darbeleri, yaratıcı hava.'
    },
    'bold': {
        name: 'Ultra Kalın',
        component: BoldCover,
        description: 'Maksimum etki tipografisi, yüksek kontrast.'
    }
};

export function CoverPageRenderer(props: CoverPageProps & { theme?: string }) {
    const theme = props.theme || 'modern';
    const SelectedCover = COVER_THEMES[theme]?.component || COVER_THEMES['modern'].component;

    return <SelectedCover {...props} />;
}
