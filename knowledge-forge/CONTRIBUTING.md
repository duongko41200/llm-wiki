# Contributing to KnowledgeForge

First of all, thank you for your interest in contributing to KnowledgeForge! We love community contributions.

## Architecture

KnowledgeForge is built using the **Tauri** framework:
- **Frontend**: React + TypeScript + Vite. Focuses entirely on the UI and delegates heavy logic to the backend.
- **Backend**: Rust. Handles SQLite database interactions (`tauri-plugin-sql`), HTTP requests to Ollama, file system I/O, and RAG logic.

## How to Contribute

1. **Fork the repo** and create your branch from `main`.
2. **Setup your environment**: You need Node.js and Rust installed.
3. **Make your changes**. If you add a new feature, please try to include error handling using the `AppError` enum in `models.rs`.
4. **Format your code**:
   - Frontend: `npm run lint` / Prettier.
   - Backend: `cargo fmt` and `cargo clippy`.
5. **Open a PR** detailing the changes you made and the problem they solve.

## Reporting Bugs

Please use the GitHub Issue Tracker to report bugs. Provide as much context as possible, including:
- OS Version
- Ollama Version
- Error Logs (from the console)
