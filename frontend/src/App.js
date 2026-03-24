import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

/* ═══════════════════════════════════════════
   GALAXY STARFIELD — Black & White Deep Space
   Stars bulge near cursor
   ═══════════════════════════════════════════ */
function GalaxyCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const STAR_COUNT = 350;
    const stars = [];

    class Star {
      constructor() { this.init(true); }
      init(initial) {
        this.x = Math.random() * W;
        this.y = initial ? Math.random() * H : -5;
        this.baseSize = Math.random() * 2 + 0.3;
        this.size = this.baseSize;
        this.speed = Math.random() * 0.15 + 0.03;
        this.twinkleSpeed = Math.random() * 0.04 + 0.01;
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.brightness = Math.random() * 0.5 + 0.5;
        const tint = Math.random();
        if (tint < 0.7) { this.r = 255; this.g = 255; this.b = 255; }
        else if (tint < 0.85) { this.r = 200; this.g = 220; this.b = 255; }
        else { this.r = 255; this.g = 230; this.b = 200; }
      }
    }
    for (let i = 0; i < STAR_COUNT; i++) stars.push(new Star());

    const shooters = [];
    class Shooter {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W * 0.8;
        this.y = Math.random() * H * 0.3;
        this.len = Math.random() * 140 + 80;
        this.speed = Math.random() * 14 + 10;
        this.angle = Math.PI / 5 + Math.random() * 0.4;
        this.life = 1;
        this.decay = Math.random() * 0.012 + 0.006;
        this.active = false;
        this.timer = Math.random() * 400 + 150;
      }
    }
    for (let i = 0; i < 3; i++) shooters.push(new Shooter());

    const clouds = [];
    class Cloud {
      constructor(i) {
        this.angle = (Math.PI * 2 / 4) * i + Math.random();
        this.radius = Math.random() * 200 + 250;
        this.cx = W * 0.5; this.cy = H * 0.5;
        this.orbit = Math.min(W, H) * 0.25 + Math.random() * 150;
        this.speed = (Math.random() * 0.0008 + 0.0003) * (i % 2 === 0 ? 1 : -1);
        this.alpha = Math.random() * 0.04 + 0.02;
        this.pulse = Math.random() * Math.PI * 2;
      }
    }
    for (let i = 0; i < 4; i++) clouds.push(new Cloud(i));

    const handleMouse = (e) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; };
    window.addEventListener("mousemove", handleMouse);

    const sparkles = [];
    class Sparkle {
      constructor(x, y) {
        this.x = x; this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 2.5 + 0.8; this.life = 1;
        this.decay = Math.random() * 0.03 + 0.015;
      }
    }

    const BULGE_RADIUS = 200, BULGE_SCALE = 5;
    let frame = 0, sparkleTimer = 0;

    const draw = () => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);
      frame++; sparkleTimer++;
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      for (const c of clouds) {
        c.angle += c.speed; c.pulse += 0.005;
        const px = c.cx + Math.cos(c.angle) * c.orbit;
        const py = c.cy + Math.sin(c.angle) * c.orbit * 0.5;
        const r = c.radius * (1 + Math.sin(c.pulse) * 0.15);
        const a = c.alpha * (0.85 + Math.sin(c.pulse) * 0.15);
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(0.4, `rgba(200,200,220,${a * 0.5})`);
        g.addColorStop(1, `rgba(0,0,0,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(px - r, py - r, r * 2, r * 2);
      }

      if (mx > 0 && my > 0 && sparkleTimer % 2 === 0) {
        sparkles.push(new Sparkle(mx + (Math.random() - 0.5) * 80, my + (Math.random() - 0.5) * 80));
        if (sparkles.length > 80) sparkles.shift();
      }

      for (const s of stars) {
        s.twinklePhase += s.twinkleSpeed;
        const twinkle = 0.5 + Math.sin(s.twinklePhase) * 0.5;
        const alpha = s.brightness * twinkle;
        const dx = mx - s.x, dy = my - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let sizeMult = 1, extraGlow = 0, isBulged = false;
        if (dist < BULGE_RADIUS) {
          const ease = Math.pow(1 - dist / BULGE_RADIUS, 2);
          sizeMult = 1 + ease * (BULGE_SCALE - 1); extraGlow = ease * 25; isBulged = true;
        }
        const drawSize = s.baseSize * sizeMult;
        if (drawSize > 1.2 || extraGlow > 0) {
          ctx.beginPath(); ctx.arc(s.x, s.y, drawSize * 4 + extraGlow, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.06 + (isBulged ? 0.08 : 0)})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(s.x, s.y, drawSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.r},${s.g},${s.b},${isBulged ? Math.min(1, alpha + 0.5) : alpha})`;
        ctx.shadowColor = isBulged ? "rgba(255,255,255,0.9)" : "";
        ctx.shadowBlur = isBulged ? 15 : 0; ctx.fill(); ctx.shadowBlur = 0;
        if (isBulged && drawSize > 1.5) {
          const fa = extraGlow / 25 * 0.6, fl = drawSize * 6;
          ctx.strokeStyle = `rgba(255,255,255,${fa})`; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(s.x - fl, s.y); ctx.lineTo(s.x + fl, s.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(s.x, s.y - fl); ctx.lineTo(s.x, s.y + fl); ctx.stroke();
          const dl = fl * 0.5; ctx.lineWidth = 0.4; ctx.strokeStyle = `rgba(255,255,255,${fa * 0.5})`;
          ctx.beginPath(); ctx.moveTo(s.x - dl, s.y - dl); ctx.lineTo(s.x + dl, s.y + dl); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(s.x + dl, s.y - dl); ctx.lineTo(s.x - dl, s.y + dl); ctx.stroke();
        }
        s.y += s.speed; if (s.y > H + 10) s.init(false);
      }

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sp = sparkles[i];
        sp.x += sp.vx; sp.y += sp.vy; sp.vx *= 0.97; sp.vy *= 0.97; sp.life -= sp.decay;
        if (sp.life <= 0) { sparkles.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${sp.life * 0.9})`;
        ctx.shadowColor = "rgba(255,255,255,0.8)"; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
        if (sp.size > 1.5) {
          const sLen = sp.size * 3 * sp.life;
          ctx.strokeStyle = `rgba(255,255,255,${sp.life * 0.4})`; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(sp.x - sLen, sp.y); ctx.lineTo(sp.x + sLen, sp.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sp.x, sp.y - sLen); ctx.lineTo(sp.x, sp.y + sLen); ctx.stroke();
        }
      }

      if (mx > 0 && my > 0) {
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, BULGE_RADIUS);
        mg.addColorStop(0, "rgba(255,255,255,0.08)");
        mg.addColorStop(0.3, "rgba(255,255,255,0.03)");
        mg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, BULGE_RADIUS, 0, Math.PI * 2); ctx.fill();
      }

      for (const s of shooters) {
        if (!s.active) { s.timer--; if (s.timer <= 0) s.active = true; continue; }
        s.x += Math.cos(s.angle) * s.speed; s.y += Math.sin(s.angle) * s.speed; s.life -= s.decay;
        if (s.life <= 0 || s.x > W + 100 || s.y > H + 100) { s.reset(); continue; }
        const tx = s.x - Math.cos(s.angle) * s.len, ty = s.y - Math.sin(s.angle) * s.len;
        const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.7, `rgba(255,255,255,${s.life * 0.3})`);
        grad.addColorStop(1, `rgba(255,255,255,${s.life * 0.9})`);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.life})`;
        ctx.shadowColor = "rgba(255,255,255,0.8)"; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, width: "100%", height: "100%", background: "#000", pointerEvents: "none" }} />
  );
}

/* ═══════════════════════════════════════════
   RADIAL GAUGE — SVG Arc Chart
   ═══════════════════════════════════════════ */
function RadialGauge({ score, size = 90, color = "#64c8ff", label }) {
  const s = Math.min(10, Math.max(0, isNaN(score) ? 0 : score));
  const radius = (size - 12) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (s / 10) * circumference;
  const dashArray = `${arcLength} ${circumference - arcLength}`;

  return (
    <div className="radial-gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        {/* Arc */}
        <circle cx={cx} cy={cy} r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={dashArray} strokeDashoffset={circumference * 0.25}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div className="gauge-center">
        <span className="gauge-score" style={{ color }}>{s}</span>
      </div>
      {label && <span className="gauge-label">{label}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   METRIC CARD — Side-by-side gauge comparison
   ═══════════════════════════════════════════ */
function MetricCard({ icon, title, original, modified, note }) {
  const o = isNaN(original) ? 0 : original;
  const m = isNaN(modified) ? 0 : modified;
  const delta = m - o;
  const pct = o > 0 ? Math.round((delta / o) * 100) : (m > 0 ? 100 : 0);
  const improved = delta > 0;
  const same = delta === 0;

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <h4 className="metric-title">{title}</h4>
        {!same && (
          <span className={`metric-delta ${improved ? "up" : "down"}`}>
            {improved ? "▲" : "▼"} {Math.abs(pct)}%
          </span>
        )}
        {same && <span className="metric-delta same">— 0%</span>}
      </div>
      <div className="metric-gauges">
        <RadialGauge score={o} color="#ff8a80" label="Original" />
        <div className="metric-arrow">
          <span className={`arrow-icon ${improved ? "up" : same ? "same" : "down"}`}>
            {improved ? "→" : same ? "=" : "→"}
          </span>
          <span className={`arrow-delta ${improved ? "up" : same ? "same" : "down"}`}>
            {improved ? `+${delta.toFixed(1)}` : same ? "0" : delta.toFixed(1)}
          </span>
        </div>
        <RadialGauge score={m} color="#69f0ae" label="Modified" />
      </div>
      {note && <p className="metric-note">{note}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   COMPARISON DASHBOARD — Full Visual Report
   ═══════════════════════════════════════════ */
function ComparisonChart({ data }) {
  if (!data) return null;

  const overall = isNaN(data.overall) ? 0 : data.overall;
  const verdict = overall >= 8 ? "EXCELLENT" : overall >= 6 ? "GOOD" : overall >= 4 ? "FAIR" : "NEEDS WORK";
  const verdictColor = overall >= 8 ? "#69f0ae" : overall >= 6 ? "#64c8ff" : overall >= 4 ? "#ffd740" : "#ff8a80";

  // Compute total improvement
  const metrics = [
    { o: data.timeOriginal, m: data.timeModified },
    { o: data.spaceOriginal, m: data.spaceModified },
    { o: data.speedOriginal, m: data.speedModified },
    { o: data.readOriginal, m: data.readModified },
    { o: data.maintainOriginal, m: data.maintainModified },
    { o: data.practicesOriginal, m: data.practicesModified },
  ];
  const avgOriginal = metrics.reduce((s, m) => s + (isNaN(m.o) ? 0 : m.o), 0) / metrics.length;
  const avgModified = metrics.reduce((s, m) => s + (isNaN(m.m) ? 0 : m.m), 0) / metrics.length;
  const totalDelta = avgModified - avgOriginal;

  return (
    <div className="comparison-dashboard">
      {/* Hero Score */}
      <div className="hero-score">
        <RadialGauge score={overall} size={160} color={verdictColor} />
        <div className="hero-info">
          <h3 className="hero-title">OVERALL EFFICIENCY</h3>
          <div className="hero-verdict" style={{ color: verdictColor }}>{verdict}</div>
          <p className="hero-subtitle">
            Average improvement: <strong style={{ color: totalDelta >= 0 ? "#69f0ae" : "#ff8a80" }}>
              {totalDelta >= 0 ? "+" : ""}{totalDelta.toFixed(1)}
            </strong> points
          </p>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="metric-grid">
        <MetricCard icon="⏱" title="TIME COMPLEXITY" original={data.timeOriginal}
          modified={data.timeModified} note={data.timeNote} />
        <MetricCard icon="💾" title="SPACE COMPLEXITY" original={data.spaceOriginal}
          modified={data.spaceModified} note={data.spaceNote} />
        <MetricCard icon="⚡" title="EXECUTION SPEED" original={data.speedOriginal}
          modified={data.speedModified} note={data.speedNote} />
        <MetricCard icon="📖" title="READABILITY" original={data.readOriginal}
          modified={data.readModified} note={data.readNote} />
        <MetricCard icon="🔧" title="MAINTAINABILITY" original={data.maintainOriginal}
          modified={data.maintainModified} note={data.maintainNote} />
        <MetricCard icon="✅" title="BEST PRACTICES" original={data.practicesOriginal}
          modified={data.practicesModified} note={data.practicesNote} />
      </div>

      {/* Summary */}
      <div className="comparison-summary">
        <h4>📊 ANALYSIS SUMMARY</h4>
        <p>{data.summary || "Analysis complete."}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [action, setAction] = useState("login");
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [language, setLanguage] = useState("");
  const [codePrompt, setCodePrompt] = useState("");
  const [modifyCode, setModifyCode] = useState("");
  const [modifyLogic, setModifyLogic] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisText, setAnalysisText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post("/auth", {
        username, password, action,
      });

      setLoading(false);
      if (response.data.success) {
        setMessage(response.data.message);
        setIsLoggedIn(true);
        setUserId(response.data.userId);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      setMessage("Error connecting to the server.");
    }
  };

  const handleOptionSubmit = async () => {
    setLoading(true);
    setMessage("");
    setOutputText("");

    try {
      let finalPrompt = "";

      if (selectedOption === "Generate Code") {
        finalPrompt = `Generate code for ${codePrompt}`;
        if (language) finalPrompt += ` in ${language}`;
      } else if (selectedOption === "Modify Code") {
        if (modifyLogic && modifyCode) {
          finalPrompt = `${modifyLogic} the following code:\n\n${modifyCode}`;
        } else {
          finalPrompt = `Modify the following code:\n\n${modifyCode}`;
        }
      }

      const response = await axios.post("/store-option", {
        userId,
        option: selectedOption,
        language,
        codePrompt: finalPrompt,
        modifyCode: finalPrompt,
        modifyLogic,
      });

      setLoading(false);

      /* 🔥 CLEAN OUTPUT EXTRACTION (FROM REFERENCE) */
      const aiOutput = response.data.aiOutput;

      if (typeof aiOutput === "string" && aiOutput.trim() !== "") {
        const cleaned = aiOutput
          .replace(/```[\s\S]*?\n/, "") // remove ```language
          .replace(/```$/, "");         // remove closing ```
        setOutputText(cleaned.trim());
        setMessage("Success!");
      } else {
        setOutputText("No output received.");
        setMessage(response.data.message || "Error receiving output.");
      }
    } catch (error) {
      setLoading(false);
      setMessage("Error. Please try again.");
    }
  };


  // Navigate to Analyze tab with codes from Modify section
  const goToAnalyze = useCallback(() => {
    setSelectedOption("Analyze Code");
    setAnalysisData(null);
    setAnalysisText("");
    setMessage("");
  }, []);

  // Run analysis — sends both codes to backend
  const handleAnalyze = async () => {
    if (!modifyCode.trim() || !outputText.trim()) {
      setMessage("Please modify code first before analyzing.");
      return;
    }
    setLoading(true);
    setMessage("");
    setAnalysisData(null);
    setAnalysisText("");

    try {
      const response = await axios.post("/analyze-code", {
        userId,
        originalCode: modifyCode,
        modifiedCode: outputText,
      });

      setLoading(false);

      if (response.data.analysisResult) {
        const result = response.data.analysisResult;
        setAnalysisText(result);

        // Helper to extract score from a specific section
        const getScore = (text, sectionLabel) => {
          // Matches "Time Original: 7/10" or "Time Original: 7" inside the text
          const regex = new RegExp(`${sectionLabel}[^:\\n]*:[^0-9]*(\\d+(?:\\.\\d+)?)`, "i");
          const match = text.match(regex);
          return match ? Math.min(10, Math.max(0, parseFloat(match[1]))) : 0;
        };

        // Helper to extract note/description for a section
        const getNote = (text, sectionHeader) => {
          if (sectionHeader === "SUMMARY") {
            const match = text.match(/SUMMARY:?\s*([\s\S]*?)(?=\n\n|OVERALL EFFICIENCY SCORE:|$)/i);
            return match ? match[1].trim() : "";
          }
          const regex = new RegExp(`${sectionHeader}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\n|[A-Z ]+:)`, "i");
          const match = text.match(regex);
          return match ? match[1].trim() : "";
        };

        setAnalysisData({
          overall: getScore(result, "OVERALL EFFICIENCY SCORE"),

          timeOriginal: getScore(result, "Time Original"),
          timeModified: getScore(result, "Time Modified"),
          timeNote: getNote(result, "TIME COMPLEXITY"),

          spaceOriginal: getScore(result, "Space Original"),
          spaceModified: getScore(result, "Space Modified"),
          spaceNote: getNote(result, "SPACE COMPLEXITY"),

          speedOriginal: getScore(result, "Speed Original"),
          speedModified: getScore(result, "Speed Modified"),
          speedNote: getNote(result, "EXECUTION SPEED"),

          readOriginal: getScore(result, "Readability Original"),
          readModified: getScore(result, "Readability Modified"),
          readNote: getNote(result, "CODE READABILITY"),

          maintainOriginal: getScore(result, "Maintainability Original"),
          maintainModified: getScore(result, "Maintainability Modified"),
          maintainNote: getNote(result, "MAINTAINABILITY"),

          practicesOriginal: getScore(result, "Practices Original"),
          practicesModified: getScore(result, "Practices Modified"),
          practicesNote: getNote(result, "BEST PRACTICES"),

          summary: getNote(result, "SUMMARY"),
        });
        setMessage("Analysis complete!");
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      setMessage("Error analyzing code. Please try again.");
    }
  };

  return (
    <div className="app">
      <GalaxyCanvas />

      <div className="content">
        {!isLoggedIn ? (
          <div className="login-card">
            <div className="logo">
              <span className="logo-text">SYNTAX</span>
              <span className="logo-ai">AI</span>
            </div>
            <p className="tagline">UNLEASH YOUR CODE</p>

            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Username" value={username}
                onChange={(e) => setUsername(e.target.value)} required />
              <input type="password" placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
              <div className="button-row">
                <button type="submit" className={action === "login" ? "active" : ""}>SIGN IN</button>
                <button type="button" className={action === "signup" ? "active" : ""}
                  onClick={() => setAction(action === "login" ? "signup" : "login")}>
                  {action === "login" ? "SIGN UP" : "BACK"}
                </button>
              </div>
            </form>

            {message && <p className={`msg ${message.includes("Error") ? "error" : ""}`}>{message}</p>}
          </div>
        ) : (
          <div className="dashboard" style={{ maxWidth: selectedOption === "Analyze Code" ? "1200px" : "1100px" }}>
            <div className="logo large">
              <span className="logo-text">SYNTAX</span>
              <span className="logo-ai">AI</span>
            </div>
            <p className="tagline">UNLEASH YOUR CODE</p>

            {selectedOption !== "Analyze Code" ? (
              <div className="nav-buttons">
                <button className={selectedOption === "Generate Code" ? "active" : ""}
                  onClick={() => {
                    setSelectedOption("Generate Code");
                    setOutputText("");
                    setMessage("");
                    setCodePrompt("");
                    setModifyCode("");
                    setLanguage("");
                    setModifyLogic("");
                  }}>GENERATE</button>
                <button className={selectedOption === "Modify Code" ? "active" : ""}
                  onClick={() => {
                    setSelectedOption("Modify Code");
                    setOutputText("");
                    setMessage("");
                    setCodePrompt("");
                    setModifyCode("");
                    setLanguage("");
                    setModifyLogic("");
                  }}>MODIFY</button>
                <button onClick={() => { setIsLoggedIn(false); setSelectedOption(""); }}>LOGOUT</button>
              </div>
            ) : (
              <div className="nav-buttons">
                <button className="back-btn" onClick={() => setSelectedOption("Modify Code")}>
                  ← BACK TO MODIFY
                </button>
              </div>
            )}

            {/* ── GENERATE / MODIFY workspace ── */}
            {(selectedOption === "Generate Code" || selectedOption === "Modify Code") && (
              <div className="workspace">
                <div className="panel">
                  <h3>{selectedOption === "Generate Code" ? "GENERATE CODE" : "MODIFY CODE"}</h3>

                  {selectedOption === "Generate Code" ? (
                    <>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="">Select Language</option>
                        <option value="Python">Python</option>
                        <option value="JavaScript">JavaScript</option>
                        <option value="C++">C++</option>
                        <option value="Java">Java</option>
                        <option value="TypeScript">TypeScript</option>
                      </select>
                      <textarea placeholder="Describe what you want..."
                        value={codePrompt} onChange={(e) => setCodePrompt(e.target.value)} />
                    </>
                  ) : (
                    <>
                      <textarea placeholder="Paste your code..."
                        value={modifyCode} onChange={(e) => setModifyCode(e.target.value)} />
                      <select value={modifyLogic} onChange={(e) => setModifyLogic(e.target.value)}>
                        <option value="">Select Action</option>
                        <option value="Refactor">Refactor</option>
                        <option value="Optimize">Optimize</option>
                        <option value="Fix">Fix Errors</option>
                      </select>
                    </>
                  )}

                  <button className="active" onClick={handleOptionSubmit}>
                    {selectedOption === "Generate Code" ? "GENERATE" : "MODIFY"}
                  </button>
                </div>

                <div className="panel output">
                  <h3>OUTPUT</h3>
                  <pre>{outputText || "// Output appears here..."}</pre>

                  {/* ANALYZE button appears after modify output */}
                  {selectedOption === "Modify Code" && outputText && (
                    <button className="analyze-btn" onClick={goToAnalyze}>
                      📊 ANALYZE EFFICIENCY →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── ANALYZE workspace — full page ── */}
            {selectedOption === "Analyze Code" && (
              <div className="analyze-workspace" style={{ paddingBottom: 60 }}>
                {/* Code preview row before running */}
                {!analysisData && !loading && (
                  <div style={{ marginBottom: 24 }}>
                    <div className="analyze-header">
                      <div className="code-preview">
                        <h4>📄 ORIGINAL CODE</h4>
                        <pre>{modifyCode || "// No original code found"}</pre>
                      </div>
                      <div className="code-preview">
                        <h4>✨ MODIFIED CODE</h4>
                        <pre>{outputText || "// No modified code found"}</pre>
                      </div>
                    </div>
                    <button className="active analyze-run-btn" onClick={handleAnalyze}>
                      🔬 RUN EFFICIENCY ANALYSIS
                    </button>
                  </div>
                )}

                {/* Visual comparison charts + summary */}
                {analysisData && <ComparisonChart data={analysisData} />}
              </div>
            )}

            {message && <p className={`msg ${message.includes("Error") ? "error" : ""}`}>{message}</p>}
          </div>
        )}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}

export default App;
