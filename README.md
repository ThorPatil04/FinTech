# FinTech High-Frequency Trading (HFT) Portal

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Zaalima Internship](https://img.shields.io/badge/Internship-Zaalima-success.svg?style=for-the-badge)

This repository contains the front-end source code for the **FinTech HFT Portal**, developed as part of an intensive 2-week internship project at **Zaalima**. 

The portal serves as a professional-grade simulation of a High-Frequency Trading (HFT) dashboard and Secure Banking interface, showcasing real-time data visualization, complex UI state management, and an enterprise-ready design system.

## 🚀 Project Overview

The primary objective of this internship project was to build a robust, scalable, and highly performant web dashboard for financial operations. The system incorporates real-time trading engine mechanics (such as an order book and matching engine UI), secure banking portal features, and high-performance charting.

### Key Features
- **Real-Time Trading Dashboard:** Simulated order book and real-time market data visualization.
- **Interactive Charts:** High-performance financial charts built with Recharts.
- **Secure Banking Portal:** UI for secure transactions and portfolio management.
- **Modern UI/UX:** Responsive, dark-themed, premium design utilizing Lucide React icons and advanced CSS techniques.

## 📅 2-Week Development Timeline

The project was executed in a structured, agile manner over the course of two weeks:

### Week 1: Foundation & Architecture
- **Day 1-2: Requirements & Project Setup**
  - Analyzed the functional requirements for an HFT and banking portal.
  - Bootstrapped the application using React 19 and Vite for optimal build performance.
  - Set up ESLint for code quality and standardized the project directory structure.
- **Day 3-4: UI/UX Design System**
  - Established a cohesive design system (color palettes, typography, spacing).
  - Created reusable baseline components (buttons, inputs, modal overlays).
  - Integrated `lucide-react` for consistent, lightweight iconography.
- **Day 5: Routing & Core Layout**
  - Implemented client-side routing using `react-router-dom`.
  - Built the main navigational framework, including the top bar and sidebar for the dashboard.

### Week 2: Feature Implementation & Polish
- **Day 6-8: Trading Interface & Data Visualization**
  - Developed the `Trading.jsx` core view.
  - Integrated `recharts` to render real-time simulation data for stock prices and trading volumes.
  - Designed the simulated matching engine UI (order books, buy/sell execution components).
- **Day 9: Banking & Portfolio Management**
  - Built secure views for account balances, transaction histories, and asset allocation.
  - Implemented mock data services to simulate complex backend transaction logic (ACID compliance awareness).
- **Day 10: Performance Optimization & Final Review**
  - Conducted performance profiling to ensure smooth UI updates during high-frequency data simulations.
  - Finalized responsive design adjustments for cross-device compatibility.
  - Code clean-up, documentation, and final deployment preparations.

## 🛠️ Technology Stack
- **Frontend Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router v7
- **Charting:** Recharts
- **Icons:** Lucide React
- **Code Quality:** ESLint

## 💻 Running Locally

To run this project on your local machine:

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd fintech-hft-portal
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 👨‍💻 Author

**Saideep Patil**
- Internship Project at Zaalima
