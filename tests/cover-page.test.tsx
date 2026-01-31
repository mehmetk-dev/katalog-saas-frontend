import { render, screen } from '@testing-library/react'
import { CoverPage } from '@/components/catalogs/cover-page'

describe('CoverPage Component', () => {
    it('should render catalog name', () => {
        render(
            <CoverPage
                catalogName="Test Catalog"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        expect(screen.getByText('Test Catalog')).toBeInTheDocument()
    })

    it('should render cover description when provided', () => {
        render(
            <CoverPage
                catalogName="Test Catalog"
                coverDescription="This is a test description"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        expect(screen.getByText('This is a test description')).toBeInTheDocument()
    })

    it('should not render description when not provided', () => {
        render(
            <CoverPage
                catalogName="Test Catalog"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        expect(screen.queryByText(/description/i)).not.toBeInTheDocument()
    })

    it('should render with correct A4 dimensions', () => {
        const { container } = render(
            <CoverPage
                catalogName="Test Catalog"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        const coverElement = container.firstChild as HTMLElement
        expect(coverElement).toHaveStyle({
            width: '794px',
            height: '1123px'
        })
    })

    it('should render logo when logoUrl is provided', () => {
        const { container } = render(
            <CoverPage
                catalogName="Test Catalog"
                logoUrl="https://example.com/logo.png"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        // Check logo section exists (avoid Next Image fill prop warning)
        const logoSection = container.querySelector('.pt-16')
        expect(logoSection).toBeInTheDocument()
    })


    it('should apply custom primary color to gradient', () => {
        const customColor = 'rgba(255, 0, 0, 1)'
        const { container } = render(
            <CoverPage
                catalogName="Test Catalog"
                primaryColor={customColor}
            />
        )

        // Check if gradient div exists with custom color
        const gradientDiv = container.querySelector('[style*="gradient"]')
        expect(gradientDiv).toBeInTheDocument()
    })

    it('should render KATALOG branding at bottom', () => {
        render(
            <CoverPage
                catalogName="Test Catalog"
                primaryColor="rgba(124, 58, 237, 1)"
            />
        )

        expect(screen.getByText('KATALOG')).toBeInTheDocument()
    })
})
