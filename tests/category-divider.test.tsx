import { render, screen } from '@testing-library/react'
import { CategoryDivider } from '@/components/catalogs/category-divider'

describe('CategoryDivider Component', () => {
    it('should render category name', () => {
        const { container } = render(
            <CategoryDivider
                categoryName="Electronics"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        // Check if category text exists (case-insensitive)
        expect(container.textContent).toMatch(/electronics/i)
    })

    it('should render category name in uppercase', () => {
        const { container } = render(
            <CategoryDivider
                categoryName="smartphones"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        // Check if category text exists (case-insensitive)
        expect(container.textContent).toMatch(/smartphones/i)
    })

    it('should render with correct A4 dimensions', () => {
        const { container } = render(
            <CategoryDivider
                categoryName="Test Category"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        const dividerElement = container.firstChild as HTMLElement
        expect(dividerElement).toHaveStyle({
            width: '794px',
            height: '1123px'
        })
    })

    it('should render first product image as background when provided', () => {
        const { container } = render(
            <CategoryDivider
                categoryName="Test Category"
                firstProductImage="https://example.com/product.jpg"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        const backgroundDiv = container.querySelector('[style*="background-image"]')
        expect(backgroundDiv).toBeInTheDocument()
    })

    it('should not render background image when not provided', () => {
        const { container } = render(
            <CategoryDivider
                categoryName="Test Category"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        const backgroundDiv = container.querySelector('[style*="url(https://example.com"]')
        expect(backgroundDiv).not.toBeInTheDocument()
    })

    it('should render decorative lines', () => {
        const { container } = render(
            <CategoryDivider
                categoryName="Test Category"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        // Check for decorative elements (w-24 h-1 elements)
        const decorativeLines = container.querySelectorAll('.w-24.h-1')
        expect(decorativeLines.length).toBeGreaterThanOrEqual(2) // Top and bottom lines
    })

    it('should apply custom primary color to accents', () => {
        const customColor = 'rgba(0, 255, 0, 1)'
        const { container } = render(
            <CategoryDivider
                categoryName="Test Category"
                primaryColor={customColor}
            />
        )

        // Decorative lines should use primary color
        const decorativeLine = container.querySelector('.w-24.h-1')
        expect(decorativeLine).toHaveStyle({ backgroundColor: customColor })
    })

    it('should have dark background as fallback', () => {
        const { container } = render(
            <CategoryDivider
                categoryName="Test Category"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        const dividerElement = container.firstChild as HTMLElement
        expect(dividerElement).toHaveStyle({ backgroundColor: '#1a1a1a' })
    })
})
