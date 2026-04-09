// api/chat.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { question, contextData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 에러 1: API 키가 설정되지 않은 경우
    if (!apiKey) {
      return res.status(500).json({ error: "Vercel 환경 변수에 GEMINI_API_KEY가 없습니다! 설정을 다시 확인하세요." });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
너는 '26년도 정밀도로지도 제작 사업'을 관리하는 전문 AI 관제사야.
아래 제공된 '현재 대시보드 상태 데이터(JSON)'를 바탕으로 사용자의 질문에 정확하고 간결하게 답변해 줘.

[현재 대시보드 상태 데이터]
${JSON.stringify(contextData, null, 2)}

[사용자 질문]
${question}
`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    const data = await response.json();

    // 에러 2: 구글 API가 거절한 경우 (모델명 오류, 키 오류 등)
    if (!response.ok) {
      return res.status(500).json({ error: `구글 API 에러: ${data.error?.message || JSON.stringify(data)}` });
    }

    // 정상 응답
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      // 에러 3: 응답은 왔는데 내용이 이상한 경우
      return res.status(500).json({ error: `응답 파싱 실패. 구글이 보낸 원본: ${JSON.stringify(data)}` });
    }

  } catch (error) {
    // 에러 4: 서버 자체 크래시
    return res.status(500).json({ error: `서버 크래시 발생: ${error.message}` });
  }
}