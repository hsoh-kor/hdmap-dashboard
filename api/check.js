// api/check.js
export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: "API 키가 Vercel에 설정되지 않았습니다." });
  }

  try {
    // 구글 서버에 '사용 가능한 모델 목록'을 요청
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    // 화면에 결과 출력
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}