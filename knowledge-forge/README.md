# KnowledgeForge 🚀

KnowledgeForge is a local, privacy-first desktop application that allows you to ingest documents and chat with them using the power of RAG (Retrieval-Augmented Generation) and local LLMs via Ollama.

## Features ✨

- **Local Processing**: No data is sent to the cloud. All inference runs locally using Ollama.
- **RAG Capability**: Ingest PDFs, Markdown, and Text files. The system builds a local wiki index and searches it to provide accurate answers.
- **Multi-Mode Chat**:
  - `General Q&A`: Ask anything about your ingested documents.
  - `Compare`: Compare two or more concepts or entities found in your documents.
  - `Quiz`: Automatically generate quizzes from your data.
- **Auto Update**: Built-in auto-updater so you never miss a feature.
- **Dark/Light Mode**: Beautiful UI that respects your system theme.

## Prerequisites 🛠️

1. **Ollama**: You must have [Ollama](https://ollama.com/) installed and running locally.
2. **Models**: We recommend pulling the following models:
   ```bash
   ollama run llama3.1:8b
   ollama run qwen2.5:7b
   ```

## Installation 📦

Go to the [Releases](https://github.com/YOUR_USERNAME/knowledge-forge/releases) page and download the installer for your operating system:
- Windows: `.msi` or `.exe`
- macOS: `.dmg`
- Linux: `.deb` or `.AppImage`

## Development 🧑‍💻

To run the application locally in development mode:

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run tauri dev`

## License 📄

MIT License. See LICENSE file for details.
