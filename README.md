# 🛡️ PaperTrail (VaultMind) — 100% Offline AI Document Risk Analyzer

[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest-2026-ff7a00?style=for-the-badge&logo=hacktoberfest&logoColor=white)](https://hacktoberfest.com/)
[![Privacy-First](https://img.shields.io/badge/Privacy-100%25%20Offline%20Air--Gapped-10b981?style=for-the-badge&logo=shield&logoColor=white)](#privacy-first-architecture)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLite-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Ollama](https://img.shields.io/badge/AI%20Engine-Ollama%20(gemma4%3Ae4b)-000000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> **PaperTrail** is an enterprise-grade, **100% offline, privacy-first legal and financial document analyzer**. Built for individuals and legal teams handling sensitive contracts, NDAs, leases, and invoices without leaking a single byte to cloud AI providers.

---

## 🔒 Privacy-First Architecture

Conventional document analyzers transmit sensitive NDAs, payroll records, and intellectual property agreements to third-party cloud APIs. **PaperTrail is completely air-gapped**:

```
 ┌──────────────────────┐
 │   Uploaded Document  │  (PDF or Image)
 └──────────┬───────────┘
            │
            ▼
 ┌──────────────────────┐
 │      pdfplumber      │  Extracts Page 1 & rasterizes to base64 PNG bitmap
 └──────────┬───────────┘
            │
            ▼
 ┌──────────────────────┐
 │     Local Ollama     │  Executes on local hardware (model: gemma4:e4b)
 │   (System Prompt)    │  Extracts parties, financials, deadlines & risk clauses
 └──────────┬───────────┘
            │
            ▼
 ┌──────────────────────┐
 │   Pydantic Schema    │  Strict JSON schema enforcement (parties, amount,
 │      Validator       │  deadlines, risky_clauses: clause/risk_level/explanation)
 └──────────┬───────────┘
            │
      ┌─────┴─────────────────┐
      ▼                       ▼
┌──────────────┐     ┌──────────────────────┐
│ Local SQLite │     │ Split-Pane Dashboard │
│ History DB   │     │ (React 18 + Tailwind)│
└──────────────┘     └──────────────────────┘
```

1. **Local Vision Preprocessing**: PDFs have their first page isolated and rasterized using `pdfplumber` into a high-density base64 image stream.
2. **On-Device Vision Intelligence**: The base64 image is passed to a local instance of **Ollama** running `gemma4:e4b` (or configured local model).
3. **Strict Schema Guarantee**: The LLM output is forced through **Pydantic** validation to guarantee structure: `parties`, `total_amount`, `deadlines`, and `risky_clauses`.
4. **Local History**: Analyses and visual previews are persisted exclusively to a local SQLite database (`papertrail.db`).
5. **Interactive UI**: A modern split-pane React dashboard highlights risky clauses in high-contrast red callouts (`bg-red-50`), alert iconography, and plain-English risk explanations.

---

## ✨ Features

- **Drag-and-Drop Split-Pane Dashboard**: Clean split-screen UI built with `react-dropzone` and Tailwind CSS. Left pane renders visual document previews; right pane delivers risk intelligence.
- **Risky Clause Detection**: Flags predatory traps including:
  - 🔄 **Auto-renewals & multi-year lock-ins**
  - 💸 **Hidden fees & unilateral rate adjustments**
  - 🔒 **Non-refundable deposits & speculative liquidated damages**
- **Terminal Loading Experience**: Features a real-time terminal emulator cycling through `> Running local OCR...`, `> Evaluating risk clauses...`, ensuring full transparency of offline processing steps.
- **Local SQLite History**: Instant access to previous audits with one-click reload and deletion.
- **Instant Demo Mode**: Includes built-in sample commercial lease and SaaS agreement scenarios for testing without immediate PDF uploads.

---

## 🚀 Quick Start Guide

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** & `npm`
- **Ollama** installed on your machine ([download here](https://ollama.ai/download))

---

### Step 1: Start Local Ollama

Pull and serve the target model:

```bash
# Pull the Gemma vision model locally
ollama pull gemma4:e4b

# Start the Ollama local daemon (if not running as a system service)
ollama serve
```

---

### Step 2: Backend Setup (FastAPI + SQLite)

```bash
# Clone the repository
git clone https://github.com/Kousikanhacker/Vaultmind.git
cd Vaultmind

# Install Python backend dependencies
pip install -r requirements.txt

# Run the FastAPI server
python main.py
# Or with uvicorn directly:
# uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI backend will be live at `http://127.0.0.1:8000` with interactive API docs at `http://127.0.0.1:8000/docs`.

---

### Step 3: Frontend Setup (React + Vite + Tailwind)

In a new terminal window:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 📋 API Specification

### `POST /api/upload`
Uploads a document (PDF or image), extracts visual preview, runs local Ollama analysis, enforces schema, and persists history.

**Request**: `multipart/form-data` with `file` field.

**Response**:
```json
{
  "id": 1,
  "filename": "commercial_lease.pdf",
  "preview_image": "data:image/png;base64,...",
  "model_used": "gemma4:e4b",
  "analysis": {
    "parties": [
      "Westlake Commercial Properties Inc.",
      "NextGen AI Labs LLC"
    ],
    "total_amount": "$6,500.00 / month (plus $19,500 deposit)",
    "deadlines": [
      "Security deposit due on or before November 15, 2026",
      "Notice of non-renewal must be served 120 days prior"
    ],
    "risky_clauses": [
      {
        "clause": "Automatic 36-Month Renewal: Lease renews automatically for 3 years at 15% escalation unless 120 days advance notice is given.",
        "risk_level": "Critical",
        "explanation": "Missing the 120-day notice window locks your business into a 3-year term with an automatic 15% rate increase."
      }
    ]
  }
}
```

### `GET /api/history`
Retrieves past processed documents from local SQLite storage.

### `GET /api/history/{id}`
Retrieves full details and preview for a specific historical audit.

### `DELETE /api/history/{id}`
Deletes an audit from local SQLite storage.

### `GET /api/health`
Checks Ollama connection, local GPU/CPU model availability, and database health.

---

## 🎃 Hacktoberfest 2026 Contributions Welcome!

We welcome open-source contributions from the global developer community! 

### 💡 Good First Issues

- [ ] **Multi-Page PDF Support**: Enable visual page navigation for multi-page contracts.
- [ ] **Export to PDF/Markdown**: Add one-click export of the risk assessment report.
- [ ] **Custom Risk Rules**: Allow users to add custom keyword triggers (e.g., non-compete, governing jurisdiction).
- [ ] **Model Switcher UI**: Dropdown in the UI to dynamically switch between local Ollama models (`llama3.2-vision`, `llava`, `minicpm-v`).
- [ ] **Dark Mode**: Add full dark mode toggle support across dashboard cards.

### 🛠️ Contribution Guidelines

1. Fork the repo and create your branch: `git checkout -b feature/amazing-feature`.
2. Commit your changes: `git commit -m "feat: add PDF report export"`.
3. Push to the branch: `git push origin feature/amazing-feature`.
4. Open a Pull Request tagged with `hacktoberfest`.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

