const latex = `
\\item Nghiệm của phương trình $2x - 4 = 0$ là:
    \\begin{multicols}{4}
        \\begin{enumerate}[label=\\Alph*.]
            \\item $x = 2$.
            \\item $x = -2$.
            \\item $x = 0$.
            \\item $x = 4$.
        \\end{enumerate}
    \\end{multicols}

    \\item Thủ đô của nước Cộng hòa Xã hội chủ nghĩa Việt Nam là:
    \\begin{multicols}{4}
        \\begin{enumerate}[label=\\Alph*.]
            \\item Đà Nẵng.
            \\item TP. Hồ Chí Minh.
            \\item Hà Nội.
            \\item Huế.
        \\end{enumerate}
    \\end{multicols}

    \\item Đạo hàm của hàm số $y = x^2 + 3x$ là:
    \\begin{multicols}{4}
        \\begin{enumerate}[label=\\Alph*.]
            \\item $y' = 2x$.
            \\item $y' = 2x + 3$.
            \\item $y' = x + 3$.
            \\item $y' = 3$.
        \\end{enumerate}
    \\end{multicols}

    \\item Công thức hóa học của nước là:
    \\begin{multicols}{4}
        \\begin{enumerate}[label=\\Alph*.]
            \\item $\\text{CO}_2$.
            \\item $\\text{O}_2$.
            \\item $\\text{NaCl}$.
            \\item $\\text{H}_2\\text{O}$.
        \\end{enumerate}
    \\end{multicols}
`;

const systemPrompt = "Bạn là một hệ thống phân tích đề thi. Trích xuất LaTeX thành MẢNG JSON hợp lệ chứa đúng 4 phần tử với schema: [{questionContent: string, optionA: string, optionB: string, optionC: string, optionD: string, correctAnswer: string, solution: string}]. TRẢ VỀ ĐÚNG MẢNG JSON, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO KHÁC. Giữ nguyên định dạng LaTeX của công thức toán học.";
const apiKey = "YOUR_GEMINI_API_KEY_HERE";
const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: "Phân tích đoạn LaTeX sau:\n\n" + latex }] }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
  })
}).then(r => r.json()).then(data => {
  if(data.candidates) console.log(JSON.stringify(JSON.parse(data.candidates[0].content.parts[0].text), null, 2));
  else console.log(data);
}).catch(console.error);
