import { list, get } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const auth = req.headers.authorization || '';
  const password = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Non autorisé' });
  }

  try {
    const inscriptions = [];
    let cursor;
    let hasMore = true;
    while (hasMore) {
      const page = await list({ prefix: 'jpo/', access: 'private', cursor, limit: 1000 });
      for (const blob of page.blobs) {
        const result = await get(blob.pathname, { access: 'private' }).catch(() => null);
        if (result?.statusCode === 200) {
          try {
            inscriptions.push(JSON.parse(await new Response(result.stream).text()));
          } catch {}
        }
      }
      hasMore = page.hasMore;
      cursor = page.cursor;
    }
    inscriptions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalPersonnes = inscriptions.reduce((sum, i) => sum + (parseInt(i.nb, 10) || 1), 0);

    res.status(200).json({
      success: true,
      count: inscriptions.length,
      totalPersonnes,
      inscriptions,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
