export interface FeedbackEmailInput {
  userName: string
  userEmail: string
  subject: string
  message: string
  pageUrl?: string
  attachments?: string[]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function toAttachmentLinks(attachments?: string[]): string {
  if (!attachments?.length) return ""

  const links = attachments
    .filter(isSafeUrl)
    .map((url) => {
      const safeUrl = escapeHtml(url)
      const fileName = safeUrl.split("/").pop() || "dosya"
      const displayName = fileName.length > 40 ? `${fileName.slice(0, 40)}...` : fileName
      return `<a href="${safeUrl}" class="attachment-badge" target="_blank" rel="noopener noreferrer">[dosya] ${displayName}</a>`
    })
    .join("")

  if (!links) return ""

  return `
    <div style="margin-top: 32px;">
      <span class="message-box-title">Ekli Dosyalar</span>
      <div style="display: flex; flex-wrap: wrap;">
        ${links}
      </div>
    </div>
  `
}

export function buildFeedbackEmailHtml(input: FeedbackEmailInput): string {
  const safeUserName = escapeHtml(input.userName)
  const safeUserEmail = escapeHtml(input.userEmail)
  const safeSubject = escapeHtml(input.subject)
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br>")
  const safePageUrl = input.pageUrl ? escapeHtml(input.pageUrl) : ""
  const attachmentLinks = toAttachmentLinks(input.attachments)

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sistem Bildirimi</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding: 48px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; }
        .header { padding: 40px 48px 32px 48px; border-bottom: 1px solid #f3f4f6; }
        .brand-logo { font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #6366f1; margin-bottom: 12px; display: block; }
        .header h1 { font-size: 24px; font-weight: 700; margin: 0; color: #111827; letter-spacing: -0.02em; }
        .content { padding: 32px 48px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        .data-row { border-bottom: 1px solid #f3f4f6; }
        .data-label { padding: 16px 0; color: #6b7280; font-size: 13px; font-weight: 500; width: 140px; vertical-align: top; }
        .data-value { padding: 16px 0; color: #111827; font-size: 14px; font-weight: 500; vertical-align: top; }
        .data-value a { color: #6366f1; text-decoration: none; }
        .message-box { background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-top: 8px; }
        .message-box-title { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; display: block; }
        .message-body { font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
        .attachment-badge { display: inline-flex; align-items: center; padding: 8px 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 8px; margin-right: 8px; text-decoration: none; color: #475569; font-size: 13px; }
        .footer { padding: 32px 48px; background-color: #fafafa; border-top: 1px solid #f3f4f6; text-align: center; }
        .footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; }
        @media only screen and (max-width: 600px) {
          .container { border-radius: 0; border: none; }
          .header, .content, .footer { padding: 32px 24px; }
          .data-label { width: 100px; font-size: 12px; }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <span class="brand-logo">FOGKatalog - Dashboard</span>
            <h1>Yeni Geri Bildirim</h1>
          </div>

          <div class="content">
            <table class="data-table">
              <tr class="data-row">
                <td class="data-label">Kullanıcı</td>
                <td class="data-value">${safeUserName}</td>
              </tr>
              <tr class="data-row">
                <td class="data-label">E-posta</td>
                <td class="data-value"><a href="mailto:${safeUserEmail}">${safeUserEmail}</a></td>
              </tr>
              <tr class="data-row">
                <td class="data-label">Konu Başlığı</td>
                <td class="data-value">${safeSubject}</td>
              </tr>
              ${
                safePageUrl
                  ? `
              <tr class="data-row">
                <td class="data-label">Kaynak Sayfa</td>
                <td class="data-value"><a href="${safePageUrl}">${safePageUrl}</a></td>
              </tr>`
                  : ""
              }
            </table>

            <div class="message-box">
              <span class="message-box-title">Kullanıcı Notu</span>
              <div class="message-body">${safeMessage}</div>
            </div>

            ${attachmentLinks}
          </div>

          <div class="footer">
            <p>Bu e-posta FOG İstanbul sunucuları tarafından otomatik olarak oluşturuldu.</p>
            <p>&copy; 2026 Tüm Hakları Saklıdır.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
