import { NextRequest, NextResponse } from "next/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getActivityLogs, ActivityType } from "@/lib/activity-logger"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single()

        if (!profile?.is_admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "50")
        const activityType = searchParams.get("activityType") as ActivityType | undefined
        const userId = searchParams.get("userId") || undefined
        const startDate = searchParams.get("startDate") || undefined
        const endDate = searchParams.get("endDate") || undefined

        const { logs, total } = await getActivityLogs(page, limit, {
            activityType,
            userId,
            startDate,
            endDate,
        })

        return NextResponse.json({ logs, total })
    } catch (error) {
        console.error("Failed to fetch activity logs:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
