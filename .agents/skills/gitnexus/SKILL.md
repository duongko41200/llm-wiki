---
name: gitnexus
description: "Coordinator for all GitNexus skills. Use when working with any GitNexus task — exploring code, debugging, impact analysis, refactoring, or running CLI commands. This skill routes you to the correct sub-skill based on the user's intent."
---

# GitNexus Skill Coordinator

GitNexus is a code intelligence MCP server that builds a knowledge graph of your repository. This coordinator helps you pick the right sub-skill for your task.

## Always Start Here

Before using any sub-skill:

1. **Read `gitnexus://repo/{name}/context`** — get a codebase overview and check if the index is fresh
2. **Match your task to a skill** using the table below
3. **Read that skill's SKILL.md** and follow its workflow and checklist

> If the index is stale → run `npx gitnexus analyze` in the terminal first (see `gitnexus-cli`).

---

## Skill Routing Table

| User intent / keywords                                              | Sub-skill to use          |
| ------------------------------------------------------------------- | ------------------------- |
| "How does X work?", "Show me the auth flow", "What's the structure" | `gitnexus-exploring`      |
| "What breaks if I change X?", "Is it safe?", "Blast radius"        | `gitnexus-impact-analysis`|
| "Why is X failing?", "Trace this bug", "Who calls this method?"    | `gitnexus-debugging`      |
| "Rename X", "Extract this", "Split this service", "Move this file" | `gitnexus-refactoring`    |
| "Index this repo", "Generate wiki", "Check status", "Clean index"  | `gitnexus-cli`            |
| "What GitNexus tools are available?", "How do I use GitNexus?"     | `gitnexus-guide`          |

---

## Sub-skill Summaries

### `gitnexus-exploring`
Understand architecture, trace execution flows, explore unfamiliar code.  
**Core tools:** `gitnexus_query`, `gitnexus_context`, process resources.

### `gitnexus-impact-analysis`
Know what breaks before you edit. Map blast radius and assess risk level.  
**Core tools:** `gitnexus_impact`, `gitnexus_detect_changes`.

### `gitnexus-debugging`
Trace bugs and errors to their root cause by following call chains.  
**Core tools:** `gitnexus_query`, `gitnexus_context`, `gitnexus_cypher`.

### `gitnexus-refactoring`
Rename, extract, split, or restructure code safely across the entire codebase.  
**Core tools:** `gitnexus_rename`, `gitnexus_impact`, `gitnexus_detect_changes`.

### `gitnexus-cli`
Run GitNexus CLI commands: `analyze`, `status`, `clean`, `wiki`, `list`.  
**Usage:** `npx gitnexus <command>` — no global install required.

### `gitnexus-guide`
Full reference for all MCP tools, resources, and the graph schema (Nodes, Edges, Cypher).

---

## Quick Tool Reference

| Tool                    | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `gitnexus_query`        | Find execution flows related to a concept        |
| `gitnexus_context`      | 360° view of a symbol (callers, callees, flows)  |
| `gitnexus_impact`       | Blast radius — what depends on a symbol          |
| `gitnexus_detect_changes` | Map current git diff to affected flows         |
| `gitnexus_rename`       | Coordinated multi-file rename with confidence    |
| `gitnexus_cypher`       | Raw graph queries                                |
| `gitnexus_list_repos`   | Discover all indexed repos                       |

## Quick Resource Reference

| Resource                                       | Content                          |
| ---------------------------------------------- | -------------------------------- |
| `gitnexus://repos`                             | All indexed repositories         |
| `gitnexus://repo/{name}/context`               | Stats + staleness check          |
| `gitnexus://repo/{name}/clusters`              | Functional areas with scores     |
| `gitnexus://repo/{name}/cluster/{clusterName}` | Members of a functional area     |
| `gitnexus://repo/{name}/processes`             | All execution flows              |
| `gitnexus://repo/{name}/process/{processName}` | Step-by-step execution trace     |
| `gitnexus://repo/{name}/schema`                | Graph schema for Cypher queries  |
