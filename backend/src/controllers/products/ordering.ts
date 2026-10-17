import { supabase } from '../../services/supabase';

/**
 * Manuel ürün sıralaması (display_order).
 *
 * Kurallar:
 * - Kanonik sıra: display_order artan (null en sonda) → created_at azalan → id artan.
 *   Son iki anahtar eşitlikleri bozar; böylece aynı display_order'a sahip ürünler
 *   (eski kayıtlar, aynı anda içe aktarılanlar) her istekte aynı sırada gelir ve
 *   sayfalar arasında ürün kaybolmaz/tekrarlanmaz.
 * - Taşıma işlemi kullanıcının TÜM ürünleri üzerinde yapılır (sayfa/filtreden bağımsız);
 *   sonuç 0..n-1 yoğun numaralandırmadır ve yalnızca değeri değişen satırlar yazılır.
 */

export type MovePosition = 'before' | 'after' | 'first' | 'last';

export interface ProductMove {
    id: string;
    position: MovePosition;
    targetId?: string;
}

export interface OrderedRow {
    id: string;
    display_order: number | null;
}

const PAGE_SIZE = 1000;

/** Liste sorgusuna kanonik sıralamayı uygular (sortBy=display_order) veya eşitlik bozucuları ekler. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyProductSort<Q extends { order: (...args: any[]) => Q }>(
    query: Q,
    sortBy: 'display_order' | 'created_at' | 'name' | 'price' | 'stock' | 'category',
    sortOrder: 'asc' | 'desc'
): Q {
    // Manuel sıra her zaman artan: "azalan manuel sıra" sürükle-bırak ile tutarsız olurdu
    const ascending = sortBy === 'display_order' ? true : sortOrder === 'asc';
    let ordered = query.order(sortBy, { ascending, nullsFirst: false });
    if (sortBy !== 'display_order') {
        ordered = ordered.order('display_order', { ascending: true, nullsFirst: false });
    }
    if (sortBy !== 'created_at') {
        ordered = ordered.order('created_at', { ascending: false });
    }
    return ordered.order('id', { ascending: true });
}

/** Kullanıcının tüm ürünlerini kanonik sırada (yalnızca id + display_order) getirir. */
export async function loadOrderedRows(userId: string): Promise<OrderedRow[]> {
    const rows: OrderedRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await applyProductSort(
            supabase.from('products').select('id, display_order').eq('user_id', userId),
            'display_order',
            'asc'
        ).range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        rows.push(...((data || []) as OrderedRow[]));
        if (!data || data.length < PAGE_SIZE) break;
    }
    return rows;
}

export class MoveError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

/**
 * Taşıma sonrası yazılması gereken (id, order) çiftlerini hesaplar. Saf fonksiyon.
 * Hedef yoksa / kaynak bulunamazsa MoveError fırlatır. Değişiklik yoksa boş dizi döner.
 */
export function computeMoveUpdates(rows: OrderedRow[], move: ProductMove): { id: string; order: number }[] {
    const sourceIndex = rows.findIndex((row) => row.id === move.id);
    if (sourceIndex === -1) throw new MoveError(404, 'Ürün bulunamadı');

    const remaining = rows.filter((row) => row.id !== move.id);
    let insertAt: number;

    if (move.position === 'first') {
        insertAt = 0;
    } else if (move.position === 'last') {
        insertAt = remaining.length;
    } else {
        if (!move.targetId || move.targetId === move.id) throw new MoveError(400, 'Geçersiz hedef ürün');
        const targetIndex = remaining.findIndex((row) => row.id === move.targetId);
        if (targetIndex === -1) throw new MoveError(404, 'Hedef ürün bulunamadı');
        insertAt = move.position === 'before' ? targetIndex : targetIndex + 1;
    }

    remaining.splice(insertAt, 0, rows[sourceIndex]);

    const updates: { id: string; order: number }[] = [];
    remaining.forEach((row, index) => {
        if (row.display_order !== index) updates.push({ id: row.id, order: index });
    });
    return updates;
}

/**
 * Yeni eklenen ürünlerin listenin en başına gelmesi için kullanılacak display_order değerleri.
 * count ürün için [min-count, ..., min-1] döner (verilen sırayı korur).
 */
export async function getLeadingDisplayOrders(userId: string, count: number): Promise<number[]> {
    const { data, error } = await supabase
        .from('products')
        .select('display_order')
        .eq('user_id', userId)
        .not('display_order', 'is', null)
        .order('display_order', { ascending: true })
        .limit(1);

    if (error) throw error;
    const hasProducts = (data?.length ?? 0) > 0;
    const currentMin = hasProducts ? Number(data![0].display_order) : count;
    return Array.from({ length: count }, (_, index) => currentMin - count + index);
}
