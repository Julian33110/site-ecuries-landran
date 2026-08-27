function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SLOTS_LABEL = {
  'mer-1430': 'Mercredi 14h30 — Débutants (Équipe poney)',
  'sam-1200': 'Samedi 12h00 — Débutants (Équipe poney)',
  'mer-1500': 'Mercredi 15h00 — Galop 1/2 (Équipe poney)',
  'sam-1100': 'Samedi 11h00 — Galop 1/2 (Équipe poney)',
  'mer-1530': 'Mercredi 15h30 — Galop 2/3 (Clara)',
  'mer-1630': 'Mercredi 16h30 — Galop 2/3 (Équipe poney)',
  'sam-1130': 'Samedi 11h30 — Galop 2/3 (Clara)',
  'sam-1430': 'Samedi 14h30 — Galop 2/3 (Équipe poney)',
  'mer-1730': 'Mercredi 17h30 — Galop 4/5 (Équipe poney)',
  'sam-1030': 'Samedi 10h30 — Galop 4/5 (Clara)',
  'sam-1530': 'Samedi 15h30 — Galop 4/5 (Équipe poney)',
  'mer-1830': 'Mercredi 18h30 — Galop 6-7 (Clara)',
  'jeu-1830': 'Jeudi 18h30 — Galop 6-7 (Clara)',
  'ven-1830': 'Vendredi 18h30 — Galop 6-7 (Clara)',
  'sam-0930': 'Samedi 9h30 — Galop 6/7 (Clara)',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const d = req.body;

  // Anti-spam : champ piège rempli → bot. On répond succès pour ne pas l'alerter, sans envoyer de mail.
  if (d.insc_site) {
    return res.status(200).json({ success: true });
  }

  // Anti-spam : soumission trop rapide après chargement du formulaire → bot.
  const loadedAt = Number(d.insc_ts);
  if (!loadedAt || Date.now() - loadedAt < 3000) {
    return res.status(200).json({ success: true });
  }

  if (!d.cav_prenom || !d.cav_nom || !d.insc_email) {
    return res.status(400).json({ success: false, error: 'Champs requis manquants' });
  }

  const row = (label, value, raw = false) => value ? `
    <tr>
      <td style="padding:8px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#B48A2B;white-space:nowrap;">${label}</td>
      <td style="padding:8px 12px;font-size:13px;color:#431F38;font-weight:500;">${raw ? value : esc(value)}</td>
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
        <h1 style="margin:0;font-size:22px;color:#fff;font-weight:600;">Inscription — ${esc(d.cav_prenom)} ${esc(d.cav_nom)}</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.6);">${d.type_inscription === 'annee' ? 'Inscription à l\'année' : d.type_inscription === 'occasionnel' ? 'Inscription occasionnelle' : 'Stage'} · Saison 2026–2027</p>
      </div>

      <div style="padding:32px;">
        ${section('Cavalier', `
          ${row('Prénom', d.cav_prenom)}
          ${row('Nom', d.cav_nom)}
          ${row('Date de naissance', d.cav_naissance)}
          ${row('Téléphone', d.cav_tel)}
          ${row('Dernier club', d.dernier_club ? (d.dernier_club + (d.club_cp ? ' (' + d.club_cp + ')' : '')) : '')}
          ${row('Dernier galop', d.dernier_galop ? 'Galop ' + esc(d.dernier_galop) : 'Débutant')}
        `)}
        ${section('Inscription', `
          ${row('Type', d.type_inscription === 'annee' ? 'À l\'année' : d.type_inscription === 'occasionnel' ? 'Occasionnelle' : 'Stage')}
          ${row('Modalité', d.modalite === 'mois' ? 'Au mois' : d.modalite === 'carte' ? 'À la carte' : '')}
          ${row('Créneaux souhaités', d.creneau ? (Array.isArray(d.creneau) ? d.creneau.map(c => esc(SLOTS_LABEL[c] || c)).join('<br>') : esc(SLOTS_LABEL[d.creneau] || d.creneau)) : '', true)}
        `)}
        ${section('Coordonnées', `
          ${row('Adresse', d.adresse)}
          ${row('Ville', d.cp ? d.cp + ' ' + esc(d.ville) : d.ville)}
          ${row('Email', d.insc_email)}
        `)}
        <div style="margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B48A2B;font-weight:700;">Droit à l'image</p>
          <div style="padding:14px 18px;border-radius:10px;font-size:14px;font-weight:700;${d.droit_image === 'on' ? 'background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;' : 'background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;'}">
            ${d.droit_image === 'on' ? '✓ Autorisé' : '✗ Refusé'}
          </div>
        </div>
        ${(d.rl_prenom || d.rl_nom) ? section('Représentant légal', `
          ${row('Nom', (d.rl_prenom || '') + ' ' + (d.rl_nom || ''))}
          ${row('Date de naissance', d.rl_naissance)}
          ${row('Tél. mère', d.tel_mere)}
          ${row('Tél. père', d.tel_pere)}
        `) : ''}
      </div>
    </div>

    <p style="text-align:center;margin-top:20px;font-size:10px;color:#a89099;letter-spacing:1px;">LES ÉCURIES DU LANDRAN · Gamarde-les-Bains</p>
  </div>
</body>
</html>`;

  const confirmHtml = `
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
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B48A2B;">Demande reçue</p>
        <h1 style="margin:0;font-size:22px;color:#fff;font-weight:600;">Merci, ${esc(d.cav_prenom)} !</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#431F38;line-height:1.7;">Votre demande d'inscription a bien été reçue. Nous vous contacterons sous 48h pour confirmer votre place et vous transmettre les documents nécessaires.</p>
        <div style="background:#f9f6f3;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#B48A2B;">Récapitulatif</p>
          <p style="margin:0 0 4px;font-size:13px;color:#431F38;"><strong>Cavalier :</strong> ${esc(d.cav_prenom)} ${esc(d.cav_nom)}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#431F38;"><strong>Type :</strong> ${d.type_inscription === 'annee' ? 'Inscription à l\'année' : d.type_inscription === 'occasionnel' ? 'Inscription occasionnelle' : 'Stage'}</p>
          ${d.creneau ? `<p style="margin:0;font-size:13px;color:#431F38;"><strong>Créneaux souhaités :</strong> ${Array.isArray(d.creneau) ? d.creneau.map(c => esc(SLOTS_LABEL[c] || c)).join(', ') : esc(SLOTS_LABEL[d.creneau] || d.creneau)}</p>` : ''}
        </div>
        <p style="margin:0;font-size:13px;color:#7a6070;line-height:1.6;">À bientôt aux écuries,<br/><strong style="color:#431F38;">L'équipe du Landran</strong></p>
      </div>
    </div>
    <p style="text-align:center;margin-top:20px;font-size:10px;color:#a89099;letter-spacing:1px;">LES ÉCURIES DU LANDRAN · Gamarde-les-Bains</p>
  </div>
</body>
</html>`;

  const send = (payload) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Écuries du Landran <noreply@ecuries-landran.fr>', ...payload }),
  });

  try {
    const r = await send({
      to: ['ecuries-landran@orange.fr'],
      reply_to: d.insc_email,
      subject: `📋 Inscription — ${d.cav_prenom || ''} ${d.cav_nom || ''}`,
      html,
    });
    if (!r.ok) { const err = await r.json(); return res.status(500).json({ success: false, error: err }); }

    // Confirmation cavalier — best effort
    send({ to: [d.insc_email], subject: `Demande d'inscription aux Écuries du Landran`, html: confirmHtml })
      .then(async (cr) => {
        if (!cr.ok) console.error('Échec email confirmation cavalier:', await cr.text());
      })
      .catch((e) => console.error('Erreur réseau email confirmation cavalier:', e.message));

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
