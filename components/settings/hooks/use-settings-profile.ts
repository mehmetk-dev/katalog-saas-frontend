"use client"

import type { ChangeEvent, FormEvent, MutableRefObject } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import type { User } from "@/lib/contexts/user-context"
import { updateProfile, deleteAccount } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/client"
import { storage } from "@/lib/storage"

type TFunction = (key: string, params?: Record<string, unknown>) => string

interface UseSettingsProfileParams {
  user: User | null
  setUser: (user: User | null) => void
  refreshUser: () => Promise<void>
  t: TFunction
}

interface UploadParams {
  file: File
  bucketPath: string
  fileName: string
  setUploading: (value: boolean) => void
  controllerRef: MutableRefObject<AbortController | null>
  label: string
}

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024
const UPLOAD_MAX_RETRIES = 3
const UPLOAD_TIMEOUT_MS = 30000

function getFileExtension(file: File): string {
  return file.name.split(".").pop() || "jpg"
}

async function waitWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Upload cancelled"))
      return
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timeoutId)
      signal?.removeEventListener("abort", onAbort)
      reject(new Error("Upload cancelled"))
    }

    signal?.addEventListener("abort", onAbort)
  })
}

export function useSettingsProfile({ user, setUser, refreshUser, t }: UseSettingsProfileParams) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null)
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)

  const avatarAbortController = useRef<AbortController | null>(null)
  const logoAbortController = useRef<AbortController | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const clearPreviewAvatar = useCallback(() => {
    setPreviewAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setPendingAvatarFile(null)
  }, [])

  const clearPreviewLogo = useCallback(() => {
    setPreviewLogoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setPendingLogoFile(null)
  }, [])

  const abortActiveUploads = useCallback(() => {
    avatarAbortController.current?.abort()
    logoAbortController.current?.abort()
  }, [])

  useEffect(() => {
    return () => {
      setPreviewAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setPreviewLogoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })

      abortActiveUploads()
    }
  }, [abortActiveUploads])

  const ensureSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.error("[Settings] Session refresh failed:", refreshError)
        }
      }
    } catch (error) {
      console.error("[Settings] Session check failed:", error)
    }
  }, [supabase.auth])

  useEffect(() => {
    void ensureSession()
  }, [ensureSession])

  const validateSelectedImageFile = useCallback(
    (file: File): boolean => {
      if (!file.type.startsWith("image/")) {
        toast.error(t("toasts.invalidImageFile"))
        return false
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(t("toasts.imageSizeLimit", { size: 2 }))
        return false
      }

      return true
    },
    [t],
  )

  const uploadFileWithRetry = useCallback(async (file: File, bucketPath: string, customFileName: string, signal?: AbortSignal): Promise<string> => {
    for (let attempt = 0; attempt < UPLOAD_MAX_RETRIES; attempt++) {
      if (signal?.aborted) {
        throw new Error("Upload cancelled")
      }

      let timeoutId: ReturnType<typeof setTimeout> | null = null
      let retryToastId: string | number | null = null

      try {
        if (attempt > 0) {
          const waitTime = 1000 * 2 ** (attempt - 1)
          retryToastId = toast.loading(`Upload retry ${attempt + 1}/${UPLOAD_MAX_RETRIES}...`)
          await waitWithAbort(waitTime, signal)
        }

        if (signal?.aborted) {
          throw new Error("Upload cancelled")
        }

        const uploadPromise = storage.upload(file, {
          path: bucketPath,
          contentType: file.type || "image/jpeg",
          cacheControl: "3600",
          fileName: customFileName,
          signal,
        })

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("UPLOAD_TIMEOUT"))
          }, UPLOAD_TIMEOUT_MS)
        })

        const result = (await Promise.race([uploadPromise, timeoutPromise])) as { url: string }

        if (timeoutId) clearTimeout(timeoutId)
        if (retryToastId) toast.dismiss(retryToastId)

        if (!result?.url) {
          throw new Error("Upload successful but URL is missing")
        }

        return result.url
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId)
        if (retryToastId) toast.dismiss(retryToastId)

        if (error instanceof Error && (error.message === "Upload cancelled" || signal?.aborted)) {
          throw error
        }

        if (attempt === UPLOAD_MAX_RETRIES - 1) {
          throw error
        }
      }
    }

    throw new Error("Unexpected retry loop exit")
  }, [])

  const uploadPendingAsset = useCallback(
    async ({ file, bucketPath, fileName, setUploading, controllerRef, label }: UploadParams): Promise<string | null> => {
      setUploading(true)

      controllerRef.current?.abort()
      const abortController = new AbortController()
      controllerRef.current = abortController

      try {
        return await uploadFileWithRetry(file, bucketPath, fileName, abortController.signal)
      } catch (error) {
        if (error instanceof Error && (error.message === "Upload cancelled" || abortController.signal.aborted)) {
          return null
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        toast.error(`${label} upload failed: ${errorMessage}`)
        throw error
      } finally {
        controllerRef.current = null
        setUploading(false)
      }
    },
    [uploadFileWithRetry],
  )

  const handleAvatarUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !validateSelectedImageFile(file)) {
        return
      }

      setPreviewAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      setPendingAvatarFile(file)
    },
    [validateSelectedImageFile],
  )

  const handleLogoUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !validateSelectedImageFile(file)) {
        return
      }

      setPreviewLogoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      setPendingLogoFile(file)
    },
    [validateSelectedImageFile],
  )

  const handleSaveProfile = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!user) {
        return
      }

      const formData = new FormData(event.currentTarget)
      setIsSaving(true)

      try {
        let avatarUrlToSave = user.avatar_url
        let logoUrlToSave = user.logo_url

        if (pendingAvatarFile) {
          const fileName = `${user.id}-${Date.now()}.${getFileExtension(pendingAvatarFile)}`
          const publicUrl = await uploadPendingAsset({
            file: pendingAvatarFile,
            bucketPath: "avatars",
            fileName,
            setUploading: setIsUploadingAvatar,
            controllerRef: avatarAbortController,
            label: "Avatar",
          })

          if (publicUrl === null) {
            return
          }

          avatarUrlToSave = publicUrl
        }

        if (pendingLogoFile) {
          const fileName = `logo-${user.id}-${Date.now()}.${getFileExtension(pendingLogoFile)}`
          const publicUrl = await uploadPendingAsset({
            file: pendingLogoFile,
            bucketPath: "company-logos",
            fileName,
            setUploading: setIsUploadingLogo,
            controllerRef: logoAbortController,
            label: "Logo",
          })

          if (publicUrl === null) {
            return
          }

          logoUrlToSave = publicUrl
        }

        await updateProfile(formData, avatarUrlToSave, logoUrlToSave)

        setUser({
          ...user,
          name: (formData.get("fullName") as string) || user.name,
          company: (formData.get("company") as string) || user.company,
          avatar_url: avatarUrlToSave || user.avatar_url,
          logo_url: logoUrlToSave || user.logo_url,
          instagram_url: (formData.get("instagramUrl") as string) || user.instagram_url,
          youtube_url: (formData.get("youtubeUrl") as string) || user.youtube_url,
          website_url: (formData.get("websiteUrl") as string) || user.website_url,
        })

        void refreshUser().catch(() => undefined)

        clearPreviewAvatar()
        clearPreviewLogo()

        toast.success(t("toasts.profileUpdated"))
      } catch (error) {
        let message = t("toasts.profileUpdateFailed")
        if (error instanceof Error) {
          message += `: ${error.message}`
        }
        toast.error(message)
      } finally {
        setIsSaving(false)
        setIsUploadingAvatar(false)
        setIsUploadingLogo(false)
      }
    },
    [
      user,
      pendingAvatarFile,
      pendingLogoFile,
      uploadPendingAsset,
      setUser,
      refreshUser,
      clearPreviewAvatar,
      clearPreviewLogo,
      t,
    ],
  )

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true)
    try {
      await deleteAccount()
      toast.success(t("toasts.accountDeleted"))
      window.location.href = "/auth"
    } catch {
      toast.error(t("toasts.accountDeleteFailed"))
      setIsDeleting(false)
    }
  }, [t])

  const displayAvatarUrl = previewAvatarUrl || user?.avatar_url
  const displayLogoUrl = previewLogoUrl || user?.logo_url

  return {
    displayAvatarUrl,
    displayLogoUrl,
    ensureSession,
    handleAvatarUpload,
    handleDeleteAccount,
    handleLogoUpload,
    handleSaveProfile,
    isDeleting,
    isSaving,
    isUploadingAvatar,
    isUploadingLogo,
    user,
  }
}
