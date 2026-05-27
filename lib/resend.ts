import { Resend } from "resend";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendCommentNotification({
  offerName,
  authorName,
  authorEmail,
  text,
  offerId,
}: {
  offerName: string;
  authorName: string;
  authorEmail: string;
  text: string;
  offerId: string;
}): Promise<void> {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const from = process.env.RESEND_FROM ?? "nabidky@farline.cz";
  const to = process.env.NOTIFY_TO ?? "filip@farline.cz";

  const adminLink = `${appUrl}/nabidky/${offerId}`;

  const safeOfferName = escapeHtml(offerName);
  const safeAuthorName = escapeHtml(authorName);
  const safeAuthorEmail = escapeHtml(authorEmail);
  const safeText = escapeHtml(text).replace(/\n/g, "<br>");

  const html = `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#18181b;max-width:600px;margin:0 auto;padding:24px">
  <p style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#a1a1aa">Farline Living · Nabídky</p>
  <h2 style="margin-top:8px">Nový komentář k nabídce</h2>
  <p style="color:#52525b">Nabídka: <strong>${safeOfferName}</strong></p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr>
      <td style="padding:8px 12px;background:#f4f4f5;font-size:12px;color:#71717a;width:120px">Jméno</td>
      <td style="padding:8px 12px;background:#fafafa;font-size:14px">${safeAuthorName}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#f4f4f5;font-size:12px;color:#71717a">E-mail</td>
      <td style="padding:8px 12px;background:#fafafa;font-size:14px">${safeAuthorEmail}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#f4f4f5;font-size:12px;color:#71717a;vertical-align:top">Zpráva</td>
      <td style="padding:8px 12px;background:#fafafa;font-size:14px;line-height:1.6">${safeText}</td>
    </tr>
  </table>
  <a href="${adminLink}"
     style="display:inline-block;background:#8B7355;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">
    Otevřít nabídku v admin
  </a>
  <p style="margin-top:32px;font-size:11px;color:#a1a1aa">Farline Nabídky &mdash; coMakers.cz</p>
</body>
</html>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to,
    subject: `Nový komentář: ${offerName}`,
    html,
  });
}
