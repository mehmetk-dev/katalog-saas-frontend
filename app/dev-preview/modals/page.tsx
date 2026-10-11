// GEÇİCİ: görsel QA için — commit'lenmeyecek
import { PreviewShell } from '../shell'
import { Gallery } from './gallery'

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string; plan?: string }> }) {
    const { m = 'onboarding' } = await searchParams
    return <PreviewShell bare><Gallery m={m} /></PreviewShell>
}
