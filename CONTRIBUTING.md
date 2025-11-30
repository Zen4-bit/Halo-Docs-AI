# Contributing to HALO Docs AI

Thank you for your interest in contributing to HALO Docs AI! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.10
- Git

### Setup Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/halo-docs-ai.git
   cd halo-docs-ai
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/halo-docs-ai.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   cd apps/api && pip install -r requirements.txt
   ```

5. **Start development servers**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/pdf-encryption`)
- `fix/` - Bug fixes (e.g., `fix/upload-timeout`)
- `docs/` - Documentation updates (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/pdf-service`)

### Commit Message Format

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(pdf): add PDF encryption support
fix(api): resolve timeout issue in file upload
docs(readme): update installation instructions
```

## Pull Request Process

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make your changes** and commit following the commit message format

4. **Run tests and linting**:
   ```bash
   npm run lint
   npm run test
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```

6. **Open a Pull Request** with:
   - Clear title describing the change
   - Description of what was changed and why
   - Screenshots (if UI changes)
   - Reference to related issues

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Python

- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions and classes
- Keep functions focused and small

### CSS/Styling

- Use TailwindCSS utility classes
- Follow mobile-first responsive design
- Use CSS variables for theming

### General

- Write self-documenting code
- Keep files under 300 lines when possible
- Add unit tests for new features
- Update documentation for API changes

## Reporting Issues

### Bug Reports

Include:
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case / problem it solves
- Possible implementation approach

---

Thank you for contributing! 🎉
