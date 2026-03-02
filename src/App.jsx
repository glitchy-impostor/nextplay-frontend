import { useState, useEffect, useCallback } from "react";

// ============================================================
// CONFIG — Update API_BASE with your Railway deployment URL
// ============================================================
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:3001/api"
  : "https://nextplay-api-production.up.railway.app/api";

// ============================================================
// API CLIENT
// ============================================================
const api = {
  async getSports() {
    const res = await fetch(`${API_BASE}/sports`);
    if (!res.ok) throw new Error("Failed to load sports");
    return res.json();
  },
  async getSport(sportId) {
    const res = await fetch(`${API_BASE}/sports/${sportId}`);
    if (!res.ok) throw new Error("Failed to load sport");
    return res.json();
  },
  async createSession(sportId) {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sportId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create session");
    }
    return res.json();
  },
  async predict(sessionId, optionId) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Prediction failed");
    }
    return res.json();
  },
};

const DEFAULT_THEME = { primary: "#0f0f1a", secondary: "#1a1a2e", accent: "#f0c040" };

// ============================================================
// COMPONENTS
// ============================================================

const ScoreBoard = ({ context, accent }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center", gap: "24px",
    background: "rgba(0,0,0,0.4)", borderRadius: "12px", padding: "12px 28px",
    fontFamily: "'Courier New', monospace", border: `1px solid ${accent}33`,
  }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "11px", opacity: 0.6, letterSpacing: "1px" }}>{context.homeTeam?.toUpperCase()}</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: accent }}>{context.homeScore}</div>
    </div>
    <div style={{
      fontSize: "12px", opacity: 0.5, padding: "4px 12px",
      border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px",
    }}>{context.period || context.time}</div>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "11px", opacity: 0.6, letterSpacing: "1px" }}>{context.awayTeam?.toUpperCase()}</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: accent }}>{context.awayScore}</div>
    </div>
  </div>
);

const OptionCard = ({ option, index, selected, correctId, revealedOptions, revealed, onClick, accent }) => {
  const isCorrect = correctId === option.id;
  const isSelected = selected === option.id;
  const letters = ["A", "B", "C", "D"];
  const revealedOpt = revealedOptions?.find((o) => o.id === option.id);

  let bg = "rgba(255,255,255,0.04)", border = "1px solid rgba(255,255,255,0.08)", glow = "none";

  if (revealed) {
    if (isCorrect) { bg = "rgba(46,213,115,0.15)"; border = "2px solid #2ed573"; glow = "0 0 20px rgba(46,213,115,0.2)"; }
    else if (isSelected) { bg = "rgba(255,71,87,0.15)"; border = "2px solid #ff4757"; glow = "0 0 20px rgba(255,71,87,0.2)"; }
  } else if (isSelected) { bg = `${accent}18`; border = `2px solid ${accent}`; glow = `0 0 15px ${accent}33`; }

  return (
    <button onClick={() => !revealed && onClick(option.id)} disabled={revealed} style={{
      display: "flex", alignItems: "center", gap: "14px", width: "100%", padding: "16px 20px",
      background: bg, border, borderRadius: "12px", color: "#fff",
      cursor: revealed ? "default" : "pointer", transition: "all 0.25s ease",
      textAlign: "left", fontFamily: "inherit", boxShadow: glow,
      opacity: revealed && !isCorrect && !isSelected ? 0.4 : 1,
    }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "8px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: "700", fontSize: "14px", flexShrink: 0,
        background: isSelected && !revealed ? accent : revealed && isCorrect ? "#2ed573" : revealed && isSelected ? "#ff4757" : "rgba(255,255,255,0.08)",
        color: (isSelected && !revealed) || (revealed && (isCorrect || isSelected)) ? "#000" : "rgba(255,255,255,0.5)",
      }}>
        {revealed && isCorrect ? "✓" : revealed && isSelected ? "✗" : letters[index]}
      </div>
      <div>
        <div style={{ fontWeight: "600", fontSize: "15px" }}>{option.label}</div>
        {revealed && revealedOpt && <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.6 }}>{revealedOpt.points} pts</div>}
      </div>
    </button>
  );
};

const RuleCard = ({ rule, accent }) => (
  <div style={{
    marginTop: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "14px",
    padding: "20px 24px", borderLeft: `4px solid ${accent}`,
  }}>
    <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: accent, marginBottom: "8px", fontWeight: "700" }}>
      📖 Rule Explained
    </div>
    <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>{rule.title}</div>
    <div style={{ fontSize: "14px", lineHeight: "1.65", opacity: 0.8 }}>{rule.explanation}</div>
  </div>
);

const ProgressDots = ({ total, current, results, accent }) => (
  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
    {Array.from({ length: total }).map((_, i) => {
      let bg = "rgba(255,255,255,0.12)";
      if (i < results.length) bg = results[i].correct ? "#2ed573" : "#ff4757";
      else if (i === current) bg = accent;
      return <div key={i} style={{ width: i === current ? "28px" : "10px", height: "10px", borderRadius: "5px", background: bg, transition: "all 0.3s ease" }} />;
    })}
  </div>
);

const Spinner = ({ accent }) => (
  <div style={{ textAlign: "center", padding: "60px 0" }}>
    <div style={{
      width: "36px", height: "36px", border: "3px solid rgba(255,255,255,0.1)",
      borderTopColor: accent, borderRadius: "50%", margin: "0 auto 16px",
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ fontSize: "14px", opacity: 0.4 }}>Loading...</div>
  </div>
);

// ============================================================
// MAIN APP
// ============================================================
export default function NextPlayGame() {
  const [phase, setPhase] = useState("menu");
  const [sports, setSports] = useState([]);
  const [sportConfig, setSportConfig] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [nextScenario, setNextScenario] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalScenarios, setTotalScenarios] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animIn, setAnimIn] = useState(true);

  const theme = sportConfig?.theme || DEFAULT_THEME;
  const accent = theme.accent;

  useEffect(() => {
    api.getSports()
      .then((data) => { setSports(data.sports); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const transition = useCallback((fn) => {
    setAnimIn(false);
    setTimeout(() => { fn(); setAnimIn(true); }, 250);
  }, []);

  const handleSportSelect = async (sportId) => {
    setLoading(true);
    setError(null);
    try {
      const [sportData, sessionData] = await Promise.all([api.getSport(sportId), api.createSession(sportId)]);
      transition(() => {
        setSportConfig(sportData);
        setSessionId(sessionData.session.id);
        setCurrentScenario(sessionData.currentScenario);
        setNextScenario(null);
        setCurrentIndex(0);
        setTotalScenarios(sessionData.session.totalScenarios);
        setResults([]); setTotalScore(0); setSelectedOption(null); setFeedback(null);
        setPhase("playing"); setLoading(false);
      });
    } catch (err) { setError(err.message); setLoading(false); }
  };

  const handlePredict = async () => {
    if (!selectedOption || !sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.predict(sessionId, selectedOption);
      setFeedback(data.result);
      setNextScenario(data.nextScenario || null);
      setResults((prev) => [...prev, {
        correct: data.result.correct,
        pointsEarned: data.result.pointsEarned,
        rule: data.result.rule,
      }]);
      setTotalScore(data.session.totalScore);
      setPhase("feedback");
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalScenarios) {
      transition(() => setPhase("summary"));
    } else {
      transition(() => {
        setCurrentScenario(nextScenario);
        setNextScenario(null);
        setCurrentIndex((p) => p + 1);
        setSelectedOption(null); setFeedback(null); setPhase("playing");
      });
    }
  };

  const handleRestart = () => {
    transition(() => {
      setPhase("menu"); setSportConfig(null); setSessionId(null);
      setCurrentScenario(null); setNextScenario(null); setCurrentIndex(0);
      setResults([]); setTotalScore(0); setSelectedOption(null); setFeedback(null);
      setError(null);
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(170deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.primary} 100%)`,
      color: "#fff", fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px", overflow: "hidden",
    }}>
      <div style={{
        maxWidth: "520px", width: "100%",
        opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.3s ease",
      }}>

        {/* ERROR BANNER */}
        {error && (
          <div style={{
            background: "rgba(255,71,87,0.15)", border: "1px solid #ff4757",
            borderRadius: "10px", padding: "12px 16px", marginBottom: "16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "14px" }}>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{
              background: "none", border: "none", color: "#ff4757",
              cursor: "pointer", fontSize: "18px", fontFamily: "inherit",
            }}>×</button>
          </div>
        )}

        {/* MENU */}
        {phase === "menu" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎮</div>
            <h1 style={{
              fontSize: "36px", fontWeight: "800", margin: "0 0 4px 0", letterSpacing: "-1px",
              background: "linear-gradient(135deg, #f0c040, #e8a020)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Next Play</h1>
            <p style={{ fontSize: "15px", opacity: 0.5, marginBottom: "40px", fontWeight: "500" }}>
              Predict the play. Learn the rules.
            </p>

            {loading ? <Spinner accent="#f0c040" /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sports.map((sport) => (
                  <button key={sport.id} onClick={() => handleSportSelect(sport.id)} style={{
                    display: "flex", alignItems: "center", gap: "16px", width: "100%",
                    padding: "20px 24px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px",
                    color: "#fff", cursor: "pointer", transition: "all 0.2s ease",
                    fontFamily: "inherit", textAlign: "left",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${sport.theme?.accent || '#f0c040'}12`; e.currentTarget.style.borderColor = `${sport.theme?.accent || '#f0c040'}40`; e.currentTarget.style.transform = "translateX(4px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <span style={{ fontSize: "32px" }}>{sport.emoji}</span>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: "700" }}>{sport.name}</div>
                      <div style={{ fontSize: "13px", opacity: 0.5 }}>{sport.scenarioCount} scenarios · Max {sport.maxScore} pts</div>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: "18px", opacity: 0.3 }}>→</span>
                  </button>
                ))}
              </div>
            )}
            <p style={{ fontSize: "12px", opacity: 0.3, marginTop: "32px", lineHeight: "1.5" }}>
              Sport-agnostic engine · Sports loaded from API at runtime
            </p>
          </div>
        )}

        {/* PLAYING / FEEDBACK */}
        {(phase === "playing" || phase === "feedback") && currentScenario && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <button onClick={handleRestart} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "14px", fontFamily: "inherit", padding: "4px 0" }}>← Back</button>
              <div style={{ fontSize: "13px", fontWeight: "600", color: accent }}>{sportConfig.emoji} {sportConfig.name}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", opacity: 0.5 }}>{totalScore} pts</div>
            </div>

            <ProgressDots total={totalScenarios} current={currentIndex} results={results} accent={accent} />

            <div style={{ margin: "20px 0" }}><ScoreBoard context={currentScenario.context} accent={accent} /></div>

            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "20px 22px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.4, marginBottom: "10px", fontWeight: "600" }}>Game Situation</div>
              <div style={{ fontSize: "16px", lineHeight: "1.6", fontWeight: "500" }}>{currentScenario.situation}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", opacity: 0.4, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>
                {feedback ? "Result" : "What happens next?"}
              </div>
              {currentScenario.options.map((opt, i) => (
                <OptionCard key={opt.id} option={opt} index={i} selected={selectedOption}
                  correctId={feedback?.correctOptionId} revealedOptions={feedback?.options}
                  revealed={!!feedback} onClick={setSelectedOption} accent={accent} />
              ))}
            </div>

            {feedback && <RuleCard rule={feedback.rule} accent={accent} />}

            <button onClick={feedback ? handleNext : handlePredict}
              disabled={(!selectedOption && !feedback) || (loading && !feedback)}
              style={{
                width: "100%", padding: "16px", marginTop: "20px", borderRadius: "12px",
                border: "none", fontWeight: "700", fontSize: "16px", fontFamily: "inherit",
                cursor: (!selectedOption && !feedback) || (loading && !feedback) ? "not-allowed" : "pointer",
                background: (!selectedOption && !feedback) || (loading && !feedback) ? "rgba(255,255,255,0.06)" : accent,
                color: (!selectedOption && !feedback) || (loading && !feedback) ? "rgba(255,255,255,0.3)" : "#000",
                transition: "all 0.2s ease",
              }}>
              {loading && !feedback ? "Submitting..." : feedback ? (currentIndex + 1 >= totalScenarios ? "See Results" : "Next Play →") : "Lock In Prediction"}
            </button>
          </div>
        )}

        {/* SUMMARY */}
        {phase === "summary" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>
              {results.filter((r) => r.correct).length === totalScenarios ? "🏆" : results.filter((r) => r.correct).length >= totalScenarios / 2 ? "🎯" : "📚"}
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 4px 0" }}>Game Over!</h2>
            <p style={{ opacity: 0.5, fontSize: "14px", marginBottom: "28px" }}>{sportConfig.emoji} {sportConfig.name} Edition</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "14px", padding: "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "32px", fontWeight: "800", color: accent }}>{totalScore}</div>
                <div style={{ fontSize: "12px", opacity: 0.4, marginTop: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Points</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "14px", padding: "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "32px", fontWeight: "800", color: accent }}>{results.filter((r) => r.correct).length}/{totalScenarios}</div>
                <div style={{ fontSize: "12px", opacity: 0.4, marginTop: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Correct</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px", textAlign: "left" }}>
              {results.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "16px" }}>{r.correct ? "✅" : "❌"}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", flex: 1 }}>{r.rule.title}</span>
                  <span style={{ fontSize: "12px", opacity: 0.5 }}>{r.pointsEarned} pts</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => handleSportSelect(sportConfig.id)} style={{
                flex: 1, padding: "14px", borderRadius: "12px", border: `1px solid ${accent}40`,
                background: "transparent", color: accent, fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
              }}>Play Again</button>
              <button onClick={handleRestart} style={{
                flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: accent,
                color: "#000", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
              }}>Change Sport</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
