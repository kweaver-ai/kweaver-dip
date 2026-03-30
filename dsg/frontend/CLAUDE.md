# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AnyFabric** is a React-based enterprise data management and governance platform built with TypeScript, featuring micro-frontend architecture using qiankun. It serves as a comprehensive front-end for data assets, business auditing, and metadata management.

## Technology Stack

-   **Frontend**: React 18.2.0 + TypeScript 5.1.6
-   **Build Systems**: Vite 7.2.4 (primary) + Webpack 5.64.4 (legacy)
-   **Micro-frontend**: Qiankun 2.10.16
-   **State Management**: Redux 4.2.1
-   **UI Framework**: Ant Design 4.24.7 + Ant Design Pro Components 2.6.13
-   **Routing**: React Router DOM 6.3.0
-   **Data Visualization**: @antv/g2plot, @antv/g6, @antv/s2, @antv/x6
-   **Code Editors**: Monaco Editor, CodeMirror

## Multi-Page Application Setup

The build system supports multiple entry points for different micro-applications:

-   Main application (`index`)
-   Data Operation Audit page
-   Download page
-   DMD Audit page
-   Plugin Framework page

## Code Quality Tools

-   **ESLint**: Airbnb config + TypeScript rules
-   **Prettier**: Code formatting
-   **Stylelint**: CSS/Less linting
-   **Husky**: Git hooks for pre-commit checks

## Other

-   Reply in Chinese
