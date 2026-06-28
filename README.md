# 📚 Estuda Aí — Crie Seu Próprio App de Estudos com IA

Um template de app de estudos em React feito para rodar dentro do **Claude.ai** (via Artifacts), com tutor de IA, gerador de quiz, simulado cronometrado e tracking de progresso por tópico.

> Pensado como um suporte aos estudos — a estrutura serve para qualquer curso, vestibular ou certificação.

![status](https://img.shields.io/badge/status-template-blue) ![license](https://img.shields.io/badge/license-MIT-green) [![GitHub](https://img.shields.io/badge/GitHub-paulagds-181717?logo=github)](https://github.com/paulagds)

---

## ✨ O que ele faz

- **Organização por Fase → Subfase → Aula**, com sidebar colapsável
- **Tutor com IA**: tire dúvidas sobre qualquer tópico cadastrado, com contexto selecionável
- **Quiz Rápido**: gera 5 questões de múltipla escolha sobre um tópico, sem cronômetro
- **Simulado**: gera até 30 questões com cronômetro regressivo (configurável), simulando uma prova real, com gabarito comentado ao final
- **Tracking de domínio**: marque de 0-100% o quanto você já domina cada tópico, com plano de estudos priorizado pelos pontos mais fracos
- **Tema claro/escuro**
- **Progresso salvo automaticamente** (via `window.storage`, nativo do Claude Artifacts)

## 🖼️ Como funciona por dentro

O app é um **único arquivo `App.jsx`** dividido em duas partes:

1. **`INJECTED_TOPICS`** — um array com o conteúdo de todas as suas aulas
2. **O motor do app** — componentes React que renderizam, geram quiz via API do Claude, e gerenciam estado

```js
{
  id: "exemplo-aula01",        // único, nunca repetir
  title: "Aula 01 – Tema",
  phase: "Fase 1",              // agrupamento maior (módulo, bimestre...)
  subfase: "Disciplina",        // agrupamento menor
  mastery: 0,                   // 0-100, progresso de domínio
  summary: "Resumo curto.",
  content: `Conteúdo completo da aula em texto.`
}
```

A função `mergeTopics()` nunca remove tópicos existentes e evita duplicatas pelo `id` — então você pode ir adicionando aulas em sessões diferentes sem perder o progresso salvo.

---

## 🚀 Como usar (modo recomendado: Claude Artifacts)

Este app foi desenhado para rodar **dentro do claude.ai**, onde:
- Não precisa de chave de API, build, ou deploy
- As chamadas para gerar quiz/falar com o tutor já funcionam nativamente
- O progresso é salvo automaticamente entre sessões

**Passo a passo:**

1. Clone ou baixe o repositório:
   ```bash
   git clone https://github.com/paulagds/estuda-ai.git
   ```
2. Abra `App.jsx` e copie todo o conteúdo
3. Abra um novo chat no [claude.ai](https://claude.ai)
4. Cole o código e peça: *"crie um artifact com este código React"*
5. Substitua os tópicos de exemplo pelos do seu curso (veja seção abaixo)
6. Use o app, adicione mais aulas em conversas futuras — nada se perde

> 💡 Dica: você pode pedir para o próprio Claude extrair o conteúdo de PDFs das suas aulas e já formatar como objetos `INJECTED_TOPICS` prontos para colar.

---

## ⚠️ Sobre rodar fora do Claude (standalone)

As funções de IA (`callClaude`) fazem `fetch` direto para `https://api.anthropic.com/v1/messages` **sem chave de API**. Isso só funciona dentro do ambiente de Artifacts do Claude.ai, que faz um proxy autenticado dessas chamadas.

Se você quiser rodar este app como um site standalone (Vite, Next.js, Create React App etc.), as chamadas de IA vão falhar por CORS e falta de autenticação. Para isso funcionar fora do Claude, você precisaria:

1. Criar um **backend simples** (ex: Vercel Function, Cloudflare Worker) que receba a requisição do front e repasse para a API da Anthropic usando sua própria chave (`ANTHROPIC_API_KEY` em variável de ambiente — **nunca no frontend**)
2. Trocar a URL em `callClaude()` para apontar pro seu backend em vez de `api.anthropic.com` direto

As partes de UI, armazenamento de tópicos e tracking de progresso funcionam em qualquer ambiente React — só a camada de IA depende desse ajuste.

---

## 🛠️ Customizando para o seu curso

### 1. Tópicos
Edite o array `INJECTED_TOPICS` no topo do arquivo. Estruture `phase`/`subfase` como quiser — a sidebar agrupa automaticamente.

### 2. Data da prova
```js
const EXAM_DATE = new Date("2026-07-15"); // mude para a sua data
```

### 3. Nome do app
Procure por `"Estuda Aí"` no código (no comentário e na sidebar) e troque pelo nome que quiser.

### 4. Tema visual
As paletas `DARK` e `LIGHT` no início do arquivo controlam todas as cores. Ajuste `accent` para a cor principal do seu tema.

### 5. Formato do simulado
Por padrão simula **30 questões em 1h30**, formato comum de provas presenciais. Ajuste em `genQuiz()`:
```js
setTimeLeft(90 * 60); // tempo em segundos
```

---

## 🧱 Stack

- React (hooks puros, sem dependências externas de estado)
- CSS inline + `<style>` tag (sem framework CSS)
- API da Anthropic (Claude) para geração de quiz e tutor
- `window.storage` (API nativa de Artifacts) para persistência

## 📂 Estrutura do repositório

```
.
├── App.jsx        # template completo (tópicos de exemplo + motor do app)
├── README.md      # este arquivo
└── LICENSE        # MIT
```

## 🤝 Contribuindo

Sinta-se livre para abrir issues com sugestões de features (novos tipos de quiz, exportar progresso, modo flashcard, etc.) ou enviar PRs.

## 📄 Licença

MIT — use, modifique e distribua livremente. Veja [LICENSE](./LICENSE).

---

Feito por [@paulagds](https://github.com/paulagds) 🤍 — um suporte aos estudos, longe dos apps de flashcard genéricos.

Se este template te ajudou, deixa uma ⭐ no repositório!
