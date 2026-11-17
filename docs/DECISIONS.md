# Night Channel — Decision Log

This log documents the "why" behind key architectural and implementation choices for Night Channel.

## 1. Core Architecture

### 1.1 Backend: Vercel Serverless
*   **Decision:** Serverless API functions over a persistent Node/Express process.
*   **Rationale:** Perfect for static sites with minimal metadata/API needs; cost-effective (free tier).
*   **Tradeoff:** Cold starts for API calls; ephemeral state (must rely on external DBs like Firebase or local JSON).

### 1.2 Audio Management
*   **Decision:** HTML5 Audio API.
*   **Rationale:** Native browser support, low latency, and sufficient for streaming-focused ambient audio without complex audio-graph requirements (like Web Audio API).

## 2. UI/UX
*   **Decision:** Retro aesthetic.
*   **Tradeoff:** Requires custom CSS to mimic legacy UI; forces a more rigid, "static" layout that may not be as flexible as modern responsive frameworks.
