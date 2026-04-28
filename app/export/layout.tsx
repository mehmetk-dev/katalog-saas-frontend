import type { ReactNode } from "react"

export const metadata = {
  title: "PDF Export",
  robots: { index: false, follow: false },
}

export default function ExportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pdf-export-root">
      {children}
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }
        .pdf-export-root {
          background: #ffffff;
        }
      `}</style>
    </div>
  )
}
