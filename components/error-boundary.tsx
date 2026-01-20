'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n-provider'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console (in production, send to error tracking service)
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        this.setState({ errorInfo })

        // Error logged
        // if (process.env.NODE_ENV === 'production') {
        //     Sentry.captureException(error, { extra: errorInfo })
        // }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    handleReload = () => {
        window.location.reload()
    }

    handleGoHome = () => {
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback
            }

            return <ErrorContent error={this.state.error} onReload={this.handleReload} onGoHome={this.handleGoHome} />
        }

        return this.props.children
    }
}

function ErrorContent({ error, onReload, onGoHome }: { error: Error | null, onReload: () => void, onGoHome: () => void }) {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl">{t("common.errorTitle") || "Something went wrong"}</CardTitle>
                    <CardDescription className="text-base">
                        {t("common.errorDesc") || "We apologize for the inconvenience. Please try reloading the page."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === 'development' && error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-mono text-red-800 break-all">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={onReload}
                            className="w-full"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t("common.reload") || "Reload Page"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onGoHome}
                            className="w-full"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            {t("common.goHome") || "Go Home"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundaryWrapper(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        )
    }
}

