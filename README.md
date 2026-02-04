# Agentic Surveillance Research Frontend

## Overview

This application acts as a specialized navigation tool designed to help understand and visualize surveillance levels in a city.

Think of it like a standard map application, but instead of just showing you the fastest way to get somewhere, it helps identify **"safe routes"**—paths that minimize exposure to public surveillance cameras.

**Key Features:**

- **City Scanning:** Select a city to scan for known surveillance camera locations using public data.
- **Route Planning:** Choose a starting point and a destination. The app calculates a path that avoids cameras where possible.
- **Visual Dashboard:** See the results on an interactive map. Cameras are marked, "risky" areas are highlighted, and safe paths are clearly drawn.
- **Real-time Monitoring:** Watch the system as it gathers data and processes your request in real-time.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed (v18 or higher is recommended).
- **npm**: The Node Package Manager is required to install dependencies.

### Installation

1.  Clone this repository to your local machine.

```bash
git clone git@github.com:jethronap/UNDO-agentic-ui.git
```

2.  Navigate to the project folder.

```bash
cd UNDO-agentic-ui/
```

3.  Install the necessary dependencies:

```bash
npm install
```

### Running the Application

To start the local development server:

```bash
npm run dev
```

Once started, open your browser and navigate to the URL provided in the terminal (usually `http://localhost:5173`).

## Development Workflow

We use a suite of tools to ensure code quality and consistency.

### Linting & Formatting

- **ESLint:** We use ESLint to catch errors and enforce coding standards.
  - To run the linter manually: `npm run lint`
- **Prettier:** We use Prettier for automatic code formatting.

### Git Hooks (Husky)

This project is configured with **Husky** to handle Git hooks. This helps automate quality checks before code is committed.

- **Pre-commit Hook:** When you run `git commit`, a tool called `lint-staged` is automatically triggered.
  - It checks **only the files you are about to commit**.
  - It automatically runs **ESLint** (to fix simple errors) and **Prettier** (to format code).
  - If there are errors that cannot be fixed automatically, the commit will fail, and you will need to fix them before trying again.

### Building for Production

To create a production-ready build of the application:

```bash
npm run build
```

This will compile the TypeScript code and assets into the `dist/` directory, ready for deployment.
