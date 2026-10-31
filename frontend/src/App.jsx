import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ShieldCheck,
  Lock,
  UploadCloud,
  FileText,
  AlertTriangle,
  AlertOctagon,
  Users,
  DollarSign,
  Calendar,
  Terminal,
  RefreshCw,
  Clock,
  History,
  X,
  CheckCircle,
  Eye,
  FileCheck2,
  Trash2,
  ChevronRight,
  Cpu,
  Info
} from 'lucide-react';

const API_BASE = '/api';

const LOADING_STEPS = [
  "> Initializing offline isolation boundary...",
  "> Extracting first page via pdfplumber...",
  "> Generating high-density raster frame...",
  "> Running local OCR & visual tensor alignment...",
  "> Passing frame to local Ollama runtime [model: gemma4:e4b]...",
  "> Evaluating risk clauses (hidden fees, lost deposits, auto-renewals)...",
  "> Extracting contracting parties & financial obligations...",
  "> Enforcing Pydantic strict JSON schema...",
  "> Committing record to local SQLite history...",
  "> Finalizing legal risk assessment..."
];

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [noticeMsg, setNoticeMsg] = useState(null);

  // Terminal animation state
  const [terminalIndex, setTerminalIndex] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState([]);

  // History state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  // Fetch history on load
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (e) {
      console.warn("Failed to fetch history:", e);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Terminal animation cycling during analysis
  useEffect(() => {
    let interval = null;
    if (isAnalyzing) {
      setTerminalLogs([LOADING_STEPS[0]]);
      setTerminalIndex(0);
      let step = 0;
      interval = setInterval(() => {
        step = (step + 1) % LOADING_STEPS.length;
        setTerminalIndex(step);
        setTerminalLogs(prev => [...prev.slice(-6), LOADING_STEPS[step]]);
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing]);

  // Handle file drop
  const onDrop = useCallback(acceptedFiles => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const selected = acceptedFiles[0];
    setFile(selected);
    setErrorMsg(null);
    setNoticeMsg(null);
    setAnalysisData(null);
    setSelectedHistoryId(null);

    // If it's an image, create a local preview immediately
    if (selected.type.startsWith('image/')) {
      const objUrl = URL.createObjectURL(selected);
      setPreviewUrl(objUrl);
    } else {
      // For PDF, preview will be provided by backend or placeholder icon
      setPreviewUrl(null);
    }

    // Auto-analyze on drop
    handleUpload(selected);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: false
  });

  // Upload and analyze file
  const handleUpload = async (fileToUpload = file) => {
    if (!fileToUpload) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setNoticeMsg(null);

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(errDetail.detail || `Server returned error ${response.status}`);
      }

      const result = await response.json();
      setAnalysisData(result.analysis);
      if (result.preview_image) {
        setPreviewUrl(result.preview_image);
      }
      if (result.offline_notice) {
        setNoticeMsg(result.offline_notice);
      }
      loadHistory();
    } catch (err) {
      console.error("Analysis error:", err);
      setErrorMsg(err.message || "Failed to analyze document.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load a document from SQLite history
  const handleSelectHistoryItem = async (docId) => {
    try {
      setIsAnalyzing(true);
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/history/${docId}`);
      if (!res.ok) throw new Error("Could not fetch document details");
      const doc = await res.json();
      setFile({ name: doc.filename, size: doc.file_size });
      setPreviewUrl(doc.preview_image);
      setAnalysisData(doc.analysis);
      setSelectedHistoryId(doc.id);
      setNoticeMsg(`Loaded historical record #${doc.id} processed on ${new Date(doc.upload_time).toLocaleString()}`);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setIsAnalyzing(false);
      setHistoryOpen(false);
    }
  };

  // Delete document from history
  const handleDeleteHistory = async (e, docId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/history/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistoryList(prev => prev.filter(item => item.id !== docId));
        if (selectedHistoryId === docId) {
          handleReset();
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setAnalysisData(null);
    setErrorMsg(null);
    setNoticeMsg(null);
    setSelectedHistoryId(null);
  };

  // Load sample demo document
  const handleLoadSample = (sampleType) => {
    let mockAnalysis;
    let mockFileName;
    if (sampleType === 'lease') {
      mockFileName = 'Commercial_Lease_Agreement_2026.pdf';
      mockAnalysis = {
        parties: ["Westlake Commercial Properties Inc.", "NextGen AI Labs LLC", "Citywide Escrow Services"],
        total_amount: "$6,500.00 / month (plus $19,500 triple-net deposit)",
        deadlines: [
          "Security deposit due on or before November 15, 2026",
          "Written notice of non-renewal must be served exactly 120 days prior to expiry",
          "Annual maintenance audit reconciliation within 30 days of fiscal year end"
        ],
        risky_clauses: [
          {
            clause: "Automatic 36-Month Renewal: Unless Tenant delivers formal certified mail notice 120 days in advance, this lease automatically renews for an additional 3 years at a mandatory 15% rate escalation.",
            risk_level: "Critical",
            explanation: "Severe auto-renewal trap: missing the 120-day notice window locks you into a mandatory 3-year commitment with an unavoidable 15% price spike."
          },
          {
            clause: "Non-Refundable Security Deposit Forfeiture: Landlord reserves sole discretion to retain 100% of the $19,500 deposit to cover speculative future repainting without requiring itemized receipts.",
            risk_level: "High",
            explanation: "Lost deposit risk: allows the landlord to arbitrarily seize nearly $20,000 without having to prove actual damages or provide contractor invoices."
          },
          {
            clause: "Unilateral Building Surcharge Assessment: Landlord may levy unannounced operational assessments for common area HVAC replacements at any time.",
            risk_level: "Medium",
            explanation: "Hidden fees: you may be hit with unpredictable capital expenditure charges that are not capped."
          }
        ]
      };
    } else {
      mockFileName = 'Master_SaaS_Service_Agreement.pdf';
      mockAnalysis = {
        parties: ["CloudScale Enterprise Systems", "Apex Global Media Ltd."],
        total_amount: "$48,000.00 Annual Subscription (Paid Upfront)",
        deadlines: [
          "Full balance due net 10 days from invoice date",
          "Service SLA claims must be filed within 48 hours of outage occurrence"
        ],
        risky_clauses: [
          {
            clause: "Unilateral Data Deletion: Provider reserves the right to irrevocably purge all customer databases upon 24 hours of payment lapse without offering data export access.",
            risk_level: "Critical",
            explanation: "Catastrophic data loss risk: if an invoice gets delayed by accounting by just 1 day, your company's entire data warehouse could be permanently erased."
          },
          {
            clause: "Over-Usage Penalties: Any API calls exceeding baseline quota are automatically billed at 10x standard rate with no prior throttling warning.",
            risk_level: "High",
            explanation: "Hidden fees: sudden traffic spikes could result in massive unexpected invoices without safeguards."
          }
        ]
      };
    }

    setFile({ name: mockFileName, size: 245000 });
    setPreviewUrl(null);
    setAnalysisData(mockAnalysis);
    setNoticeMsg("Demonstration document loaded offline. Click 'Upload Another' or drop a PDF/image to test your local files.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">PaperTrail</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                  VaultMind
                </span>
              </div>
              <p className="text-xs text-slate-500">100% Offline AI Document Intelligence</p>
            </div>
          </div>

          {/* Privacy & Air-Gap Badge */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Air-Gapped • No External APIs</span>
            </div>

            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>Engine: <strong className="font-semibold text-slate-900">gemma4:e4b</strong></span>
            </div>

            {/* History Button */}
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="View SQLite Document History"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>History ({historyList.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notice Banner */}
      {noticeMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <Info className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="truncate">{noticeMsg}</span>
          </div>
          <button onClick={() => setNoticeMsg(null)} className="text-emerald-700 hover:text-emerald-900 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Split-Pane Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT PANE: UPLOAD & PREVIEW (5 cols) ================= */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Document Input</span>
              </h2>
              {file && (
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-red-600 flex items-center space-x-1 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Dropzone Zone or Preview */}
            {!file ? (
              <div
                {...getRootProps()}
                className={`flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[340px] ${
                  isDragActive
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 mb-4 rounded-2xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {isDragActive ? 'Drop your document here...' : 'Drag & drop legal or financial document'}
                </p>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs">
                  Supports PDF (first page auto-rasterized via pdfplumber), PNG, JPG, or WEBP.
                </p>
                <div className="mt-5 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Browse Local File</span>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200 w-full flex flex-col items-center">
                  <p className="text-xs text-slate-400 mb-2">Want a quick test?</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSample('lease');
                      }}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      Sample Commercial Lease
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSample('saas');
                      }}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      Sample SaaS Terms
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4">
                {/* File Metadata Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Local Document'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Document Preview Box */}
                <div className="flex-1 min-h-[380px] max-h-[550px] bg-slate-900 rounded-xl overflow-hidden border border-slate-300 relative flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Document Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                      <p className="text-xs font-medium text-slate-300">PDF Document Loaded</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                        First page will be extracted and converted to image for vision analysis.
                      </p>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-md text-[10px] text-white font-mono flex items-center space-x-1.5">
                    <Eye className="w-3 h-3 text-emerald-400" />
                    <span>Visual Page 1 Preview</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    {...getRootProps()}
                    className="text-xs text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
                  >
                    <input {...getInputProps()} />
                    Select a different file
                  </button>
                  <button
                    onClick={() => handleUpload(file)}
                    disabled={isAnalyzing}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-medium flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= RIGHT PANE: ANALYSIS RESULTS / TERMINAL LOADING (7 cols) ================= */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
            
            {/* Case 1: Terminal-Style Loading Animation */}
            {isAnalyzing ? (
              <div className="flex-1 flex flex-col justify-center my-auto py-8">
                <div className="w-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
                  {/* Terminal Header */}
                  <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                      <span className="text-slate-400 text-[11px] ml-2">PaperTrail Local Sandbox • ollama-gemma4:e4b</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      AIR-GAPPED OFFLINE
                    </span>
                  </div>

                  {/* Terminal Content */}
                  <div className="p-5 space-y-2.5 text-slate-300 min-h-[220px]">
                    <div className="text-slate-400">=== INITIATING PRIVACY-FIRST DOCUMENT PIPELINE ===</div>
                    {terminalLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start space-x-2 ${
                          idx === terminalLogs.length - 1 ? 'text-emerald-400 font-bold' : 'text-slate-300 opacity-80'
                        }`}
                      >
                        <span className="text-emerald-500 select-none">$</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    <div className="flex items-center space-x-1 text-emerald-400 pt-2">
                      <span className="animate-pulse">_</span>
                      <span className="text-[11px] text-slate-400 italic">Executing locally on your CPU/GPU hardware</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm font-medium text-slate-800">Analyzing Document Locally</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Zero bytes leave this machine. Processed locally via Ollama with strict JSON validation.
                  </p>
                </div>
              </div>
            ) : analysisData ? (
              /* Case 2: Display Extracted JSON Data as Clean Tailwind Cards */
              <div className="space-y-6">
                
                {/* Header Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Document Risk Assessment</h3>
                    <p className="text-xs text-slate-500">
                      Extracted via local Ollama Gemma 4 vision model & validated with Pydantic
                    </p>
                  </div>
                  {analysisData.risky_clauses && (
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{analysisData.risky_clauses.length} Risky Clauses Flagged</span>
                    </div>
                  )}
                </div>

                {/* Card 1: Contracting Parties Involved */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 mb-2.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Parties Involved</span>
                  </div>
                  {analysisData.parties && analysisData.parties.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analysisData.parties.map((party, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                        >
                          {party}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific parties detected in extract.</p>
                  )}
                </div>

                {/* Card 2: Financial Amounts */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Financial Amounts & Commitments</span>
                  </div>
                  <p className="text-base font-bold text-slate-900">
                    {analysisData.total_amount || "N/A"}
                  </p>
                </div>

                {/* Card 3: Deadlines & Critical Timelines */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 mb-2.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Deadlines & Milestones</span>
                  </div>
                  {analysisData.deadlines && analysisData.deadlines.length > 0 ? (
                    <ul className="space-y-2">
                      {analysisData.deadlines.map((deadline, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{deadline}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific deadlines identified.</p>
                  )}
                </div>

                {/* Card 4: Flagged Risky Clauses (CRITICAL SPECIFICATION) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
                      <span>Flagged Risky Clauses & Hidden Traps</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Identified for: hidden fees, lost deposits, auto-renewals
                    </span>
                  </div>

                  {analysisData.risky_clauses && analysisData.risky_clauses.length > 0 ? (
                    <div className="space-y-3">
                      {analysisData.risky_clauses.map((item, idx) => {
                        const isCritical = (item.risk_level || '').toLowerCase().includes('crit') || (item.risk_level || '').toLowerCase().includes('high');
                        return (
                          /* Highlighted with red background (bg-red-50), red borders, and alert icons from lucide-react */
                          <div
                            key={idx}
                            className="bg-red-50 border border-red-200 rounded-xl p-4 transition-all shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <span className="text-xs font-bold text-red-900">
                                  Risky Clause #{idx + 1}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                  isCritical
                                    ? 'bg-red-200 text-red-900 border-red-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                              >
                                {item.risk_level || 'Flagged Risk'}
                              </span>
                            </div>

                            {/* The Contract Clause */}
                            <div className="p-2.5 rounded-lg bg-white/80 border border-red-100 mb-2.5">
                              <p className="text-xs font-mono text-slate-800 leading-relaxed italic">
                                "{item.clause}"
                              </p>
                            </div>

                            {/* Plain English Explanation */}
                            <div className="flex items-start space-x-2 text-xs text-red-800">
                              <strong className="font-semibold text-red-900 flex-shrink-0">Risk Explanation:</strong>
                              <p className="text-xs text-red-950 leading-relaxed">
                                {item.explanation}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-emerald-900">Clean Document</p>
                      <p className="text-[11px] text-emerald-700">
                        No predatory clauses or suspicious terms detected in this extract.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* Case 3: Empty State Before Upload */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">No Document Analyzed Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
                  Drop a contract, agreement, or invoice on the left pane to extract parties, finances, deadlines, and flag risky clauses.
                </p>

                <div className="grid grid-cols-2 gap-3 max-w-md w-full text-left">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-800">100% Offline</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Runs on your local Ollama instance with zero external leaks.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-800">Risk Radar</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Detects hidden fees, lost deposits, and sneaky auto-renewals.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="font-semibold">Analysis Failed: </strong>
                  <span>{errorMsg}</span>
                </div>
                <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </section>

      </main>

      {/* History Slide-Over Drawer */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col border-l border-slate-200 z-50">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Local SQLite History</h3>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {historyList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No documents stored in history yet.</p>
                </div>
              ) : (
                historyList.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex items-start justify-between group ${
                      selectedHistoryId === item.id
                        ? 'border-emerald-500 bg-emerald-50/40'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="overflow-hidden pr-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.filename}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Amount: <strong className="text-slate-700">{item.total_amount || 'N/A'}</strong>
                      </p>
                      <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400">
                        <span>{new Date(item.upload_time).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-red-600 font-medium">
                          {(item.risky_clauses || []).length} risks flagged
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleDeleteHistory(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
              Stored locally in SQLite database file (<code className="font-mono text-slate-700">papertrail.db</code>)
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <span>PaperTrail / VaultMind • 100% Offline AI Document Risk Intelligence • Hacktoberfest Ready</span>
      </footer>
    </div>
  );
}
