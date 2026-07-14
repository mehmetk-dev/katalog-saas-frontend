import { NextRequest, NextResponse } from "next/server"

const API_BASE = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "")

interface RouteContext {
    params: Promise<{ path?: string[] }>
}

function getTargetUrl(request: NextRequest, path: string[] = []): string {
    const target = new URL(`${API_BASE}/pdf-exports/${path.map(encodeURIComponent).join("/")}`)
    request.nextUrl.searchParams.forEach((value, key) => {
        target.searchParams.append(key, value)
    })
    return target.toString()
}

async function proxyPdfExportRequest(request: NextRequest, context: RouteContext) {
    const { path = [] } = await context.params
    const headers = new Headers()
    const authorization = request.headers.get("authorization")
    const contentType = request.headers.get("content-type")

    if (authorization) headers.set("authorization", authorization)
    if (contentType) headers.set("content-type", contentType)
    headers.set("x-forwarded-host", request.nextUrl.host)
    headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""))

    const hasBody = request.method !== "GET" && request.method !== "HEAD"
    const response = await fetch(getTargetUrl(request, path), {
        method: request.method,
        headers,
        body: hasBody ? await request.text() : undefined,
        cache: "no-store",
        redirect: "manual",
    })

    const responseHeaders = new Headers()
    const passthroughHeaders = ["content-type", "content-disposition", "location"]
    for (const header of passthroughHeaders) {
        const value = response.headers.get(header)
        if (value) responseHeaders.set(header, value)
    }
    const responseContentType = response.headers.get("content-type")

    if (
        request.method === "GET"
        && path[path.length - 1] === "share-link"
        && response.ok
        && responseContentType?.includes("application/json")
    ) {
        const data = await response.json() as { url?: string; expiresAt?: string }
        if (typeof data.url === "string") {
            try {
                const url = new URL(data.url)
                if (url.pathname.startsWith("/api/v1/pdf-exports/")) {
                    url.protocol = request.nextUrl.protocol
                    url.host = request.nextUrl.host
                    url.pathname = url.pathname.replace("/api/v1/pdf-exports/", "/api/pdf-exports/")
                    data.url = url.toString()
                }
            } catch {
                // Keep backend URL if it is not parseable.
            }
        }

        return NextResponse.json(data, { status: response.status })
    }

    return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    })
}

export function GET(request: NextRequest, context: RouteContext) {
    return proxyPdfExportRequest(request, context)
}

export function POST(request: NextRequest, context: RouteContext) {
    return proxyPdfExportRequest(request, context)
}

export function DELETE(request: NextRequest, context: RouteContext) {
    return proxyPdfExportRequest(request, context)
}
