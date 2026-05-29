# AI_LOGS.md

# NutriLens AI — AI Development Logs

## Project Goal

Build an AI-powered calorie tracking mobile application that allows users to:

* photograph meals
* receive AI-generated calorie and macro breakdowns
* track nutrition progress
* view analytics and streaks

The project was developed rapidly as an MVP using AI-assisted workflows.

---

# AI Tools Used

## Development Tools

* Replit Agent
* Gemini 2.5 Flash
* ChatGPT
* GitHub

---

# Initial Product Planning

## Prompt

Create an MVP architecture for an AI calorie tracking mobile application similar to Cal AI.

## Outcome

Defined the following MVP scope:

* food image upload
* AI food recognition
* calorie estimation
* macro tracking
* streak system
* analytics dashboard

---

# Architecture Decisions

## Decision 1 — Mobile Framework

### Considered

* Flutter
* React Native

### Final Choice

React Native

### Reason

* faster MVP iteration
* Expo compatibility
* strong mobile UI ecosystem
* easier Replit integration

---

## Decision 2 — AI Provider

### Initial Plan

OpenAI Vision API

### Problem

OpenAI API key and billing requirements slowed MVP setup.

### Final Choice

Gemini 2.5 Flash via Replit integration.

### Reason

* faster integration
* no manual OpenAI billing setup
* supported image understanding
* lower development friction

---

# UI Generation Process

## Prompt

Create a premium dark-mode mobile dashboard for calorie tracking with:

* macro rings
* calorie progress
* floating scan button
* modern health app design

## Initial Result

Generated:

* dashboard card
* macro circles
* navigation bar

## Improvements Added

* neon green highlight colors
* smoother spacing
* floating scan button
* mobile-first layout
* darker premium background

---

# AI Food Recognition Integration

## Initial Prompt

Analyze uploaded food images and estimate:

* calories
* protein
* carbs
* fats

Return structured nutrition information.

---

## Initial Problems

Observed issues:

* inconsistent formatting
* unstructured AI responses
* missing macro values
* hallucinated ingredients

---

# Prompt Engineering Improvements

## Improved Prompt

You are an AI nutrition assistant.

Analyze this food image carefully.

Return:

* food name
* estimated calories
* protein
* carbs
* fats

Only return structured nutrition output.

Avoid hallucinating invisible ingredients.

---

# Gemini Integration Debugging

## Problem

Original backend expected OpenAI SDK.

Error:
OpenAI API integration incompatible with Gemini configuration.

---

## Resolution

Replaced:

* OpenAI-specific API calls
* environment variables
* SDK configuration

Updated backend to use:

* Gemini 2.5 Flash
* Replit managed Gemini integration

---

# Backend Issues Resolved

## Issue 1 — Missing SDK

Error:
@google/genai missing in api-server.

### Fix

Installed Gemini SDK dependencies.

---

## Issue 2 — Invalid JSON Parsing

### Problem

AI responses occasionally returned malformed formatting.

### Fix

Implemented stricter structured prompts and response handling.

---

## Issue 3 — Upload Flow Stability

### Problem

Image uploads occasionally failed during preview-to-analysis flow.

### Fix

Improved upload handling and loading state management.

---

# Mobile UX Improvements

Implemented:

* dark mode interface
* animated calorie dashboard
* macro progress visualization
* floating camera action button
* history navigation
* streak indicators

---

# AI-Assisted UI Iterations

## Prompt

Improve visual hierarchy and spacing for premium mobile app appearance.

## Result

Enhanced:

* typography scale
* card spacing
* dashboard contrast
* navigation clarity

---

# AI-Assisted Development Workflow

Typical workflow:

1. Define feature goal
2. Generate implementation using AI
3. Test locally
4. Debug failures
5. Refine prompts
6. Improve UI polish
7. Repeat iteration

---

# Key Technical Components

## Frontend

* React Native
* Expo

## AI

* Gemini 2.5 Flash

## Deployment

* Replit deployment system

## Version Control

* GitHub

---

# Major Learnings

## 1. Structured prompting improves AI consistency significantly.

## 2. UI polish heavily impacts perceived product quality.

## 3. AI-assisted development accelerates MVP iteration dramatically.

## 4. Debugging AI integrations still requires manual engineering decisions.

---

# Future Improvements

Planned future features:

* barcode scanning
* personalized meal recommendations
* voice nutrition coach
* wearable integrations
* meal history analytics
* AI fitness planning

---

# Final Reflection

NutriLens AI demonstrated how modern AI-assisted development workflows can rapidly produce functional MVP applications.

The project combined:

* AI image understanding
* mobile-first UI design
* nutrition analytics
* iterative prompt engineering

while emphasizing rapid iteration, product polish, and user experience.
