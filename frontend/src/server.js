const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const supabase = require("./supabase");

const app = express();
app.use(express.json());
app.use(cors());

/* ================= AUTH ================= */
app.post("/auth", async (req, res) => {
  const { username, password, action } = req.body;

  if (action === "signup") {
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, password }])
      .select()
      .single();

    if (error) {
      console.error("Signup error:", error);
      return res.json({ success: false, message: "Signup failed" });
    }

    return res.json({
      success: true,
      message: "Signup successful!",
      userId: data.id,
    });
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (error || !data) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  res.json({
    success: true,
    message: "Login successful!",
    userId: data.id,
  });
});

/* ================= AI ROUTE ================= */
app.post("/store-option", async (req, res) => {
  const {
    userId,
    option,
    language,
    codePrompt,
    modifyCode,
    modifyLogic,
  } = req.body;

  try {
    const response = await axios.post(
      "http://localhost:8000/process-request",
      {
        taskType: option === "Generate Code" ? "generate" : "modify",
        prompt: codePrompt || modifyCode,
      }
    );

    const aiOutput = response.data.result;

    const { error: dbError } = await supabase.from("user_activity").insert([
      {
        user_id: userId,
        user_option: option,
        language,
        qn: (option === "Generate Code" ? codePrompt : null),
        modify_code_input: (option === "Modify Code" ? modifyCode : null),
        modify_code_logic: modifyLogic || null,
        output: aiOutput,
      },
    ]);

    if (dbError) {
      console.error("Database error:", dbError);
      return res.json({ success: false, message: "Storage failed" });
    }

    res.json({
      success: true,
      message: "AI output generated successfully!",
      aiOutput,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "AI processing failed" });
  }
});

/* ================= ANALYZE ROUTE ================= */
app.post("/analyze-code", async (req, res) => {
  const { userId, originalCode, modifiedCode } = req.body;

  try {
    const analysisPrompt = `You are a code efficiency analyzer. Compare the ORIGINAL and MODIFIED code below and provide a detailed efficiency analysis.

ORIGINAL CODE:
${originalCode}

MODIFIED CODE:
${modifiedCode}

IMPORTANT: You MUST include numerical scores in your analysis. Use the exact format "Label: X/10" for each metric. Include ALL of the following scored sections:

TIME COMPLEXITY:
- Time Original: [score]/10 — [analysis]
- Time Modified: [score]/10 — [analysis]
- Best/Average/Worst case analysis

SPACE COMPLEXITY:
- Space Original: [score]/10 — [analysis]
- Space Modified: [score]/10 — [analysis]

EXECUTION SPEED:
- Speed Original: [score]/10 — [assessment]  
- Speed Modified: [score]/10 — [assessment]
- Bottlenecks identified

CODE READABILITY:
- Readability Original: [score]/10 — [assessment]
- Readability Modified: [score]/10 — [assessment]

MAINTAINABILITY:
- Maintainability Original: [score]/10 — [assessment]
- Maintainability Modified: [score]/10 — [assessment]

BEST PRACTICES:
- Practices Original: [score]/10 — [compliance]
- Practices Modified: [score]/10 — [compliance]

SUMMARY: [Overall comparative summary]

OVERALL EFFICIENCY SCORE: [score]/10 — [brief justification]

Higher scores = better efficiency. Be precise with your /10 ratings.`;

    const pythonResponse = await axios.post("http://localhost:8000/process-request", {
      taskType: "analyze",
      prompt: analysisPrompt,
    });

    res.json({
      success: true,
      message: "Analysis complete!",
      analysisResult: pythonResponse.data.result,
    });
  } catch (error) {
    console.error("Error analyzing code:", error);
    res.json({ success: false, message: "Error analyzing code. Please try again later." });
  }
});

app.listen(5003, () =>
  console.log("Server running on port 5003")
);

