"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import {
    bulkDeleteFeedbacks,
    bulkUpdateFeedbackStatus,
    deleteFeedback,
    getFeedbacks,
    type Feedback,
    updateFeedbackStatus,
} from "@/lib/actions/feedback"
import { useTranslation } from "@/lib/contexts/i18n-provider"

export function useAdminFeedbacks() {
    const { t } = useTranslation()
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
    const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<string[]>([])

    const loadFeedbacks = useCallback(async () => {
        return await getFeedbacks()
    }, [])

    const setFeedbacksData = useCallback((data: Feedback[]) => {
        setFeedbacks(data)
    }, [])

    const handleFeedbackStatusUpdate = async (id: string, status: Feedback["status"]) => {
        try {
            await updateFeedbackStatus(id, status)
            setFeedbacks(prev => prev.map((feedback) => (feedback.id === id ? { ...feedback, status } : feedback)))
            toast.success(t("admin.feedbackStatusUpdated"))
        } catch {
            toast.error(t("admin.operationFailed"))
        }
    }

    const handleFeedbackDelete = async (id: string) => {
        try {
            await deleteFeedback(id)
            setFeedbacks(prev => prev.filter((feedback) => feedback.id !== id))
            setSelectedFeedbackIds(prev => prev.filter((feedbackId) => feedbackId !== id))
            toast.success(t("admin.feedbackDeleted"))
        } catch (error) {
            console.error("Error deleting feedback:", error)
            toast.error(t("admin.feedbackDeleteError"))
        }
    }

    const handleBulkStatusUpdate = async (status: Feedback["status"]) => {
        if (selectedFeedbackIds.length === 0) {
            toast.error(t("admin.selectAtLeastOne"))
            return
        }

        try {
            await bulkUpdateFeedbackStatus(selectedFeedbackIds, status)
            setFeedbacks(prev =>
                prev.map((feedback) =>
                    selectedFeedbackIds.includes(feedback.id) ? { ...feedback, status } : feedback
                )
            )
            const count = selectedFeedbackIds.length
            setSelectedFeedbackIds([])
            toast.success(
                `${count} ${t("admin.feedbacksSelected")} → ${t(`admin.${status === "pending" ? "pending" : status === "resolved" ? "resolved" : "closed"}`)}`
            )
        } catch (error) {
            console.error("Error updating feedbacks:", error)
            toast.error(t("admin.bulkUpdateFailed"))
        }
    }

    const handleBulkDelete = async () => {
        if (selectedFeedbackIds.length === 0) {
            toast.error(t("admin.selectAtLeastOne"))
            return
        }

        try {
            const idsToDelete = [...selectedFeedbackIds]
            const result = await bulkDeleteFeedbacks(idsToDelete)
            setFeedbacks(prev => prev.filter((feedback) => !idsToDelete.includes(feedback.id)))
            setSelectedFeedbackIds([])
            toast.success(
                `${result.deletedCount} ${t("admin.feedbackDeleted")}${result.errorCount > 0 ? ` (${result.errorCount} error)` : ""
                }`
            )
        } catch (error) {
            console.error("Error deleting feedbacks:", error)
            toast.error(t("admin.bulkDeleteFailed"))
        }
    }

    const toggleSelectFeedback = (id: string) => {
        setSelectedFeedbackIds(prev =>
            prev.includes(id) ? prev.filter((feedbackId) => feedbackId !== id) : [...prev, id]
        )
    }

    const toggleSelectAllFeedbacks = () => {
        setSelectedFeedbackIds(prev => {
            if (prev.length === feedbacks.length) return []
            return feedbacks.map((f) => f.id)
        })
    }

    const clearSelectedFeedbacks = () => setSelectedFeedbackIds([])

    return {
        feedbacks,
        selectedFeedbackIds,
        loadFeedbacks,
        setFeedbacksData,
        handleFeedbackStatusUpdate,
        handleFeedbackDelete,
        handleBulkStatusUpdate,
        handleBulkDelete,
        toggleSelectFeedback,
        toggleSelectAllFeedbacks,
        clearSelectedFeedbacks,
    }
}
