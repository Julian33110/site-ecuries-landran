export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const d = req.body;

  const row = (label, value) => value ? `
    <tr>
      <td style="padding:8px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#B48A2B;white-space:nowrap;">${label}</td>
      <td style="padding:8px 12px;font-size:13px;color:#431F38;font-weight:500;">${value}</td>
    </tr>` : '';

  const section = (title, rows) => `
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B48A2B;font-weight:700;">${title}</p>
      <table style="width:100%;background:#f9f6f3;border-radius:10px;border-collapse:collapse;">${rows}</table>
    </div>`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">

    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#431F38;border-radius:12px;padding:14px 28px;">
        <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B48A2B;font-weight:700;">Les Écuries du Landran</p>
      </div>
    </div>

    <div style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(67,31,56,.08);">
      <div style="background:#431F38;padding:28px 32px;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B48A2B;">Nouvelle demande</p>
        <h1 style="margin:0;font-size:22px;color:#fff;font-weight:600;">Inscription — ${d.cav_prenom || ''} ${d.cav_nom || ''}</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.6);">${d.type_inscription === 'annee' ? 'Inscription à l\'année' : 'Stage'} · Saison 2025–2026</p>
      </div>

      <div style="padding:32px;">
        ${section('Cavalier', `
          ${row('Prénom', d.cav_prenom)}
          ${row('Nom', d.cav_nom)}
          ${row('Date de naissance', d.cav_naissance)}
          ${row('Téléphone', d.cav_tel)}
          ${row('Dernier club', d.dernier_club)}
          ${row('Dernier galop', d.dernier_galop ? 'Galop ' + d.dernier_galop : 'Débutant')}
        `)}
        ${section('Inscription', `
          ${row('Type', d.type_inscription === 'annee' ? 'À l\'année' : 'Stage')}
          ${row('Modalité', d.modalite === 'mois' ? 'Au mois' : d.modalite === 'carte' ? 'À la carte' : '')}
          ${row('Jour souhaité', d.jour_cours)}
          ${row('Heure souhaitée', d.heure_cours)}
        `)}
        ${section('Coordonnées', `
          ${row('Adresse', d.adresse)}
          ${row('Ville', d.cp ? d.cp + ' ' + d.ville : d.ville)}
          ${row('Email', d.insc_email)}
        `)}
        ${(d.rl_prenom || d.rl_nom) ? section('Représentant légal', `
          ${row('Nom', (d.rl_prenom || '') + ' ' + (d.rl_nom || ''))}
          ${row('Tél. mère', d.tel_mere)}
          ${row('Tél. père', d.tel_pere)}
        `) : ''}
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
        reply_to: d.insc_email,
        subject: `📋 Inscription — ${d.cav_prenom || ''} ${d.cav_nom || ''}`,
        html,
      }),
    });

    if (r.ok) res.status(200).json({ success: true });
    else { const err = await r.json(); res.status(500).json({ success: false, error: err }); }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
