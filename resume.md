# Football Club Management System (FCMS)

## Project Description
The Football Club Management System (FCMS) is a comprehensive, full-stack web application designed for managing football clubs, tracking live match scores, player statistics, team standings, and historic fixtures across top European leagues (Premier League, La Liga, Champions League, Bundesliga, Serie A, and Ligue 1). The platform serves as a centralized hub offering specialized, role-based dashboards for admins, coaches, and players, providing real-time data integration and dynamic visualizations.

## Key Features
* **Real-Time Match Engine:** Live scoreboard and fixture tracking system consuming external REST APIs to deliver minute-by-minute updates and match statuses.
* **Role-Based Access Control (RBAC):** Secure authentication system with customized dashboards tailored to different user roles (Super Admin, Coach, and Player).
* **Automated Data Synchronization:** Backend Node.js scripts that automatically fetch, normalize, and sync massive datasets (team squads, top scorers, standings) from third-party APIs into a PostgreSQL database.
* **Dynamic Analytics Dashboard:** Interactive components for visualizing complex football data, including top scorer leaderboards, assist charts, and dynamically updated league tables.
* **Premium UI/UX Design:** Highly responsive, modern dark-mode interface with dynamic CSS styling, golden accent themes, smooth transitions, and embedded media players.

## Technical Challenges & Solutions
1. **Challenge:** Incomplete/Missing Data from Third-Party APIs
   * **Problem:** Early in the season, external APIs (like Football-Data.org) returned null or empty stats for player assists and goals, breaking the analytics dashboards. Furthermore, team IDs were inconsistent across different API providers (API-Sports vs Football-Data.org).
   * **Solution:** Engineered a robust fallback mechanism using the Admin Dashboard, allowing Super Admins to manually input, override, and manage player statistics via a custom CRUD interface. Created a highly reliable data mapping layer (predefinedTeams.js) to seamlessly translate and normalize varying team IDs across different API providers, ensuring data integrity before saving to the database.

2. **Challenge:** Handling API Rate Limits & Data Freshness
   * **Problem:** Fetching live match data constantly from external APIs would quickly exhaust free-tier API rate limits and slow down the client application.
   * **Solution:** Decoupled the frontend from direct third-party API calls by utilizing a Supabase PostgreSQL database as a centralized caching layer. Implemented server-side Node.js automation scripts (Serverless Functions) to periodically fetch and update data in the background, allowing the frontend to quickly and securely query the optimized Supabase database.

3. **Challenge:** Browser Caching & UI Responsiveness
   * **Problem:** Aggressive browser caching prevented users from seeing updated visual assets (like favicons and logos), and rendering heavy video elements caused layout shifts.
   * **Solution:** Utilized Vite's cache-busting mechanisms and CSS object-fit techniques to dynamically scale and crop embedded media. Ensured perfect UI alignment and instructed users on hard-refresh strategies to bypass aggressive cache retention.

## Technology Stack & Purpose
* **React.js:** Used as the core frontend library to build reusable UI components (navigation bars, live match cards, admin tables) and handle state for dynamic, real-time updates without page reloads.
* **Vite:** Utilized as the modern build tool and development server, replacing Create React App to provide lightning-fast hot module replacement (HMR) and highly optimized production builds.
* **Vanilla CSS:** Chosen over heavy UI frameworks to maintain pixel-perfect control over the custom premium dark-mode design, smooth hover animations, and dynamic golden color themes.
* **Supabase (PostgreSQL):** Served as the primary backend database and authentication provider. Used to securely store persistent data (player stats, team details) and manage Role-Based Access Control (RBAC) via Supabase Auth.
* **Node.js (Serverless Functions):** Used to execute background automation scripts securely on the server-side, fetching massive datasets from external APIs, sanitizing the data, and injecting it into the PostgreSQL database without exposing API keys to the client.
* **Third-Party REST APIs (API-Sports & Football-Data.org):** Integrated as the primary external data sources to retrieve real-world football metrics, live scores, squad lists, and official team logos.
* **Netlify:** Utilized as the hosting platform for seamless CI/CD deployment, hosting the React frontend on global CDNs and running backend Node.js scripts as Serverless Functions.
