import { invoke } from "@tauri-apps/api/core";
import { Book, Bot, Database, FileText, Settings, Moon, Sun, Calendar, StickyNote, PenTool, Mic, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatPanel } from "./components/chat/ChatPanel";
import { UploadDropzone } from "./components/documents/UploadDropzone";
import { DocumentsPanel } from "./components/documents/DocumentsPanel";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { OllamaSetup } from "./components/setup/OllamaSetup";
import { useAppStore } from "./stores/appStore";
import { StickyNotesBoard } from "./components/notes/StickyNotesBoard";
import { SchedulePanel } from "./components/schedule/SchedulePanel";
import { StudySchedulePopup } from "./components/schedule/StudySchedulePopup";
import { WritingCoach } from "./components/writing/WritingCoach";
import { SpeakingPartner } from "./components/speaking/SpeakingPartner";
import { ExtrasDashboard } from "./components/extras/ExtrasDashboard";

const AppContent = () => {
  const { theme, toggleTheme } = useTheme();
  const [ollamaStatus, setOllamaStatus] = useState<string>("Checking...");
  const [ollamaReady, setOllamaReady] = useState(false);
  const { llmConfig } = useAppStore();

  useEffect(() => {
    const checkOllama = async () => {
      try {
        const isOk = await invoke<boolean>("check_ollama");
        setOllamaStatus(isOk ? "Online" : "Offline / Not Found");
        setOllamaReady(isOk);
      } catch (err) {
        setOllamaStatus("Error connecting");
        setOllamaReady(false);
      }
    };
    checkOllama();
  }, []);

  // If using Gemini, bypass Ollama check for UI
  const isReady = llmConfig.provider === 'gemini'
    ? (llmConfig.api_key ? true : false)
    : ollamaReady;

  const [activeTab, setActiveTab] = useState<"documents" | "wiki" | "chat" | "settings" | "notes" | "schedule" | "writing" | "speaking" | "extras">(
    "schedule",
  );

  useKeyboardShortcuts({
    onSearch: () => setActiveTab("wiki"),
    onNew: () => setActiveTab("documents"),
  });

  const learningItems = [
    { id: "schedule" as const, icon: <Calendar size={18} />, label: "Lịch học" },
    { id: "chat" as const, icon: <Bot size={18} />, label: "Chat & Hỏi đáp" },
    { id: "notes" as const, icon: <StickyNote size={18} />, label: "Sticky Notes" },
    { id: "writing" as const, icon: <PenTool size={18} />, label: "Writing Coach" },
    { id: "speaking" as const, icon: <Mic size={18} />, label: "Speaking Partner" },
    { id: "extras" as const, icon: <Activity size={18} />, label: "Luyện Tập Bổ Sung" },
  ];

  const manageItems = [
    { id: "documents" as const, icon: <Book size={18} />, label: "Upload File" },
    { id: "wiki" as const, icon: <FileText size={18} />, label: "QL Tài liệu" },
    { id: "settings" as const, icon: <Settings size={18} />, label: "Cài đặt LLM" },
  ];

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}>
      <OnboardingWizard />
      <StudySchedulePopup />
      
      {/* Sidebar */}
      <div style={{
        width: "220px",
        backgroundColor: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
      }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Database size={20} /> KnowledgeForge
        </h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, overflowY: "auto" }}>
          
          {/* Học tập Group */}
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem", paddingLeft: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Học Tập
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {learningItems.map(({ id, icon, label }) => (
                <div
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    fontSize: "0.9rem",
                    fontWeight: activeTab === id ? 600 : 400,
                    backgroundColor: activeTab === id ? "rgba(59,130,246,0.15)" : "transparent",
                    color: activeTab === id ? "#3b82f6" : "var(--text-main)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {icon} {label}
                </div>
              ))}
            </div>
          </div>

          {/* Quản lý Group */}
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem", paddingLeft: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quản Lý
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {manageItems.map(({ id, icon, label }) => (
                <div
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    fontSize: "0.9rem",
                    fontWeight: activeTab === id ? 600 : 400,
                    backgroundColor: activeTab === id ? "rgba(59,130,246,0.15)" : "transparent",
                    color: activeTab === id ? "#3b82f6" : "var(--text-main)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {icon} {label}
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          {/* LLM Status indicator */}
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            {llmConfig.provider === 'ollama' ? (
              <>Ollama: <strong style={{ color: ollamaStatus === "Online" ? "lightgreen" : "coral" }}>{ollamaStatus}</strong></>
            ) : (
              <>Gemini: <strong style={{ color: llmConfig.api_key ? "lightgreen" : "coral" }}>{llmConfig.api_key ? "Configured" : "No API Key"}</strong></>
            )}
          </div>
          
          <div
            onClick={toggleTheme}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: "var(--bg-main)", padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        
        <div style={{ flex: 1, height: "100%", minHeight: 0 }}>
          {activeTab === "documents" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '650px', margin: '0 auto' }}>
              <h1 style={{ margin: 0 }}>📤 Tải lên Tài liệu</h1>
              {!isReady && llmConfig.provider === 'ollama' && (
                <OllamaSetup onReady={() => {
                  setOllamaReady(true);
                  setOllamaStatus("Online");
                }} />
              )}
              {(isReady || llmConfig.provider === 'gemini') && <UploadDropzone />}
            </div>
          )}
          
          {activeTab === "wiki" && (
            <div style={{ height: '100%' }}>
              <h1 style={{ margin: '0 0 1.5rem 0' }}>📚 Quản lý Tài liệu</h1>
              <DocumentsPanel />
            </div>
          )}
          
          {activeTab === "chat" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ margin: '0 0 1rem 0', flexShrink: 0 }}>💬 Chat & Hỏi đáp</h1>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ChatPanel />
              </div>
            </div>
          )}
          
          {activeTab === "schedule" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ margin: '0 0 1.5rem 0' }}>📅 Lịch học hôm nay</h1>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                <SchedulePanel />
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ margin: '0 0 1rem 0' }}>📌 Ghi chú</h1>
              <div style={{ flex: 1, minHeight: 0 }}>
                <StickyNotesBoard />
              </div>
            </div>
          )}

          {activeTab === "writing" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ margin: '0 0 1.5rem 0' }}>✍️ Writing Coach</h1>
              <div style={{ flex: 1, minHeight: 0 }}>
                <WritingCoach />
              </div>
            </div>
          )}

          {activeTab === "speaking" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ margin: '0 0 1.5rem 0' }}>🎙️ Speaking Partner</h1>
              <div style={{ flex: 1, minHeight: 0 }}>
                <SpeakingPartner />
              </div>
            </div>
          )}

          {activeTab === "extras" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ margin: '0 0 1.5rem 0' }}>🚀 Luyện tập bổ sung</h1>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ExtrasDashboard />
              </div>
            </div>
          )}
          
          {activeTab === "settings" && (
            <div>
              <SettingsPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
