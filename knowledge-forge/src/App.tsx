import { invoke } from "@tauri-apps/api/core";
import { Book, Bot, Database, FileText, Settings, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatPanel } from "./components/chat/ChatPanel";
import { UploadDropzone } from "./components/documents/UploadDropzone";
import { WikiIndex } from "./components/wiki/WikiIndex";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { OllamaSetup } from "./components/setup/OllamaSetup";

const AppContent = () => {
  const { theme, toggleTheme } = useTheme();
  const [ollamaStatus, setOllamaStatus] = useState<string>("Checking...");
  const [ollamaReady, setOllamaReady] = useState(false);

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

  const [activeTab, setActiveTab] = useState<"documents" | "wiki" | "chat">(
    "documents",
  );

  useKeyboardShortcuts({
    onSearch: () => setActiveTab("wiki"),
    onNew: () => setActiveTab("documents"),
  });

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}>
      <OnboardingWizard />
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          padding: "1rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Database size={20} /> KnowledgeForge
        </h2>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            flex: 1,
          }}
        >
          <div
            onClick={() => setActiveTab("documents")}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor:
                activeTab === "documents"
                  ? "rgba(255,255,255,0.1)"
                  : "transparent",
            }}
          >
            <Book size={18} /> Documents
          </div>
          <div
            onClick={() => setActiveTab("wiki")}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor:
                activeTab === "wiki" ? "rgba(255,255,255,0.1)" : "transparent",
            }}
          >
            <FileText size={18} /> Wiki
          </div>
          <div
            onClick={() => setActiveTab("chat")}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor:
                activeTab === "chat" ? "rgba(255,255,255,0.1)" : "transparent",
            }}
          >
            <Bot size={18} /> Chat
          </div>
        </nav>

        <div
          style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: "1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
            }}
          >
            Ollama:{" "}
            <strong
              style={{
                color: ollamaStatus === "Online" ? "lightgreen" : "coral",
              }}
            >
              {ollamaStatus}
            </strong>
          </div>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Settings size={18} /> Settings
          </div>
          <div
            onClick={toggleTheme}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.5rem"
            }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />} {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          backgroundColor: "var(--bg-main)",
          padding: "2rem",
          overflowY: "auto",
        }}
      >
        <h1>Welcome to KnowledgeForge</h1>
        <p>Phase 3: Knowledge Building — Ingest.</p>

        <div style={{ marginTop: "2rem", height: "calc(100vh - 150px)" }}>
          {activeTab === "documents" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {!ollamaReady && (
                <OllamaSetup onReady={() => {
                  setOllamaReady(true);
                  setOllamaStatus("Online");
                }} />
              )}
              {ollamaReady && <UploadDropzone />}
            </div>
          )}
          {activeTab === "wiki" && <WikiIndex />}
          {activeTab === "chat" && <ChatPanel />}
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
