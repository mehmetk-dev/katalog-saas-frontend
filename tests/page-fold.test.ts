import { describe, expect, it } from "vitest"

import { clampCorner, clipPolygon, computeFold, polygonToClipPath } from "@/app/catalog/[slug]/_lib/page-fold"

const W = 100
const H = 140

const area = (points: { x: number; y: number }[]) =>
    Math.abs(points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length]
        return sum + p.x * q.y - q.x * p.y
    }, 0)) / 2

describe("computeFold", () => {
    it("returns null when the corner has not moved", () => {
        expect(computeFold({ x: W, y: H }, H, W, H)).toBeNull()
    })

    it("lays the back page flat on the left once the sheet is fully turned", () => {
        const fold = computeFold({ x: -W, y: H }, H, W, H)!
        expect(area(fold.frontClip)).toBeCloseTo(0)
        expect(area(fold.flapPolygon)).toBeCloseTo(W * H)
        const [a, b, c, d, e, f] = fold.backMatrix
        expect([a, b, c, d, e, f].map((v) => Math.round(v * 1000) / 1000)).toEqual([1, 0, 0, 1, -W, 0])
        expect(fold.progress).toBe(1)
    })

    it("splits the sheet between front and flap without losing paper", () => {
        const fold = computeFold({ x: 40, y: 110 }, H, W, H)!
        expect(area(fold.frontClip) + area(fold.flapPolygon)).toBeCloseTo(W * H)
        // Arka yüz kırpması, katlanan parçayla aynı alanı kaplar
        expect(area(fold.backClip)).toBeCloseTo(area(fold.flapPolygon))
        expect(fold.progress).toBeCloseTo(0.3)
    })

    it("maps the grabbed corner of the back page onto the drag point", () => {
        const p = { x: 30, y: 100 }
        const [a, b, c, d, e, f] = computeFold(p, H, W, H)!.backMatrix
        // Arka sayfanın sol alt köşesi (0, H) yaprağın sağ alt köşesinin arkasıdır
        expect(a * 0 + c * H + e).toBeCloseTo(p.x)
        expect(b * 0 + d * H + f).toBeCloseTo(p.y)
    })

    it("keeps the flap on the spine side of the fold line", () => {
        const fold = computeFold({ x: 20, y: 120 }, H, W, H)!
        const normal = { x: Math.sin(fold.foldAngle) * -1, y: Math.cos(fold.foldAngle) }
        for (const p of fold.flapPolygon) {
            const s = (p.x - fold.foldOrigin.x) * normal.x + (p.y - fold.foldOrigin.y) * normal.y
            expect(s).toBeLessThanOrEqual(1e-6)
        }
    })
})

describe("clampCorner", () => {
    it("does not let the corner tear away from the spine", () => {
        const p = clampCorner({ x: -300, y: H }, H, W, H)
        expect(Math.hypot(p.x, p.y - H)).toBeCloseTo(W)
    })

    it("leaves reachable points untouched", () => {
        expect(clampCorner({ x: 50, y: 120 }, H, W, H)).toEqual({ x: 50, y: 120 })
    })
})

describe("clipPolygon / polygonToClipPath", () => {
    it("clips a square in half", () => {
        const square = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }]
        expect(area(clipPolygon(square, (p) => 1 - p.x))).toBeCloseTo(2)
    })

    it("hides the element when nothing is left", () => {
        expect(polygonToClipPath([])).toBe("polygon(0 0, 0 0, 0 0)")
    })
})
