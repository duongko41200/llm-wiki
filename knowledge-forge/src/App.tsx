import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Bot, Book, Settings, Database } from "lucide-react";
import { UploadDropzone } from "./components/documents/UploadDropzone";

const App = () => {
  const [ollamaStatus, setOllamaStatus] = useState<string>("Checking...");

  useEffect(() => {
    const checkOllama = async () => {
      try {
        const isOk = await invoke<boolean>("check_ollama");
        setOllamaStatus(isOk ? "Online" : "Offline / Not Found");
      } catch (err) {
        setOllamaStatus("Error connecting");
      }
    };
    checkOllama();
  }, []);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ 
        width: "250px", 
        backgroundColor: "var(--bg-sidebar)", 
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        padding: "1rem"
      }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Database size={20} /> KnowledgeForge
        </h2>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          <div style={{ padding: "0.5rem", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(255,255,255,0.1)" }}>
            <Book size={18} /> Documents
          </div>
          <div style={{ padding: "0.5rem", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bot size={18} /> Chat
          </div>
        </nav>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            Ollama: <strong style={{ color: ollamaStatus === "Online" ? "lightgreen" : "coral" }}>{ollamaStatus}</strong>
          </div>
          <div style={{ padding: "0.5rem", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Settings size={18} /> Settings
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: "var(--bg-main)", padding: "2rem", overflowY: "auto" }}>
        <h1>Welcome to KnowledgeForge</h1>
        <p>Phase 2: Document Upload & Parse is ready.</p>
        <p>SQLite via tauri-plugin-sql is initialized.</p>
        
        <div style={{ marginTop: '2rem' }}>
          <UploadDropzone />
        </div>
      </div>
    </div>
  );
};

export default App;
