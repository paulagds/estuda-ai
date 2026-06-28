// ============================================================
// 📚 ESTUDA AÍ — template de app de estudos com IA
// ============================================================
// Como usar:
// 1. Substitua os tópicos de exemplo abaixo pelos do SEU curso
// 2. Ajuste EXAM_DATE para a data da sua prova
// 3. Cole este arquivo inteiro num novo chat do Claude.ai
//    (ou rode localmente — veja README.md para detalhes)
//
// mergeTopics() nunca remove tópicos existentes e evita
// duplicatas pelo campo "id" — então você pode ir adicionando
// aulas em conversas separadas sem perder o progresso salvo.
// ============================================================

const INJECTED_TOPICS = [
  // ── Exemplo: Fase 1 › Fundamentos ─────────────────────────
  {
    id: "exemplo-aula01",
    title: "Aula 01 – Como Usar Este Template",
    phase: "Fase 1",
    subfase: "Fundamentos",
    mastery: 0,
    summary: "Guia rápido de como adaptar este app para o seu próprio curso ou disciplina.",
    content: `COMO ADAPTAR ESTE TEMPLATE

ESTRUTURA DE UM TÓPICO
Cada aula/tópico é um objeto JavaScript com esta forma:

{
  id: "identificador-unico",       // nunca repita entre tópicos
  title: "Aula 01 – Nome da Aula",
  phase: "Fase 1",                  // agrupamento maior (ex: módulo, bimestre)
  subfase: "Nome da Subfase",       // agrupamento menor (ex: disciplina)
  mastery: 0,                       // progresso 0-100, sempre comece em 0
  summary: "Resumo de 1-2 frases para a tela inicial",
  content: \`Texto completo da aula aqui...\`
}

COMO ADICIONAR CONTEÚDO
1. Pegue o material da sua aula (PDF, slides, anotações)
2. Resuma em tópicos organizados (use ## para seções)
3. Crie um objeto como o exemplo acima
4. Cole dentro do array INJECTED_TOPICS

DICA PARA QUEM ESTUDA COM IA (Claude, ChatGPT etc.)
Você pode pedir para a própria IA gerar esses objetos a partir de um PDF:
"Extraia o conteúdo deste PDF e formate como um objeto JS seguindo esta estrutura: [cole a estrutura acima]"

REUTILIZANDO ENTRE CONVERSAS
Como o app salva o progresso (mastery) localmente via window.storage,
você pode abrir um NOVO chat, colar este arquivo + pedir para adicionar
novos tópicos, e nada do que já existe será perdido — mergeTopics()
cuida disso automaticamente pelo "id".`
  },

  // ── Exemplo: Fase 1 › Disciplina A ────────────────────────
  {
    id: "exemplo-aula02",
    title: "Aula 02 – Exemplo de Conteúdo Técnico",
    phase: "Fase 1",
    subfase: "Disciplina A",
    mastery: 0,
    summary: "Demonstra como estruturar conteúdo técnico com listas, definições e exemplos práticos.",
    content: `TÍTULO DO TÓPICO EM CAIXA ALTA

INTRODUÇÃO
Um parágrafo curto contextualizando o assunto e por que ele importa.

CONCEITOS-CHAVE
• Conceito 1: definição clara e objetiva
• Conceito 2: definição clara e objetiva
• Conceito 3: definição clara e objetiva

EXEMPLO PRÁTICO
Descreva um caso de uso real ou exercício que ilustre o conceito.

RESUMO
Feche com 2-3 frases reforçando os pontos mais importantes para a prova.`
  },

  // ── Exemplo: Fase 2 › Disciplina B ────────────────────────
  {
    id: "exemplo-aula03",
    title: "Aula 01 – Outro Módulo, Outra Subfase",
    phase: "Fase 2",
    subfase: "Disciplina B",
    mastery: 0,
    summary: "Mostra como organizar múltiplas fases e disciplinas dentro do mesmo app.",
    content: `Use phase e subfase para criar a hierarquia que faz sentido pro seu curso:
- phase pode ser "Módulo 1", "Bimestre 1", "Semestre 1" etc.
- subfase pode ser o nome da disciplina, do professor, ou do tema.

A sidebar agrupa automaticamente por essas duas chaves.`
  },
];

// ============================================================
// APP — Estuda Aí (template genérico)
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";

const EXAM_DATE = new Date("2026-07-15");
const daysLeft = Math.max(0, Math.ceil((EXAM_DATE - Date.now()) / 86400000));

// ── Storage helpers ──────────────────────────────────────────
async function storageSave(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}
async function storageLoad(key, fallback) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : fallback;
  } catch { return fallback; }
}

// ── Merge topics (never removes, dedupes by id) ──────────────
function mergeTopics(injected, stored) {
  const map = {};
  stored.forEach(t => { map[t.id] = t; });
  injected.forEach(t => {
    if (!map[t.id]) map[t.id] = t;
    else map[t.id] = { ...t, mastery: map[t.id].mastery ?? 0 };
  });
  return Object.values(map);
}

// ── Claude API call ──────────────────────────────────────────
async function callClaude(system, user, history = [], maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [...history, { role: "user", content: user }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text ?? "";
}

// ── Theme ────────────────────────────────────────────────────
const DARK = {
  bg: "#0d0c14", surface: "#14121f", card: "#1c1a2e",
  border: "#2a2745", accent: "#c9a84c", accentSoft: "rgba(201,168,76,0.12)",
  text: "#e8e4f2", textMuted: "#7e7a9a", green: "#5cb85c",
  blue: "#6ab0d4", red: "#e05c5c", purple: "#9f7aea",
};
const LIGHT = {
  bg: "#f5f4fa", surface: "#ffffff", card: "#f0eef8",
  border: "#dddaf0", accent: "#7c3aed", accentSoft: "rgba(124,58,237,0.1)",
  text: "#1a1730", textMuted: "#6b6880", green: "#16a34a",
  blue: "#2563eb", red: "#dc2626", purple: "#7c3aed",
};

const masteryColor = (m, th) =>
  m >= 80 ? th.green : m >= 50 ? th.accent : m >= 20 ? th.blue : th.textMuted;

// ── CSS ──────────────────────────────────────────────────────
const makeCSS = (th) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { color-scheme: ${th === DARK ? 'dark' : 'light'}; }
  body { background:${th.bg}; color:${th.text}; font-family:'DM Sans',sans-serif; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:${th.surface}; }
  ::-webkit-scrollbar-thumb { background:${th.border}; border-radius:3px; }
  .syne { font-family:'Syne',sans-serif; }
  .btn { cursor:pointer; border:none; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:.85rem; padding:8px 16px; transition:.15s; }
  .btn-accent { background:${th.accent}; color:#fff; font-weight:600; }
  .btn-accent:hover { opacity:.88; }
  .btn-ghost { background:transparent; color:${th.textMuted}; border:1px solid ${th.border}; }
  .btn-ghost:hover { border-color:${th.accent}; color:${th.accent}; }
  .btn-sm { padding:5px 12px; font-size:.78rem; }
  .card { background:${th.card}; border:1px solid ${th.border}; border-radius:12px; }
  .chip { display:inline-block; padding:2px 8px; border-radius:20px; font-size:.7rem; font-weight:500; }
  .chip-gold { background:${th.accentSoft}; color:${th.accent}; }
  .chip-purple { background:rgba(159,122,234,.15); color:${th.purple}; }
  .chip-green { background:rgba(92,184,92,.15); color:${th.green}; }
  input, textarea { font-family:'DM Sans',sans-serif; }
  .fade-in { animation:fadeIn .3s ease; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  .sidebar-btn { width:100%; text-align:left; background:transparent; border:none; cursor:pointer; padding:7px 10px; border-radius:8px; transition:.12s; color:${th.text}; font-family:'DM Sans',sans-serif; font-size:.82rem; }
  .sidebar-btn:hover { background:${th.accentSoft}; color:${th.accent}; }
  .sidebar-btn.active { background:${th.accentSoft}; color:${th.accent}; font-weight:600; }
  .msg-user { background:${th.accentSoft}; border-radius:12px 12px 4px 12px; padding:10px 14px; max-width:82%; margin-left:auto; font-size:.86rem; line-height:1.55; }
  .msg-ai { background:${th.card}; border:1px solid ${th.border}; border-radius:12px 12px 12px 4px; padding:10px 14px; max-width:88%; font-size:.86rem; line-height:1.6; }
  .msg-ai pre { background:${th.surface}; padding:10px; border-radius:6px; overflow-x:auto; font-size:.78rem; margin-top:6px; }
`;

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ topics, selected, onSelect, theme: th, onToggleTheme, tab, setTab }) {
  const [collapsed, setCollapsed] = useState({});

  const grouped = {};
  topics.forEach(t => {
    const phase = t.phase || "Fase 1";
    const sub = t.subfase || "Geral";
    if (!grouped[phase]) grouped[phase] = {};
    if (!grouped[phase][sub]) grouped[phase][sub] = [];
    grouped[phase][sub].push(t);
  });

  const toggle = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  return (
    <div style={{ width:240, minWidth:240, background:th.surface, borderRight:`1px solid ${th.border}`, display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      <div style={{ padding:"16px 14px 10px", borderBottom:`1px solid ${th.border}` }}>
        <div className="syne" style={{ fontSize:"1rem", fontWeight:800, color:th.accent, lineHeight:1.2 }}>Estuda Aí</div>
        <div className="syne" style={{ fontSize:".7rem", color:th.textMuted }}>pra ver, boba! ✨</div>
        <div style={{ marginTop:8, display:"flex", gap:4 }}>
          {["Tópicos","Quiz","Plano","Tutor"].map(t2 => (
            <button key={t2} className={`btn btn-sm ${tab===t2?"btn-accent":"btn-ghost"}`}
              style={{ flex:1, padding:"4px 2px", fontSize:".65rem" }}
              onClick={() => setTab(t2)}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"8px 8px" }}>
        {Object.entries(grouped).map(([phase, subs]) => (
          <div key={phase}>
            <button className="sidebar-btn" style={{ fontWeight:700, fontSize:".75rem", color:th.textMuted, letterSpacing:".5px" }}
              onClick={() => toggle(phase)}>
              {collapsed[phase] ? "▶" : "▼"} {phase.toUpperCase()}
            </button>
            {!collapsed[phase] && Object.entries(subs).map(([sub, ts]) => (
              <div key={sub} style={{ marginLeft:8 }}>
                <button className="sidebar-btn" style={{ fontSize:".72rem", color:th.purple, fontWeight:600 }}
                  onClick={() => toggle(phase+sub)}>
                  {collapsed[phase+sub] ? "▶" : "▼"} {sub}
                </button>
                {!collapsed[phase+sub] && ts.map(t => (
                  <button key={t.id} className={`sidebar-btn${selected?.id===t.id?" active":""}`}
                    style={{ marginLeft:12, fontSize:".78rem", paddingLeft:8 }}
                    onClick={() => onSelect(t)}>
                    <span style={{ color:masteryColor(t.mastery,th), marginRight:4, fontSize:".65rem" }}>●</span>
                    {t.title.replace(/^Aula \d+ [–-] /,"")}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding:"10px 12px", borderTop:`1px solid ${th.border}`, fontSize:".72rem", color:th.textMuted }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>📅 {daysLeft}d para a prova</span>
          <button className="btn btn-ghost btn-sm" onClick={onToggleTheme} style={{ padding:"3px 8px", fontSize:".65rem" }}>
            {th===DARK?"☀️":"🌙"}
          </button>
        </div>
        <div style={{ marginTop:4 }}>
          {topics.length} tópicos · {topics.filter(t=>t.mastery>=80).length} dominados
        </div>
      </div>
    </div>
  );
}

// ── Quiz Component ───────────────────────────────────────────
function QuizView({ topics, theme: th }) {
  const [mode, setMode] = useState("menu"); // menu | quick | sim
  const [selTopics, setSelTopics] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerActive && timeLeft === 0 && quiz) {
      setTimerActive(false);
      setShowResult(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerActive, timeLeft]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const timerColor = timeLeft < 300 ? th.red : timeLeft < 600 ? th.accent : th.green;

  const buildContext = (tlist, maxPerTopic = 2000) =>
    tlist.map(t => `## ${t.title}\n${t.content?.slice(0, maxPerTopic)}`).join('\n\n');

  const genQuiz = async (nQ, isSim) => {
    if (selTopics.length === 0) return;
    setLoading(true); setQuiz(null); setAnswers({}); setShowResult(false);

    // Sample topics to keep context manageable (max 15 topics for simulado)
    const maxTopics = isSim ? 15 : 3;
    const sampled = selTopics.length > maxTopics
      ? [...selTopics].sort(() => Math.random() - 0.5).slice(0, maxTopics)
      : selTopics;

    const charsPerTopic = Math.floor(8000 / sampled.length);
    const ctx = sampled.map(t => '## ' + t.title + ' -- ' + (t.content?.slice(0, charsPerTopic) || '')).join(' | ');

    const prompt = `Você é professor de pós-graduação. Crie EXATAMENTE ${nQ} questões de múltipla escolha baseadas no conteúdo abaixo.

REGRAS OBRIGATÓRIAS:
- Cada questão: 4 alternativas (A, B, C, D), apenas 1 correta
- Questões claras e objetivas, nível pós-graduação
- Varie os tópicos cobertos
- Retorne SOMENTE o JSON, sem texto antes ou depois

FORMATO EXATO (não desvie):
{"questions":[{"q":"pergunta aqui","options":["alternativa A","alternativa B","alternativa C","alternativa D"],"answer":0,"explanation":"explicação da resposta correta"}]}

O campo "answer" é o ÍNDICE (0=A, 1=B, 2=C, 3=D) da alternativa correta.

CONTEÚDO:
${ctx}`;

    try {
      const maxTok = isSim ? 8000 : 2000;
      const txt = await callClaude("Retorne APENAS JSON válido, sem markdown, sem texto fora do JSON.", prompt, [], maxTok);
      const clean = txt.replace(/```json|```/g,"").trim();
      // Try to extract JSON if there's extra text
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.questions || parsed.questions.length === 0) throw new Error("Empty questions");
      setQuiz(parsed);
      if (isSim) {
        setTimeLeft(90 * 60);
        setTimerActive(true);
      }
    } catch(e) {
      setQuiz(null);
      setLoading(false);
      // Show error in UI instead of alert
      setQuiz({ error: e.message });
    }
    setLoading(false);
  };

  const score = quiz ? quiz.questions.filter((q,i) => answers[i] === q.answer).length : 0;
  const pct = quiz ? Math.round(score / quiz.questions.length * 100) : 0;
  const allAnswered = quiz && Object.keys(answers).length === quiz.questions.length;

  const handleFinish = () => {
    setTimerActive(false);
    clearTimeout(timerRef.current);
    setShowResult(true);
  };

  const reset = () => {
    setMode("menu"); setQuiz(null); setAnswers({}); setShowResult(false);
    setTimerActive(false); setTimeLeft(0); setSelTopics([]);
  };

  // ── MENU ──────────────────────────────────────────────────
  if (mode === "menu") return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }} className="fade-in">
      <div className="syne" style={{ fontSize:"1.3rem", fontWeight:800, marginBottom:4, color:th.accent }}>Quiz</div>
      <div style={{ color:th.textMuted, fontSize:".83rem", marginBottom:24 }}>Escolha o modo de estudo</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:28 }}>
        <div className="card" style={{ padding:20, cursor:"pointer", border:`2px solid ${th.border}`, transition:".15s" }}
          onClick={() => setMode("quick")}
          onMouseEnter={e => e.currentTarget.style.borderColor=th.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor=th.border}>
          <div style={{ fontSize:"1.8rem", marginBottom:8 }}>⚡</div>
          <div className="syne" style={{ fontWeight:700, marginBottom:4 }}>Quiz Rápido</div>
          <div style={{ fontSize:".78rem", color:th.textMuted, lineHeight:1.5 }}>5 questões por tópico. Sem cronômetro. Ideal para revisar um conteúdo específico.</div>
        </div>

        <div className="card" style={{ padding:20, cursor:"pointer", border:`2px solid ${th.border}`, transition:".15s" }}
          onClick={() => setMode("sim")}
          onMouseEnter={e => e.currentTarget.style.borderColor=th.red}
          onMouseLeave={e => e.currentTarget.style.borderColor=th.border}>
          <div style={{ fontSize:"1.8rem", marginBottom:8 }}>🎯</div>
          <div className="syne" style={{ fontWeight:700, marginBottom:4, color:th.red }}>Simulado — Prova Real</div>
          <div style={{ fontSize:".78rem", color:th.textMuted, lineHeight:1.5 }}>30 questões · Cronômetro 1h30 · Resultado na hora. Exatamente como a prova presencial.</div>
        </div>
      </div>

      <div style={{ padding:14, background:th.accentSoft, borderRadius:10, fontSize:".8rem", color:th.accent, lineHeight:1.7 }}>
        📋 <strong>Formato da prova presencial FIAP Postech:</strong><br/>
        30 questões de múltipla escolha · 1h–1h30 · Corrigida na hora no polo
      </div>
    </div>
  );

  // ── QUICK QUIZ ─────────────────────────────────────────────
  if (mode === "quick" && !quiz) return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }} className="fade-in">
      <button className="btn btn-ghost btn-sm" onClick={reset} style={{ marginBottom:16 }}>← Voltar</button>
      <div className="syne" style={{ fontSize:"1.1rem", fontWeight:800, marginBottom:4, color:th.accent }}>⚡ Quiz Rápido</div>
      <div style={{ color:th.textMuted, fontSize:".83rem", marginBottom:20 }}>Selecione um tópico para gerar 5 questões</div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        {topics.map(t => (
          <button key={t.id}
            className={`btn btn-sm ${selTopics[0]?.id===t.id?"btn-accent":"btn-ghost"}`}
            onClick={() => setSelTopics([t])}>
            {t.title.replace(/^Aula \d+ [–-] /,"").slice(0,28)}…
          </button>
        ))}
      </div>

      {selTopics.length > 0 && (
        <button className="btn btn-accent" onClick={() => genQuiz(5, false)} disabled={loading}>
          {loading ? "Gerando questões…" : `Gerar 5 questões — ${selTopics[0].title.replace(/^Aula \d+ [–-] /,"").slice(0,30)}`}
        </button>
      )}
    </div>
  );

  // ── SIMULADO ───────────────────────────────────────────────
  if (mode === "sim" && !quiz) return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }} className="fade-in">
      <button className="btn btn-ghost btn-sm" onClick={reset} style={{ marginBottom:16 }}>← Voltar</button>
      <div className="syne" style={{ fontSize:"1.1rem", fontWeight:800, marginBottom:4, color:th.red }}>🎯 Simulado — Prova Real</div>
      <div style={{ color:th.textMuted, fontSize:".83rem", marginBottom:20 }}>
        Selecione os tópicos para o simulado (mínimo 3, recomendado misturar fases)
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        {topics.map(t => {
          const sel = selTopics.find(s => s.id===t.id);
          return (
            <button key={t.id}
              className={`btn btn-sm ${sel?"btn-accent":"btn-ghost"}`}
              onClick={() => setSelTopics(ss => sel ? ss.filter(s=>s.id!==t.id) : [...ss,t])}>
              {sel ? "✓ " : ""}{t.title.replace(/^Aula \d+ [–-] /,"").slice(0,25)}
            </button>
          );
        })}
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setSelTopics(topics)}>Selecionar todos</button>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const shuffled = [...topics].sort(() => Math.random()-0.5);
          setSelTopics(shuffled.slice(0, Math.min(10, topics.length)));
        }}>10 aleatórios</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setSelTopics([])}>Limpar</button>
        <span style={{ fontSize:".75rem", color:th.textMuted }}>{selTopics.length} selecionados</span>
      </div>

      <div className="card" style={{ padding:14, marginBottom:20, fontSize:".82rem", lineHeight:1.7, color:th.textMuted }}>
        ⏱️ <strong style={{ color:th.text }}>Atenção:</strong> ao clicar em Iniciar o cronômetro de 1h30 começa imediatamente.<br/>
        📌 30 questões de múltipla escolha · Resultado automático ao finalizar ou quando o tempo esgotar.
      </div>

      <button className="btn btn-accent" style={{ background:th.red, fontSize:".95rem", padding:"10px 24px" }}
        onClick={() => genQuiz(30, true)}
        disabled={loading || selTopics.length < 1}>
        {loading ? "Gerando 30 questões…" : "🎯 Iniciar Simulado"}
      </button>
    </div>
  );

  // ── ERRO ──────────────────────────────────────────────────
  if (quiz?.error) return (
    <div style={{ flex:1, padding:"24px 28px" }} className="fade-in">
      <div className="card" style={{ padding:20, borderColor:th.red }}>
        <div style={{ fontSize:"1.3rem", marginBottom:8 }}>⚠️ Erro ao gerar questões</div>
        <div style={{ color:th.textMuted, fontSize:".85rem", marginBottom:16 }}>
          Tente selecionar menos tópicos ou tente novamente.
        </div>
        <button className="btn btn-accent" onClick={reset}>Voltar</button>
      </div>
    </div>
  );

  // ── QUIZ / SIMULADO EM ANDAMENTO ───────────────────────────
  if (quiz && !quiz.error && !showResult) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header com timer */}
      <div style={{ padding:"10px 20px", borderBottom:`1px solid ${th.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ fontSize:".82rem", color:th.textMuted }}>
          {Object.keys(answers).length}/{quiz.questions.length} respondidas
        </div>
        {timerActive && (
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.3rem", color:timerColor, letterSpacing:1 }}>
            ⏱ {fmt(timeLeft)}
          </div>
        )}
        <button className="btn btn-ghost btn-sm" onClick={reset}>Sair</button>
      </div>

      {/* Questões */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
        {quiz.questions.map((q, i) => (
          <div key={i} className="card" style={{ padding:16, marginBottom:12 }}>
            <div style={{ fontWeight:600, marginBottom:10, fontSize:".88rem", lineHeight:1.5 }}>
              <span style={{ color:th.accent, marginRight:6 }}>{i+1}.</span>{q.q}
            </div>
            {q.options.map((opt, j) => (
              <button key={j}
                onClick={() => setAnswers(a => ({...a,[i]:j}))}
                style={{ display:"block", width:"100%", textAlign:"left", padding:"9px 12px", marginBottom:5,
                  borderRadius:8,
                  border:`1px solid ${answers[i]===j ? th.accent : th.border}`,
                  background: answers[i]===j ? th.accentSoft : th.card,
                  cursor:"pointer", color:th.text, fontSize:".83rem", transition:".1s",
                  fontWeight: answers[i]===j ? 600 : 400 }}>
                <span style={{ color:th.accent, marginRight:8, fontWeight:700 }}>{["A","B","C","D"][j]}.</span>{opt}
              </button>
            ))}
          </div>
        ))}

        <div style={{ height:20 }} />
      </div>

      {/* Footer */}
      <div style={{ padding:"12px 20px", borderTop:`1px solid ${th.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ fontSize:".78rem", color:th.textMuted }}>
          {allAnswered ? "✅ Todas respondidas!" : `${quiz.questions.length - Object.keys(answers).length} sem resposta`}
        </div>
        <button className="btn btn-accent"
          style={{ background: allAnswered ? th.green : th.accent }}
          onClick={handleFinish}>
          {allAnswered ? "✅ Finalizar e Ver Resultado" : "Finalizar (com pendentes)"}
        </button>
      </div>
    </div>
  );

  // ── RESULTADO ──────────────────────────────────────────────
  if (showResult && quiz && !quiz.error) return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }} className="fade-in">
      {/* Placar */}
      <div className="card" style={{ padding:24, marginBottom:20, textAlign:"center" }}>
        <div className="syne" style={{ fontSize:"3rem", fontWeight:800,
          color: pct >= 70 ? th.green : pct >= 50 ? th.accent : th.red }}>
          {score}/{quiz.questions.length}
        </div>
        <div className="syne" style={{ fontSize:"1.3rem", fontWeight:700, color:th.textMuted, marginBottom:8 }}>
          {pct}% de acertos
        </div>
        <div style={{ fontSize:".88rem", color:th.textMuted }}>
          {pct >= 70 ? "🎉 Excelente! Você está bem preparada." : pct >= 50 ? "📚 Bom progresso! Revise os erros." : "🔄 Refaça o simulado após revisar o conteúdo."}
        </div>
        {!timerActive && timeLeft > 0 && (
          <div style={{ marginTop:8, fontSize:".78rem", color:th.green }}>
            ⏱ Tempo restante ao finalizar: {fmt(timeLeft)}
          </div>
        )}
      </div>

      {/* Gabarito */}
      <div className="syne" style={{ fontSize:".85rem", fontWeight:700, color:th.textMuted, marginBottom:12, letterSpacing:".5px" }}>
        GABARITO COMENTADO
      </div>

      {quiz.questions.map((q, i) => {
        const userAns = answers[i];
        const correct = userAns === q.answer;
        return (
          <div key={i} className="card" style={{ padding:16, marginBottom:10,
            borderColor: correct ? th.green : userAns !== undefined ? th.red : th.border }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
              <span style={{ fontSize:"1rem" }}>{correct ? "✅" : userAns !== undefined ? "❌" : "⬜"}</span>
              <div style={{ fontWeight:600, fontSize:".86rem", lineHeight:1.5 }}>{i+1}. {q.q}</div>
            </div>
            {q.options.map((opt, j) => (
              <div key={j} style={{ padding:"5px 10px", borderRadius:6, marginBottom:3, fontSize:".82rem",
                background: j===q.answer ? "rgba(92,184,92,.15)" : j===userAns && !correct ? "rgba(224,92,92,.12)" : "transparent",
                fontWeight: j===q.answer ? 700 : 400,
                color: j===q.answer ? th.green : j===userAns && !correct ? th.red : th.textMuted }}>
                {["A","B","C","D"][j]}. {opt}
                {j===q.answer && " ✓"}
                {j===userAns && !correct && " ✗"}
              </div>
            ))}
            <div style={{ marginTop:8, padding:"8px 10px", background:th.accentSoft, borderRadius:6, fontSize:".79rem", color:th.accent, lineHeight:1.6 }}>
              💡 {q.explanation}
            </div>
          </div>
        );
      })}

      <button className="btn btn-accent" style={{ marginTop:16 }} onClick={reset}>
        Novo Quiz / Simulado
      </button>
      <div style={{ height:40 }} />
    </div>
  );

  return null;
}

// ── Study Plan ───────────────────────────────────────────────
function PlanView({ topics, setTopics, theme: th }) {
  const [notes, setNotes] = useState({});

  const byMastery = [...topics].sort((a,b) => a.mastery - b.mastery);
  const update = (id, m) => setTopics(ts => ts.map(t => t.id===id ? {...t, mastery: Math.max(0, Math.min(100, m))} : t));

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }} className="fade-in">
      <div className="syne" style={{ fontSize:"1.3rem", fontWeight:800, marginBottom:6, color:th.accent }}>Plano de Estudos</div>
      <div style={{ color:th.textMuted, fontSize:".83rem", marginBottom:20 }}>
        Priorizado por domínio. Ajuste o % conforme estuda.
      </div>
      {byMastery.map(t => (
        <div key={t.id} className="card" style={{ padding:14, marginBottom:10, display:"flex", gap:12, alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:".86rem", marginBottom:4 }}>{t.title}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
              <span className="chip chip-purple" style={{ fontSize:".65rem" }}>{t.subfase}</span>
              <span style={{ fontSize:".72rem", color:masteryColor(t.mastery,th), fontWeight:600 }}>{t.mastery}% dominado</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input type="range" min={0} max={100} step={5} value={t.mastery}
                onChange={e => update(t.id, +e.target.value)}
                style={{ flex:1, accentColor:th.accent }} />
              <span style={{ fontSize:".75rem", color:th.textMuted, minWidth:30 }}>{t.mastery}%</span>
            </div>
            <div style={{ marginTop:4, background:th.surface, borderRadius:4, height:4, overflow:"hidden" }}>
              <div style={{ width:`${t.mastery}%`, height:"100%", background:masteryColor(t.mastery,th), transition:".3s" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tutor View ───────────────────────────────────────────────
function TutorView({ topics, theme: th }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selTopics, setSelTopics] = useState([]);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(m => [...m, {role:"user",text:userMsg}]);
    setLoading(true);

    const context = selTopics.length > 0
      ? selTopics.map(t => `## ${t.title}\n${t.content?.slice(0,2000)}`).join("\n\n")
      : topics.slice(0,3).map(t => `## ${t.title}\n${t.content?.slice(0,1000)}`).join("\n\n");

    const sys = `Você é um tutor especialista e amigável para uma aluna de pós-graduação em Gestão de TI. Responda de forma clara, didática e objetiva em português. Use exemplos práticos quando possível. Se usar listas, mantenha-as curtas.

CONTEÚDO DO CURSO:\n${context}`;

    const history = msgs.slice(-6).map(m => ({role:m.role==="user"?"user":"assistant", content:m.text}));
    const reply = await callClaude(sys, userMsg, history);
    setMsgs(m => [...m, {role:"ai",text:reply}]);
    setLoading(false);
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ padding:"12px 20px", borderBottom:`1px solid ${th.border}`, display:"flex", gap:6, flexWrap:"wrap" }}>
        <span style={{ fontSize:".72rem", color:th.textMuted, alignSelf:"center", marginRight:4 }}>Contexto:</span>
        {topics.map(t => (
          <button key={t.id} className={`btn btn-sm ${selTopics.find(s=>s.id===t.id)?"btn-accent":"btn-ghost"}`}
            style={{ fontSize:".65rem", padding:"3px 8px" }}
            onClick={() => setSelTopics(ss => ss.find(s=>s.id===t.id) ? ss.filter(s=>s.id!==t.id) : [...ss,t])}>
            {t.title.replace(/^Aula \d+ [–-] /,"").slice(0,20)}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>
        {msgs.length === 0 && (
          <div style={{ color:th.textMuted, fontSize:".85rem", textAlign:"center", marginTop:40 }}>
            <div style={{ fontSize:"2rem", marginBottom:10 }}>🎓</div>
            <div>Olá! Selecione os tópicos acima e me faça uma pergunta.</div>
            <div style={{ marginTop:8, fontSize:".78rem" }}>Posso explicar conceitos, criar exemplos, comparar teorias ou simular perguntas de prova.</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
            <div className={m.role==="user"?"msg-user":"msg-ai"} style={{ whiteSpace:"pre-wrap" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="msg-ai" style={{ color:th.textMuted, fontStyle:"italic" }}>pensando…</div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding:"10px 20px", borderTop:`1px solid ${th.border}`, display:"flex", gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
          placeholder="Digite sua dúvida…"
          style={{ flex:1, padding:"9px 14px", borderRadius:8, border:`1px solid ${th.border}`,
            background:th.surface, color:th.text, fontSize:".87rem", outline:"none" }} />
        <button className="btn btn-accent" onClick={send} disabled={loading || !input.trim()}>Enviar</button>
      </div>
    </div>
  );
}

// ── Topic Detail ─────────────────────────────────────────────
function TopicDetail({ topic, setTopics, theme: th }) {
  const [tab, setTab] = useState("Conteúdo");

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }} className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:6 }}>
            <span className="chip chip-gold">{topic.phase}</span>
            <span className="chip chip-purple">{topic.subfase}</span>
          </div>
          <div className="syne" style={{ fontSize:"1.2rem", fontWeight:800, lineHeight:1.3 }}>{topic.title}</div>
        </div>
        <div style={{ textAlign:"right", minWidth:80 }}>
          <div style={{ fontSize:"1.6rem", fontWeight:800, color:masteryColor(topic.mastery,th), fontFamily:"'Syne',sans-serif" }}>{topic.mastery}%</div>
          <div style={{ fontSize:".7rem", color:th.textMuted }}>domínio</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <input type="range" min={0} max={100} step={5} value={topic.mastery}
          onChange={e => setTopics(ts => ts.map(t => t.id===topic.id ? {...t, mastery:+e.target.value} : t))}
          style={{ flex:1, accentColor:th.accent }} />
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {["Conteúdo","Resumo"].map(t => (
          <button key={t} className={`btn btn-sm ${tab===t?"btn-accent":"btn-ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Resumo" && (
        <div className="card fade-in" style={{ padding:18, lineHeight:1.8, fontSize:".9rem" }}>
          {topic.summary}
        </div>
      )}

      {tab === "Conteúdo" && (
        <div className="card fade-in" style={{ padding:20, lineHeight:1.75, fontSize:".87rem", whiteSpace:"pre-wrap" }}>
          {topic.content || "Conteúdo não disponível."}
        </div>
      )}
    </div>
  );
}

// ── Home / Overview ──────────────────────────────────────────
function HomeView({ topics, onSelect, theme: th }) {
  const byPhase = {};
  topics.forEach(t => {
    const k = (t.phase||"Fase 1") + " › " + (t.subfase||"Geral");
    if (!byPhase[k]) byPhase[k] = [];
    byPhase[k].push(t);
  });

  const total = topics.length;
  const dominated = topics.filter(t=>t.mastery>=80).length;
  const avgMastery = total ? Math.round(topics.reduce((s,t)=>s+t.mastery,0)/total) : 0;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }} className="fade-in">
      <div className="syne" style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:4 }}>Olá, Paula! 👋</div>
      <div style={{ color:th.textMuted, fontSize:".87rem", marginBottom:24 }}>
        {daysLeft} dias para a prova · {dominated}/{total} tópicos dominados
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:28 }}>
        {[
          { label:"Tópicos", val:total, icon:"📚" },
          { label:"Dominados", val:dominated, icon:"✅" },
          { label:"Média geral", val:avgMastery+"%", icon:"📊" },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:16, textAlign:"center" }}>
            <div style={{ fontSize:"1.5rem" }}>{c.icon}</div>
            <div className="syne" style={{ fontSize:"1.3rem", fontWeight:800, color:th.accent }}>{c.val}</div>
            <div style={{ fontSize:".75rem", color:th.textMuted }}>{c.label}</div>
          </div>
        ))}
      </div>

      {Object.entries(byPhase).map(([key, ts]) => (
        <div key={key} style={{ marginBottom:24 }}>
          <div className="syne" style={{ fontSize:".85rem", fontWeight:700, color:th.textMuted, marginBottom:10, letterSpacing:".5px" }}>
            {key.toUpperCase()}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {ts.map(t => (
              <div key={t.id} className="card" style={{ padding:14, cursor:"pointer", transition:".12s" }}
                onClick={() => onSelect(t)}
                onMouseEnter={e => e.currentTarget.style.borderColor=th.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor=th.border}>
                <div style={{ fontWeight:600, fontSize:".83rem", marginBottom:6, lineHeight:1.3 }}>
                  {t.title.replace(/^Aula \d+ [–-] /,"").slice(0,50)}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:".7rem", color:th.textMuted }}>{t.summary?.slice(0,50)}…</span>
                  <span style={{ fontSize:".78rem", fontWeight:700, color:masteryColor(t.mastery,th), flexShrink:0, marginLeft:6 }}>{t.mastery}%</span>
                </div>
                <div style={{ marginTop:8, background:th.surface, borderRadius:3, height:3 }}>
                  <div style={{ width:`${t.mastery}%`, height:"100%", background:masteryColor(t.mastery,th), transition:".3s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const th = isDark ? DARK : LIGHT;
  const [topics, setTopics] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("Tópicos");
  const [loaded, setLoaded] = useState(false);

  // Load & merge
  useEffect(() => {
    (async () => {
      const stored = await storageLoad("topics_v2", []);
      const merged = mergeTopics(INJECTED_TOPICS, stored);
      setTopics(merged);
      setLoaded(true);
    })();
  }, []);

  // Save when topics change
  useEffect(() => {
    if (loaded) storageSave("topics_v2", topics);
  }, [topics, loaded]);

  const handleSelect = (t) => { setSelected(t); setTab("Tópicos"); };

  return (
    <>
      <style>{makeCSS(th)}</style>
      <div style={{ height:"100vh", display:"flex", overflow:"hidden", background:th.bg }}>
        <Sidebar topics={topics} selected={selected} onSelect={handleSelect}
          theme={th} onToggleTheme={() => setIsDark(d=>!d)} tab={tab} setTab={setTab} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {tab === "Tópicos" && !selected && <HomeView topics={topics} onSelect={handleSelect} theme={th} />}
          {tab === "Tópicos" && selected && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"10px 20px", borderBottom:`1px solid ${th.border}` }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>← Voltar</button>
              </div>
              <TopicDetail topic={selected} setTopics={setTopics} theme={th} />
            </div>
          )}
          {tab === "Quiz" && <QuizView topics={topics} theme={th} />}
          {tab === "Plano" && <PlanView topics={topics} setTopics={setTopics} theme={th} />}
          {tab === "Tutor" && <TutorView topics={topics} theme={th} />}
        </div>
      </div>
    </>
  );
}
