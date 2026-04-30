# EduHub

EduHub is a role-based school management system built with Next.js and MongoDB. It currently supports three user roles:

- `admin`
- `teacher`
- `parent`

Current major features:

- authentication
- user management
- classroom management
- school year management
- student registration and enrollment
- attendance tracking
- notifications
- parent issue reports
- admin feed/posts

This README is the main project guide for both developers and AI assistants. Future AI sessions should read this file first before making changes.

## Current Stack

- `Next.js 16`
- `React 19`
- `MongoDB` with `Mongoose`
- `JWT` authentication
- `bcryptjs` for password hashing
- Tailwind-related tooling already present in the repo

## Architecture Overview

High-level structure:

- `app/` contains the pages, shared UI, and API routes
- `app/api/` contains backend route handlers
- `app/api/models.js` defines the MongoDB models
- `app/components/` contains shared UI such as the navbar and route protection
- `app/context/` contains client auth state helpers
- `modals/` contains modal-related UI

High-level request flow:

1. User logs in through `/api/auth?action=login`
2. Server validates credentials and issues a JWT cookie
3. Client pages call `/api/auth` to resolve the current user
4. API routes verify the JWT before protected actions
5. MongoDB stores users, students, classrooms, attendance, notifications, reports, and feed data

## User Roles

### Admin

- manage users
- manage classrooms
- manage school years
- manage feed posts
- review and respond to reports

### Teacher

- view assigned classrooms/students
- enroll pending students into assigned classrooms
- submit and edit attendance for assigned classrooms

### Parent

- register children
- view their own children
- receive notifications
- submit issue reports

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`

3. Add the required environment variables:

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-long-random-secret
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.4-mini
```

4. Start the dev server:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Deployment Notes

For Vercel:

- set `MONGODB_URI` in project environment variables
- set `JWT_SECRET` in project environment variables
- set `OPENAI_API_KEY` in project environment variables
- optionally set `OPENAI_MODEL` if you want to override the default model
- do not deploy without `JWT_SECRET`
- the auth cookie is intended to be `httpOnly` and secured in production

Important note:

- `vercel.json` must stay valid; do not add unsupported `build.cache` config

## Current Auth Direction

Current auth approach:

- JWT cookie-based auth
- current-user resolution through `/api/auth`
- client code should not rely on raw `document.cookie` for auth decisions

Auth hardening direction:

- preserve the app flow
- keep auth server-trusted
- do not reintroduce browser-readable auth tokens

## Known Issues

### Security Issues Still Open

- student detail authorization is still too permissive
- classroom detail authorization is still too permissive
- attendance submission still needs stronger classroom/student validation

### Performance Issues Still Open

- initial page load is slowed by auth bootstrap requests
- startup request flow should be reduced where possible
- LCP is currently poor on some pages, especially when the page waits on auth before rendering content

### Code Quality Issues Still Open

- there are existing lint errors and warnings in unrelated admin, teacher, parent, notifications, and profile pages
- some files still need cleanup for React hook dependency issues and page-level loading structure

## AI Working Instructions

Future AI sessions must follow these rules:

1. Read this README first before changing code.
2. Preserve the current app flow unless the user explicitly asks to change the flow.
3. Prioritize security and correctness before feature expansion.
4. Do not reintroduce browser-readable auth tokens.
5. Do not claim LLM or RAG is implemented unless it actually exists in the codebase.
6. Check the known issues and roadmap before starting unrelated work.
7. Prefer fixing current security and performance gaps before adding AI features.
8. If adding AI features later, keep privacy and role-based access in mind.

## AI Step-by-Step Roadmap

### Phase 1: Finish Security Hardening

Objective:

- close the remaining high-risk authorization gaps

What to work on:

- restrict student detail access to the correct owner/role
- restrict classroom detail access to the correct admin/teacher scope
- validate attendance records so students must belong to the submitted classroom
- preserve current user flows while tightening access control

What to avoid:

- do not weaken auth to simplify UI behavior
- do not expose parent contact info to unrelated users

Success criteria:

- unauthorized users cannot access another family's student data
- unauthorized users cannot fetch arbitrary classroom rosters
- teachers cannot submit attendance for students outside their classroom

### Phase 2: Improve Performance

Objective:

- reduce startup delay and improve perceived page load speed

What to work on:

- reduce auth bootstrap blocking on page render
- avoid duplicate startup fetches
- improve navbar and home-page startup behavior
- reduce causes of poor LCP

What to avoid:

- do not break protected-route behavior
- do not remove auth validation just to make the UI faster

Success criteria:

- faster first render
- fewer duplicate initial requests
- better LCP and perceived startup performance

### Phase 3: Add First LLM Feature

Objective:

- introduce a plain LLM-powered assistant inside the existing app

Recommended first feature:

- help-center assistant for parents and admins

What to work on:

- model provider integration
- backend route for model requests
- prompt structure
- basic UI entry point
- safety and rate limiting

What to avoid:

- do not market it as RAG yet
- do not let the assistant answer as if it has grounded school-document knowledge unless it really does

Success criteria:

- users can ask questions and get helpful LLM-generated responses
- responses are controlled, safe, and role-appropriate

### Phase 4: Upgrade to RAG

Objective:

- ground AI answers in school-owned content

Recommended first data sources:

- school handbook
- school policies
- enrollment requirements
- schedules
- FAQ/reference documents

What to work on:

- ingestion pipeline
- chunking strategy
- embeddings
- vector search/retrieval
- answer generation using retrieved context
- source/citation display

What to avoid:

- do not retrieve sensitive operational data without a separate privacy review
- do not mix public school-policy answers with unrestricted private student data

Success criteria:

- answers are based on retrieved documents
- responses can cite their sources
- system behavior is clearly different from plain LLM prompting

## LLM Plan

The first AI milestone should be a standard LLM-powered feature, not a full RAG system.

Recommended first use cases:

- parent help assistant
- admin report summarization
- teacher drafting assistance for communication

Minimum technical pieces needed:

- model API integration
- server route for requests
- prompt templates
- output handling
- safety/rate limiting/logging

Important:

- this phase is `LLM-powered`
- this phase is `not yet RAG`

## RAG Plan

RAG should come after the first LLM phase is stable.

Goal:

- allow the assistant to answer based on actual school documents and approved knowledge sources

Minimum pieces needed:

- document ingestion
- chunking
- embeddings generation
- vector database or retrieval index
- retrieval step before generation
- grounded response generation
- citations/sources in the UI

Recommended order:

1. school docs and policies
2. enrollment guides and FAQs
3. only later consider retrieval over operational database data, and only with privacy review

## Session Continuity Notes

Current project priority:

1. security fixes first
2. performance improvements second
3. LLM integration later
4. RAG after the LLM phase is stable

If a future AI session is unsure what to do next, it should continue from the highest unfinished phase above unless the user gives a new priority.

## Last Completed Work

Use this section as the quick resume point for future AI sessions.

Most recently completed:

- replaced the default README with a project-specific guide for developers and AI
- documented the current architecture, setup, deployment notes, and roadmap
- started auth hardening work to move away from browser-readable auth state
- added the first LLM-powered Help Center assistant entry point

Last known major outcomes:

- `JWT_SECRET` is intended to be mandatory
- auth direction is server-trusted cookie auth
- the first LLM feature targets Help Center before any RAG work
- next major priorities remain security authorization fixes, then performance

How future AI should use this section:

1. Read this section first for the latest completed milestone.
2. Compare it against `Known Issues` and `AI Step-by-Step Roadmap`.
3. Continue from the highest-priority unfinished item unless the user reprioritizes.

## Current Status Summary

Already true:

- project is a working full-stack web app
- roles and core school-management features exist
- auth hardening has started
- README is now intended to act as project memory for AI and developers
- first LLM feature has started in the Help Center

Not yet true:

- medium-level security is not fully achieved yet
- performance issues are not fully resolved
- RAG is not implemented yet
