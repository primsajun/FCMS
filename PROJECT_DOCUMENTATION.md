# FCMS - Football Club Management System

## Project Overview
FCMS is a comprehensive, full-stack web application designed for professional and amateur football clubs. It serves a dual purpose: 
1. **Global Football Hub:** Allows fans to track real-world professional leagues (Premier League, La Liga, Champions League), viewing live scores, fixtures, and standings.
2. **Local Team Management:** Provides a robust internal system for local teams to register, schedule matches against one another, and broadcast their own games in real-time to fans and players.

## Technology Stack
- **Frontend Framework:** React 18 (bootstrapped with Vite for ultra-fast Hot Module Replacement and builds).
- **Styling:** Custom Vanilla CSS utilizing modern design paradigms like Glassmorphism (semi-transparent blurred backgrounds), neon accents, and fully responsive layouts.
- **Icons:** \lucide-react\ for clean, scalable vector iconography.
- **Backend & Database:** Supabase (PostgreSQL). Handles relational data storage, user authentication, and real-time database subscriptions (WebSockets).
- **External API:** API-Sports (Football API) is used to fetch real-world data (professional fixtures, live scores, standings).
- **PWA (Progressive Web App):** Configured with a Web App Manifest and Service Worker, allowing users to install the app directly to their mobile home screens.
- **Routing:** Custom state-based routing architecture (\currentPage\ state in \App.jsx\) for seamless Single Page Application (SPA) transitions without heavy third-party routing libraries.

## Architecture & Authentication
The application uses **Role-Based Access Control (RBAC)** heavily tied to Supabase Auth and a custom \profiles\ table.
- When a user signs up, their profile is assigned a specific role: \player\, \coach\, or \super_admin\.
- **Coaches** must be manually approved by a Super Admin before their account becomes fully active.
- **Players** join specific teams by inputting a unique \Team ID\ provided by their coach during registration.

## Page Hierarchy & Modules

### 1. Public Pages
- **Home:** The landing page. Displays global professional match data (Live Matches, Upcoming Fixtures, League Standings) fetched from API-Sports. It also serves as the gateway for login and registration.
- **Live / Fixtures / Tables / Teams:** Deep-dive pages for public users to explore real-world football statistics.

### 2. Authentication Flow
- **LoginPage:** Validates credentials against Supabase Auth. Upon successful login, fetches the user's \profile\ to determine their routing destination (Admin Dashboard, Coach Hub, or Player Hub).
- **RegisterPage:** A multi-step form. 
  - **Players** enter their physical stats (age, country, position) and a \Team ID\ to join a squad.
  - **Coaches** provide their mobile number and can either register a brand new team (generating a \Team ID\) or join an existing one. Their status defaults to \pending\.

### 3. Player Hub (User Role: \player\)
A personalized dashboard for team members.
- **My Squad:** Displays all approved teammates, their positions, and a special highlight card for the Team Coach (including the coach's mobile contact).
- **Live Match:** If the coach is currently broadcasting a game, players can watch a real-time scoreboard that updates instantly via Supabase WebSockets.
- **Schedule & History:** Views for upcoming local matches and past results.

### 4. Coach Hub (User Role: \coach\)
The control center for team managers.
- **Match Scheduling:** Coaches can create match requests against other registered local teams. Opposing coaches receive these requests and can accept or decline them.
- **Live Match Control Room:** When a scheduled match begins, the coach who created the match gains access to a Live Control Panel. They can start/stop the match timer, increment scores, and log real-time events (Goals, Yellow Cards, Red Cards, Substitutions). Every button press instantly syncs to the database and broadcasts to anyone watching the match.
- **Roster Management:** View the squad and oversee player details.

### 5. Super Admin Dashboard (User Role: \super_admin\)
The overarching system management platform.
- **Coach Approvals:** A table of newly registered coaches. Admins review details (like mobile numbers) and click "Approve" to unlock the coach's account.
- **Team Directory:** A global view of all registered teams in the system, showing coach names, mobile numbers, and team IDs.
- **Global Match Monitoring:** Admins have access to a bird's-eye view of *all* scheduled system matches and can watch multiple live local matches simultaneously on a grid.
- **Audit Logs:** Tracks critical system events (like when matches are created, updated, or deleted) for security and oversight.

## Real-Time Engine (How Live Matches Work)
The standout feature of FCMS is its real-time broadcasting:
1. The **Coach** clicks "Goal" on their control panel.
2. The app sends an \UPDATE\ query to the \local_matches\ table in Supabase.
3. Supabase's **Realtime API** detects the row change.
4. The **Player Hub** and **Admin Dashboard**, which are subscribed to the \postgres_changes\ channel for that specific match ID, instantly receive the new payload.
5. React triggers a state update, changing the score on everyone's screen in milliseconds without needing to refresh the page.
