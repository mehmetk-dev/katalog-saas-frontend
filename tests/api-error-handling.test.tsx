import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch } from '@/lib/api'

// Mock fetch
global.fetch = vi.fn()

describe('API Error Handling Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Network Errors', () => {
        it('Network hatası durumunda retry yapar', async () => {
            let callCount = 0
            ;(global.fetch as any).mockImplementation(() => {
                callCount++
                if (callCount < 3) {
                    return Promise.reject(new Error('Network error'))
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ data: 'success' }),
                })
            })

            const result = await apiFetch('/test')

            expect(callCount).toBe(3) // 3 deneme yapmalı
            expect(result).toEqual({ data: 'success' })
        })

        it('Max retry sonrası hata fırlatır', async () => {
            ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

            await expect(apiFetch('/test')).rejects.toThrow()
        })
    })

    describe('HTTP Status Codes', () => {
        it('401 Unauthorized hatası doğru işlenir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ error: 'Unauthorized' }),
            })

            await expect(apiFetch('/test')).rejects.toThrow(/unauthorized|401/i)
        })

        it('403 Forbidden hatası doğru işlenir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: async () => ({ error: 'Forbidden' }),
            })

            await expect(apiFetch('/test')).rejects.toThrow(/forbidden|403/i)
        })

        it('404 Not Found hatası doğru işlenir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ error: 'Not Found' }),
            })

            await expect(apiFetch('/test')).rejects.toThrow(/not found|404/i)
        })

        it('500 Internal Server Error hatası doğru işlenir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ error: 'Internal Server Error' }),
            })

            await expect(apiFetch('/test')).rejects.toThrow(/server error|500/i)
        })

        it('429 Rate Limit hatası doğru işlenir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: async () => ({ error: 'Too Many Requests' }),
            })

            await expect(apiFetch('/test')).rejects.toThrow(/rate limit|429|too many/i)
        })
    })

    describe('Timeout Handling', () => {
        it('Timeout durumunda hata fırlatır', async () => {
            ;(global.fetch as any).mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 10000))
            )

            await expect(apiFetch('/test', { timeout: 1000 })).rejects.toThrow(/timeout/i)
        })

        it('Timeout süresi içinde yanıt gelirse başarılı olur', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: 'success' }),
            })

            const result = await apiFetch('/test', { timeout: 5000 })

            expect(result).toEqual({ data: 'success' })
        })
    })

    describe('Response Parsing', () => {
        it('JSON response doğru parse edilir', async () => {
            const mockData = { id: 1, name: 'Test' }
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            })

            const result = await apiFetch('/test')

            expect(result).toEqual(mockData)
        })

        it('Invalid JSON response hatası doğru işlenir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON')
                },
            })

            await expect(apiFetch('/test')).rejects.toThrow(/json|parse/i)
        })

        it('Empty response doğru işlenir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => null,
            })

            const result = await apiFetch('/test')

            expect(result).toBeNull()
        })
    })

    describe('Request Headers', () => {
        it('Authorization header doğru eklenir', async () => {
            const token = 'test-token'
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: 'success' }),
            })

            await apiFetch('/test', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${token}`,
                    }),
                })
            )
        })

        it('Content-Type header doğru eklenir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: 'success' }),
            })

            await apiFetch('/test', {
                method: 'POST',
                body: JSON.stringify({ test: 'data' }),
            })

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                })
            )
        })
    })

    describe('Request Methods', () => {
        it('GET request doğru gönderilir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: 'success' }),
            })

            await apiFetch('/test', { method: 'GET' })

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'GET',
                })
            )
        })

        it('POST request doğru gönderilir', async () => {
            const body = { name: 'Test' }
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: 'success' }),
            })

            await apiFetch('/test', {
                method: 'POST',
                body: JSON.stringify(body),
            })

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(body),
                })
            )
        })

        it('PUT request doğru gönderilir', async () => {
            const body = { id: 1, name: 'Updated' }
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: 'success' }),
            })

            await apiFetch('/test', {
                method: 'PUT',
                body: JSON.stringify(body),
            })

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'PUT',
                })
            )
        })

        it('DELETE request doğru gönderilir', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: 'success' }),
            })

            await apiFetch('/test', { method: 'DELETE' })

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'DELETE',
                })
            )
        })
    })

    describe('Error Messages', () => {
        it('Hata mesajları kullanıcı dostu olmalı', async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    error: 'Validation failed',
                    details: ['Field is required'],
                }),
            })

            try {
                await apiFetch('/test')
            } catch (error: any) {
                expect(error.message).toBeTruthy()
                expect(typeof error.message).toBe('string')
            }
        })

        it('Error response detayları doğru parse edilir', async () => {
            const errorDetails = {
                error: 'Validation failed',
                fields: {
                    email: 'Invalid email format',
                    password: 'Password too short',
                },
            }

            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => errorDetails,
            })

            try {
                await apiFetch('/test')
            } catch (error: any) {
                expect(error.details).toBeDefined()
                expect(error.details.fields).toBeDefined()
            }
        })
    })
})
