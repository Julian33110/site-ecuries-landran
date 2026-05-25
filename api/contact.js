export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prenom, nom, email, sujet, message } = req.body;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 20px;">

    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#431F38;border-radius:12px;padding:14px 28px;">
        <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B48A2B;font-weight:700;">Les Écuries du Landran</p>
      </div>
    </div>

    <div style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(67,31,56,.08);">
      <div style="background:#431F38;padding:28px 32px;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B48A2B;">Nouveau message</p>
        <h1 style="margin:0;font-size:22px;color:#fff;font-weight:600;">${sujet || 'Contact site web'}</h1>
      </div>

      <div style="padding:32px;">
        <table style="width:100%;margin-bottom:24px;">
          <tr>
            <td style="width:50%;padding:12px;background:#f9f6f3;border-radius:10px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#B48A2B;">De</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:#431F38;">${prenom} ${nom}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#7a6070;"><a href="mailto:${email}" style="color:#431F38;">${email}</a></p>
            </td>
          </tr>
        </table>

        <div style="background:#f9f6f3;border-left:3px solid #B48A2B;border-radius:0 10px 10px 0;padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#B48A2B;">Message</p>
          <p style="margin:0;font-size:14px;color:#431F38;line-height:1.7;white-space:pre-line;">${message}</p>
        </div>

        <div style="margin-top:24px;text-align:center;">
          <a href="mailto:${email}" style="display:inline-block;background:#431F38;color:#fff;padding:12px 28px;border-radius:50px;font-size:11px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;font-weight:600;">Répondre à ${prenom}</a>
        </div>
      </div>
    </div>

    <p style="text-align:center;margin-top:20px;font-size:10px;color:#a89099;letter-spacing:1px;">LES ÉCURIES DU LANDRAN · Gamarde-les-Bains</p>
  </div>
</body>
</html>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Écuries du Landran <onboarding@resend.dev>',
        to: ['ecuries-landran@orange.fr'],
        reply_to: email,
        subject: `✉️ ${prenom} ${nom} — ${sujet || 'Contact site web'}`,
        html,
      }),
    });

    if (r.ok) res.status(200).json({ success: true });
    else { const err = await r.json(); res.status(500).json({ success: false, error: err }); }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
