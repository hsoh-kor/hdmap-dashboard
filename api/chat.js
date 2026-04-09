// Vercel Serverless Function (Node.js 환경)
export default async function handler(req, res) {
  // CORS 설정 (프론트엔드에서 접근할 수 있도록 허용)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // 1. 프론트엔드에서 보낸 데이터 받기 (질문과 현재 대시보드 상태)
    const { question, contextData } = req.body;
    
    // Vercel 환경변수에서 Gemini API 키 가져오기
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
    }

    // 2. Gemini API 호출 URL 구성 (gemini-1.5-flash 모델 사용 권장)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    // 3. Gemini에게 전달할 프롬프트 구성 (역할 부여 + 문맥 데이터 + 사용자 질문)
    const promptText = `
너는 '26년도 정밀도로지도 제작 사업'을 관리하는 전문 AI 관제사야.
아래 제공된 '현재 대시보드 상태 데이터(JSON)'를 바탕으로 사용자의 질문에 정확하고 간결하게 답변해 줘.
존댓말을 사용하고, 데이터에 없는 내용은 추측해서 말하지 마.
보고서 작성 시 데이터는 현재 화면에 필터링된 기준이야.

[현재 대시보드 상태 데이터]
${JSON.stringify(contextData, null, 2)}

[사용자 질문]
${question}
`;

    // 4. Gemini API 서버로 요청 보내기
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      })
    });

    const data = await response.json();

    // 5. Gemini의 응답 추출 및 프론트엔드로 전달
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      res.status(200).json({ reply: aiResponse });
    } else {
      console.error("Gemini API Error:", data);
      res.status(500).json({ error: "AI 응답을 파싱하는 데 실패했습니다." });
    }

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
}