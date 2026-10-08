import { render, screen } from '@testing-library/react'
import { CoverPage } from '@/components/catalogs/cover-page'

describe('CoverPage Component', () => {
  it('should render catalog name', () => {
    render(
      <CoverPage
        catalogName="Test Catalog"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(screen.getByText('Test Catalog')).toBeInTheDocument()
  })

  it('should render cover description when provided', () => {
    render(
      <CoverPage
        catalogName="Test Catalog"
        coverDescription="This is a test description"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(screen.getByText(/This is a test description/i)).toBeInTheDocument()
  })

  it('should not render description when not provided', () => {
    render(
      <CoverPage
        catalogName="Test Catalog"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(screen.queryByText(/This is a test description/i)).not.toBeInTheDocument()
  })

  it('should render modern cover container', () => {
    const { container } = render(
      <CoverPage
        catalogName="Test Catalog"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(container.querySelector('.relative.w-full.h-full.bg-slate-50')).toBeInTheDocument()
  })

  it('should render safely when logoUrl is provided', () => {
    render(
      <CoverPage
        catalogName="Test Catalog"
        logoUrl="https://example.com/logo.png"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(screen.getByText('Test Catalog')).toBeInTheDocument()
  })

  it('should render a decorative placeholder (no "no image" text) when cover image is missing', () => {
    const { container } = render(
      <CoverPage
        catalogName="Test Catalog"
        primaryColor="rgba(255, 0, 0, 1)"
      />,
    )

    // Yayınlanan katalogda / PDF'te "görsel seçilmedi" yazısı basılmamalı
    expect(screen.queryByText('coverTexts.noImageSelected')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"][style*="linear-gradient"]')).toBeInTheDocument()
  })

  it('should render cover content counter label', () => {
    render(
      <CoverPage
        catalogName="Test Catalog"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(screen.getByText('coverTexts.catalogContent')).toBeInTheDocument()
  })
})
