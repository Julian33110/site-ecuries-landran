function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CRENEAU_LABEL = {
  'matin': 'Plutôt le matin',
  'apres-midi': "Plutôt l'après-midi",
};

const NIVEAU_LABEL = {
  'jamais': 'Jamais monté à cheval',
  'occasionnel': 'Cavalier occasionnel',
  'bases': 'Déjà quelques bases',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const d = req.body;

  // Anti-spam : champ piège rempli → bot. On répond succès pour ne pas l'alerter, sans envoyer de mail.
  if (d.jpo_site) {
    return res.status(200).json({ success: true });
  }

  // Anti-spam : soumission trop rapide après chargement du formulaire → bot.
  const loadedAt = Number(d.jpo_ts);
  if (!loadedAt || Date.now() - loadedAt < 3000) {
    return res.status(200).json({ success: true });
  }

  if (!d.jpo_prenom || !d.jpo_nom || !d.jpo_tel || !d.jpo_email) {
    return res.status(400).json({ success: false, error: 'Champs requis manquants' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.jpo_email)) {
    return res.status(400).json({ success: false, error: 'Email invalide' });
  }

  const row = (label, value, raw = false) => value ? `
    <tr>
      <td style="padding:8px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#B48A2B;white-space:nowrap;">${label}</td>
      <td style="padding:8px 12px;font-size:13px;color:#431F38;font-weight:500;">${raw ? value : esc(value)}</td>
    </tr>` : '';

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
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B48A2B;">Réservation JPO — Cours d'essai gratuit</p>
        <h1 style="margin:0;font-size:22px;color:#fff;font-weight:600;">${esc(d.jpo_prenom)} ${esc(d.jpo_nom)}</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.6);">Dimanche 20 septembre 2026</p>
      </div>
      <div style="padding:32px;">
        <table style="width:100%;background:#f9f6f3;border-radius:10px;border-collapse:collapse;">
          ${row('Téléphone', d.jpo_tel)}
          ${row('Email', d.jpo_email)}
          ${row('Moment préféré', CRENEAU_LABEL[d.jpo_creneau] || 'Pas de préférence')}
          ${row('Niveau', NIVEAU_LABEL[d.jpo_niveau] || 'Non précisé')}
          ${row('Nb personnes', d.jpo_nb)}
          ${row('Message', d.jpo_message)}
        </table>
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
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B48A2B;">Journée Portes Ouvertes</p>
        <h1 style="margin:0;font-size:22px;color:#fff;font-weight:600;">À bientôt, ${esc(d.jpo_prenom)} !</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#431F38;line-height:1.7;">Votre demande de cours d'essai gratuit pour la Journée Portes Ouvertes du <strong>dimanche 20 septembre</strong> a bien été reçue. Le système de réservation de créneaux horaires sera mis en place prochainement — nous vous recontactons par téléphone ou e-mail avant le jour J pour vous proposer un horaire précis.</p>
        <div style="background:#f9f6f3;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#B48A2B;">Récapitulatif</p>
          <p style="margin:0;font-size:13px;color:#431F38;"><strong>Rendez-vous :</strong> 2025 Route du Landran, 40380 Gamarde-les-Bains</p>
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
      reply_to: d.jpo_email,
      subject: `JPO — Cours d'essai — ${d.jpo_prenom} ${d.jpo_nom}`,
      html,
    });
    if (!r.ok) { const err = await r.json(); return res.status(500).json({ success: false, error: err }); }

    try {
      const cr = await send({ to: [d.jpo_email], subject: `Votre cours d'essai — Journée Portes Ouvertes du 20 septembre`, html: confirmHtml });
      if (!cr.ok) console.error('Échec email confirmation JPO:', await cr.text());
    } catch (e) {
      console.error('Erreur réseau email confirmation JPO:', e.message);
    }

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
