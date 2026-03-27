export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { tasks } = req.body;
  if (!tasks) return res.status(400).json({ error: 'tasks is required' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on server' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: `あなたはOOUI設計の専門家です。タスクリストを分析し以下のJSONのみ返してください（説明不要）:
{"objects":[{"name":"名前","properties":["p1","p2"],"actions":["a1","a2"],"reason":"理由"}],"notes":"注意点"}
ルール:確認/表示/見るはアクション不可。状態変化するもののみ(作成/削除/承認等)。オブジェクト3-6個。プロパティ2-5個。JSON以外出力禁止。`,
        messages: [{ role: 'user', content: `以下を分析:\n${tasks}` }],
      }),
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const text = data.content?.find(c => c.type === 'text')?.text || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
