# AI-Based Personalized Learning Tutor

A company-level AI-Based Personalized Learning Tutor built as a final-year engineering project. The application utilizes a Retrieval-Augmented Generation (RAG) pipeline to answers questions strictly from student-uploaded PDF, DOCX, and PPTX materials. Additionally, it offers adaptive quiz generation, performance diagnostics (strengths and weaknesses tracking), and AI-generated personalized study recommendations.

## Tech Stack Overview

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Python, FastAPI
- **Database**: PostgreSQL (Relational) & FAISS (Vector Store Index Files)
- **AI Core**: Google Gemini API, LangChain, Sentence Transformers (`all-MiniLM-L6-v2`)
- **Authentication**: JSON Web Token (JWT)
- **Deployment**: Docker, docker-compose, GitHub Actions CI/CD

---

## Repository Structure

- `backend/`: Core FastAPI service, parser utility services, database ORM configurations, RAG handlers, and quiz evaluation logic.
- `frontend/`: Core React Vite client, interface pages (Tutor Chat, Quiz Panel, Progress Charts), and api endpoints wiring.
- `.github/workflows/`: CI/CD scripts for automated linting, building, and deployments.

---

## Setup & Running Locally (Docker-Compose)

### Prerequisites
- Docker & Docker Compose installed.
- A Google Gemini API Key.

### Execution
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd AI-Personalized-Learning-Tutor
   ```

2. Duplicate the environment template and configure your keys:
   ```bash
   cp .env.example .env
   ```
   *Open `.env` and fill in your `GEMINI_API_KEY`.*

3. Spin up the entire Docker stack:
   ```bash
   docker-compose up --build
   ```

4. Access the web applications:
   - **Frontend UI**: `http://localhost:5173`
   - **Backend API Docs (Swagger)**: `http://localhost:8000/docs`

---

## Phase 1 Implementation Structure

The project has been initialized with a modular production-ready skeleton:
- Monorepo structuring with clear microservices.
- Multi-stage Docker files for performant containers.
- Environment variables and setup config placeholders.
- Blank templates prepared for Auth, RAG engine, and Quiz engine.
