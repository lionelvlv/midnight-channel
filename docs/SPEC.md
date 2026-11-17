# Night Channel — Technical Specification & Architecture

## Overview
A retro-styled, atmospheric web application providing curated ambient/lo-fi audio streams and interactive chat environments.

## Architecture
- **Frontend:** React + Vite (or modern JS SPA) with responsive UI.
- **Audio:** HTML5 Audio API with custom streaming controls and visualizers.
- **Backend / API:** Node.js / Express backend (`api/`) handling track lists, metadata, and optional chat/presence.
- **Hosting:** Vercel deployment with serverless API functions.

## Directory Structure
- `src/` — React frontend components, audio manager, and views.
- `api/` — Serverless backend endpoints.
- `public/` — Static assets, audio samples, background imagery.
- `docs/` — Technical specs and architecture notes.
- `tests/` — Component and audio hook test suite.
