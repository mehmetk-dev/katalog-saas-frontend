/**
 * Kâğıt sayfa çevirme geometrisi (2B katlama).
 *
 * Koordinatlar "sırt" eksenine göredir: sırt x = 0, çevrilen yaprak sağda [0, W] aralığında,
 * çevrildikten sonra solda [-W, 0] aralığına oturur. Yaprağın tutulan köşesi C0 = (W, cornerY)
 * (cornerY: 0 üst köşe, H alt köşe) P noktasına çekilir. Katlanma çizgisi C0–P doğru parçasının
 * orta dikmesidir: yaprağın köşe tarafında kalan kısmı bu çizgiye göre yansır ve arka yüzü görünür.
 *
 * Geri çevirme aynı geometriyle ters yönde oynatılır (P, bitiş noktasından C0'a gider).
 */

export interface Point {
    x: number
    y: number
}

/** CSS matrix(a, b, c, d, e, f) */
export type Affine = [number, number, number, number, number, number]

export interface FoldGeometry {
    /** Ön yüzün görünen kısmı (yaprak koordinatları, [0, W]) */
    frontClip: Point[]
    /** Katlanıp dönen kısmın ekrandaki yeri (sırt koordinatları) */
    flapPolygon: Point[]
    /** Arka yüz sayfasının kendi kutusundan (sol üst köşe 0,0) sırt koordinatlarına dönüşümü */
    backMatrix: Affine
    /** Arka yüz sayfasının görünen kısmı (kendi kutusunun koordinatları) */
    backClip: Point[]
    /** Katlanma çizgisi üzerindeki nokta ve çizginin yönü (radyan) */
    foldOrigin: Point
    foldAngle: number
    /** 0: çevrilmeye başlanmadı, 1: yaprak tamamen karşıya geçti */
    progress: number
}

const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y

/** Dışbükey çokgeni bir yarı düzleme göre kırpar (Sutherland–Hodgman tek kenar). keep(p) >= 0 olan taraf kalır. */
export function clipPolygon(polygon: Point[], keep: (p: Point) => number): Point[] {
    const result: Point[] = []
    for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i]
        const b = polygon[(i + 1) % polygon.length]
        const fa = keep(a)
        const fb = keep(b)
        if (fa >= 0) result.push(a)
        if ((fa >= 0) !== (fb >= 0)) {
            const t = fa / (fa - fb)
            result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
        }
    }
    return result
}

/**
 * Kâğıt sırttan kopamaz: tutulan köşe, aynı kenardaki sırt noktasına en fazla W, karşı kenardaki
 * sırt noktasına en fazla köşegen kadar uzaklaşabilir.
 */
export function clampCorner(p: Point, cornerY: number, width: number, height: number): Point {
    let point = { ...p }
    const limits: Array<[Point, number]> = [
        [{ x: 0, y: cornerY }, width],
        [{ x: 0, y: height - cornerY }, Math.hypot(width, height)],
    ]
    for (const [pin, radius] of limits) {
        const dx = point.x - pin.x
        const dy = point.y - pin.y
        const distance = Math.hypot(dx, dy)
        if (distance > radius) {
            point = { x: pin.x + (dx / distance) * radius, y: pin.y + (dy / distance) * radius }
        }
    }
    return point
}

/** P köşeye çok yakınsa (katlama yok) null döner */
export function computeFold(p: Point, cornerY: number, width: number, height: number): FoldGeometry | null {
    const corner = { x: width, y: cornerY }
    const vx = corner.x - p.x
    const vy = corner.y - p.y
    const length = Math.hypot(vx, vy)
    if (length < 0.5) return null

    // n: katlanma çizgisinin normali, köşe tarafını gösterir
    const n = { x: vx / length, y: vy / length }
    const origin = { x: (corner.x + p.x) / 2, y: (corner.y + p.y) / 2 }
    const side = (q: Point) => dot({ x: q.x - origin.x, y: q.y - origin.y }, n)
    const reflect = (q: Point): Point => {
        const s = side(q)
        return { x: q.x - 2 * s * n.x, y: q.y - 2 * s * n.y }
    }

    const sheet: Point[] = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
    ]
    const frontClip = clipPolygon(sheet, (q) => -side(q))
    const folded = clipPolygon(sheet, side)

    // Arka yüz sayfası çevrildikten sonra [-W, 0] kutusunda düz durur. Kutudaki (u, v) noktası
    // yaprağın (W - u, v) noktasının arkasıdır; katlanınca o nokta yansır.
    const mapBack = (u: number, v: number) => reflect({ x: width - u, y: v })
    const o = mapBack(0, 0)
    const ex = mapBack(1, 0)
    const ey = mapBack(0, 1)
    const backMatrix: Affine = [ex.x - o.x, ex.y - o.y, ey.x - o.x, ey.y - o.y, o.x, o.y]
    const backClip = folded.map((q) => ({ x: width - q.x, y: q.y }))

    return {
        frontClip,
        flapPolygon: folded.map(reflect),
        backMatrix,
        backClip,
        foldOrigin: origin,
        // Çizgi yönü d, n'nin -90° döndürülmüşü: d'nin +90° dönüğü köşe tarafını gösterir
        foldAngle: Math.atan2(-n.x, n.y),
        progress: Math.min(1, Math.max(0, (width - p.x) / (2 * width))),
    }
}

export function polygonToClipPath(points: Point[], offsetX = 0): string {
    if (points.length < 3) return "polygon(0 0, 0 0, 0 0)"
    return `polygon(${points.map((q) => `${(q.x + offsetX).toFixed(2)}px ${q.y.toFixed(2)}px`).join(", ")})`
}
