<div align="center">

# 🌟 HALO Docs AI

### Next-Generation AI-Powered Document Processing Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python)](https://python.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Live Demo](#) • [Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation)

</div>

---

## 📋 Overview

**HALO Docs AI** is an enterprise-grade document processing platform that combines cutting-edge AI capabilities with powerful PDF and media tools. Built with a modern monorepo architecture, it offers a seamless experience for document manipulation, AI-powered analysis, and media conversion.

<div align="center">

![HALO Docs AI Screenshot](https://placehold.co/1200x600/1e293b/ffffff?text=HALO+Docs+AI+Screenshot)

</div>

---

## ✨ Features

### 🔧 PDF Tools
| Tool | Description |
|------|-------------|
| **Merge PDF** | Combine multiple PDFs with drag-and-drop reordering |
| **Split PDF** | Split by pages, ranges, or intervals |
| **Compress PDF** | Reduce file size with quality control |
| **Add Page Numbers** | Customizable position, format, and styling |
| **Add Watermark** | Text watermarks with opacity and rotation |
| **Rotate PDF** | Rotate pages by 90°, 180°, or 270° |
| **Repair PDF** | Fix corrupted PDF files |

### 🤖 AI-Powered Tools
| Tool | Description |
|------|-------------|
| **AI Summarizer** | Intelligent document summarization |
| **AI Translator** | Multi-language translation |
| **AI Rewriter** | Content rewriting with tone control |
| **AI Insights** | Extract key insights from documents |
| **AI Chat** | Conversational AI assistant |
| **Image Generation** | AI-powered image creation |

### 🎬 Media Conversion
| Tool | Description |
|------|-------------|
| **Video Downloader** | Download videos from various platforms |
| **Image Compressor** | Optimize images without quality loss |
| **GIF Compressor** | Reduce GIF file sizes |
| **Image Cropper** | Precision image cropping |
| **Format Converter** | Convert between image formats |

---

## 🏗️ Architecture

```
halo-docs-ai/
├── apps/
│   ├── api/                    # FastAPI Backend
│   │   ├── routers/            # API endpoints
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utilities
│   │   └── main.py             # Application entry
│   │
│   └── web/                    # Next.js Frontend
│       ├── app/                # App router pages
│       ├── components/         # React components
│       ├── lib/                # Utilities & hooks
│       └── services/           # API clients
│
├── docker/                     # Docker configurations
├── scripts/                    # Automation scripts
├── cloud-run/                  # GCP Cloud Run configs
└── docker-compose.yml          # Container orchestration
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: TailwindCSS 3.3
- **Animation**: Framer Motion
- **3D Graphics**: Three.js, React Three Fiber
- **State Management**: Zustand, React Query

### Backend
- **Framework**: FastAPI 0.104
- **Language**: Python 3.12
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Task Queue**: Celery
- **AI**: Vertex AI (Gemini)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Cloud**: Google Cloud Run ready
- **CI/CD**: GitHub Actions compatible

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **Python** >= 3.10
- **Docker** (optional, for containerized setup)
- **PostgreSQL** (optional, SQLite available)

### Quick Start

#### Option 1: One-Click Setup (Windows)

```bash
# Clone the repository
git clone https://github.com/yourusername/halo-docs-ai.git
cd halo-docs-ai

# Run the startup script
.\START-HALO.bat
```

#### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/halo-docs-ai.git
cd halo-docs-ai

# Install frontend dependencies
npm install

# Setup backend
cd apps/api
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Start services
cd ../..
npm run dev
```

#### Option 3: Docker Setup

```bash
# Clone and start with Docker
git clone https://github.com/yourusername/halo-docs-ai.git
cd halo-docs-ai

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# AI Configuration (Required for AI features)
VERTEX_AI_API_KEY=your_api_key_here
VERTEX_AI_ENDPOINT=https://aiplatform.googleapis.com/v1/publishers/google/models
VERTEX_AI_GEMINI_MODEL=gemini-2.0-flash-exp

# Database (Optional - defaults to SQLite)
DATABASE_URL=postgresql://user:password@localhost:5432/halodocs

# Redis (Optional - for task queue)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Frontend
NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1
```

See [.env.example](.env.example) for all available options.

---

## 📖 Documentation

### API Endpoints

Once running, access the API documentation at:
- **Swagger UI**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

### Development Commands

```bash
# Start development servers
npm run dev              # Both frontend and backend
npm run dev:web          # Frontend only
npm run dev:api          # Backend only

# Build for production
npm run build

# Linting & Formatting
npm run lint
npm run format

# Testing
npm run test
npm run test:coverage

# Docker commands
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
npm run docker:clean     # Full cleanup
```

---

## 🐳 Docker Deployment

### Production Build

```bash
# Build and start production containers
docker compose -f docker-compose.yml up --build -d

# Check service health
docker compose ps
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js application |
| Backend | 8080 | FastAPI server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & Queue |

---

## ☁️ Cloud Deployment

### Google Cloud Run

```bash
# Deploy to Cloud Run
cd cloud-run
./build-and-deploy.sh
```

### Vercel (Frontend)

```bash
# Deploy frontend to Vercel
vercel --prod
```

### Railway / Render

The project includes configuration files for easy deployment to Railway and Render platforms.

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python API Framework
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Google Vertex AI](https://cloud.google.com/vertex-ai) - AI Services

---

<div align="center">

**Built with ❤️ by [Your Name](https://github.com/yourusername)**

[⬆ Back to Top](#-halo-docs-ai)

</div>
