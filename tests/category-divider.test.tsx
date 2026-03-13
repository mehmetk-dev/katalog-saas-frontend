import { render } from '@testing-library/react'
import { CategoryDivider } from '@/components/catalogs/category-divider'

describe('CategoryDivider Component', () => {
  it('should render category name', () => {
    const { container } = render(
      <CategoryDivider
        categoryName="Electronics"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(container.textContent).toMatch(/electronics/i)
  })

  it('should render category name in uppercase-safe way', () => {
    const { container } = render(
      <CategoryDivider
        categoryName="smartphones"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(container.textContent).toMatch(/smartphones/i)
  })

  it('should render with correct A4 wrapper dimensions', () => {
    const { container } = render(
      <CategoryDivider
        categoryName="Test Category"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    const dividerElement = container.firstChild as HTMLElement
    expect(dividerElement).toHaveStyle({
      width: '794px',
      height: '1123px',
    })
  })

  it('should render safely when first product image is provided', () => {
    const { container } = render(
      <CategoryDivider
        categoryName="Test Category"
        firstProductImage="https://example.com/product.jpg"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(container.textContent).toMatch(/test category/i)
  })

  it('should render without product image', () => {
    const { container } = render(
      <CategoryDivider
        categoryName="Test Category"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('should render decorative separator line', () => {
    const { container } = render(
      <CategoryDivider
        categoryName="Test Category"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    const decorativeLines = container.querySelectorAll('.w-24.h-1')
    expect(decorativeLines.length).toBeGreaterThanOrEqual(1)
  })

  it('should render gradient accent line class', () => {
    const { container } = render(
      <CategoryDivider
        categoryName="Test Category"
        primaryColor="rgba(0, 255, 0, 1)"
      />,
    )

    const decorativeLine = container.querySelector('.w-24.h-1')
    expect(decorativeLine).toBeInTheDocument()
    expect(decorativeLine?.className).toContain('bg-gradient-to-r')
  })

  it('should have light modern background fallback', () => {
    const { container } = render(
      <CategoryDivider
        categoryName="Test Category"
        primaryColor="rgba(124, 58, 237, 1)"
      />,
    )

    const contentRoot = container.querySelector('.bg-slate-50')
    expect(contentRoot).toBeInTheDocument()
  })
})
