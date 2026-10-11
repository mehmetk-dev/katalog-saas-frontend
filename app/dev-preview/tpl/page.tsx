// GEÇİCİ: şablon denetimi için — commit'lenmeyecek
import { Grid } from './grid'

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string; t?: string; z?: string }> }) {
    const { v = 'base', t, z = '0.3' } = await searchParams
    return <Grid v={v} t={t} z={z} />
}
