import { describe, it, expect } from 'vitest'

import { ApiError } from '../../backend/src/middlewares/errorHandler'

describe('ApiError Class', () => {
    it('should create error with default status 500', () => {
        const error = new ApiError('Test error')
        expect(error.message).toBe('Test error')
        expect(error.status).toBe(500)
        expect(error.isOperational).toBe(true)
    })

    it('should create error with custom status', () => {
        const error = new ApiError('Not found', 404)
        expect(error.status).toBe(404)
    })

    describe('Static Factory Methods', () => {
        it('should create badRequest error', () => {
            const error = ApiError.badRequest('Invalid input')
            expect(error.status).toBe(400)
            expect(error.message).toBe('Invalid input')
        })

        it('should create unauthorized error', () => {
            const error = ApiError.unauthorized()
            expect(error.status).toBe(401)
            expect(error.message).toBe('Yetkilendirme gerekli')
        })

        it('should create forbidden error', () => {
            const error = ApiError.forbidden()
            expect(error.status).toBe(403)
        })

        it('should create notFound error', () => {
            const error = ApiError.notFound('User not found')
            expect(error.status).toBe(404)
            expect(error.message).toBe('User not found')
        })

        it('should create conflict error', () => {
            const error = ApiError.conflict()
            expect(error.status).toBe(409)
        })

        it('should create tooManyRequests error', () => {
            const error = ApiError.tooManyRequests()
            expect(error.status).toBe(429)
        })

        it('should create internal error with isOperational false', () => {
            const error = ApiError.internal('Database connection failed')
            expect(error.status).toBe(500)
            expect(error.isOperational).toBe(false)
        })
    })
})

describe('Error Messages - Turkish', () => {
    it('should have Turkish error messages', () => {
        const error = ApiError.badRequest()
        expect(error.message).toBe('Geçersiz istek')
    })
})
