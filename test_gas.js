const url = "https://script.google.com/macros/s/AKfycbx6LvbePq3wQYViBwJS2DS_24NVlgt4zekLykwj2a_h7lkaG0VOGRwM9cmEGVxi1H8NYw/exec";
const mockToken = Buffer.from(JSON.stringify({ refId: "ADMIN_01", role: "ADMIN", name: "Nguyen Admin", exp: Date.now() + 86400000 })).toString("base64");

async function test() {
  const payload = {
    action: "parseLatexSection",
    token: mockToken,
    latex: "Cau 1: test",
    questionType: "MCQ",
    expectedCount: 1
  };
  
  console.log("Sending payload:", payload);
  
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status, res.statusText);
    
    const text = await res.text();
    console.log("Response text:", text);
    
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON:", json);
    } catch (e) {
      console.log("Not JSON.");
    }
  } catch (e) {
    console.log("Fetch error:", e);
  }
}

test();
