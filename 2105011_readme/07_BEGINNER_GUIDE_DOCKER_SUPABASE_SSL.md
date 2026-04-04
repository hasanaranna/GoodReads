# Beginner Guide: Docker Compose, Supabase, SSL (No Prior Knowledge Needed)

This guide is written for someone who knows only basic programming.

No fancy words.
No overcomplication.

If you read this once slowly, you will stop feeling lost.

---

## 1. First: You Are Not Dumb

You are doing something hard.

Full-stack setup has many moving parts.

Everyone gets confused at first.

What matters is:
- You asked questions.
- You kept trying.
- You asked for clarity.

That is exactly how real engineers learn.

---

## 2. What You Are Building (In Simple Terms)

Your app has three parts:

1. Frontend
- The website UI you open in browser.
- Runs on port 5173.

2. Backend
- The server logic.
- Talks to Google Books API.
- Talks to database.
- Runs on port 8080.

3. Database
- Stores users/books/reviews.
- Can be local PostgreSQL in Docker or remote Supabase PostgreSQL.

If backend fails, frontend says:
"cannot connect to server"

Why?
Because frontend asks backend for data.
If backend is down, data cannot be fetched.

---

## 3. What Is Docker?

Docker is like a mini-computer box for each service.

Think:
- One box for frontend.
- One box for backend.
- One box for database.

Each box has its own environment.

Benefits:
- Same setup on every machine.
- Fewer "works on my machine" issues.

---

## 4. What Is Docker Compose?

Docker Compose is a manager for multiple Docker boxes.

Without Compose, you manually run each container.
With Compose, one file describes all services.

That file is usually:
- docker-compose.yml

Compose reads it and starts everything together.

---

## 5. What Is `docker-compose up`?

`docker-compose up` means:
- Create/start all services from compose file.
- Keep logs attached in terminal (by default).

Common forms:

1. `docker-compose up`
- Start and attach logs.
- Terminal is occupied.

2. `docker-compose up --build`
- Rebuild images first, then run.
- Use after changing Dockerfile or dependencies.

3. `docker-compose up -d`
- Run in detached mode (background).
- Terminal is free.

4. `docker-compose up -d --build`
- Rebuild and run in background.

---

## 6. What Is `docker-compose down`?

`docker-compose down` means:
- Stop containers.
- Remove containers.
- Remove network created by compose.

Usually this does NOT remove your DB data volume unless you add `-v`.

Important:

- `docker-compose down`
  - Safe for normal stop.

- `docker-compose down -v`
  - DANGER for local DB data.
  - Deletes named volumes.
  - You lose local DB data.

---

## 7. Most Useful Compose Commands You Need

Use these daily:

1. Start in background
`docker-compose up -d`

2. Start and rebuild
`docker-compose up -d --build`

3. Stop
`docker-compose down`

4. Status
`docker-compose ps`

5. Logs for all
`docker-compose logs -f`

6. Logs for backend only
`docker-compose logs -f backend`

7. Execute command inside backend container
`docker-compose exec backend sh`

---

## 8. Why Your Frontend Said "Cannot Connect to Server"

In your case, frontend was up.
Backend crashed during startup.

Crash reason was database connection failure.

When backend crashes:
- Port 8080 may look exposed by container config.
- But app process is not serving API.
- Browser gets fetch error.

So frontend error was a symptom.
Root cause was backend DB connectivity.

---

## 9. What Is Supabase (Simple Version)

Supabase is a cloud backend platform.

In your context, you mainly use:
- Hosted PostgreSQL database.

So instead of local db container,
you can connect backend to remote Supabase PostgreSQL.

That is why you had variables like:
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD
- DATABASE_URL

---

## 10. Supabase URL vs DB Connection (Important)

Two different things:

1. `SUPABASE_URL`
- Used by Supabase client SDK (HTTP API usage).
- Not automatically used by pg DB driver.

2. `DATABASE_URL` or DB_* values
- Used by PostgreSQL driver (`pg` package).
- This is what backend uses to connect to database.

So if backend uses `pg`, then DB variables are what matter for DB connect.

---

## 11. What Is SSL?

SSL means encrypted connection.

If SSL is on:
- Data between backend and DB is encrypted.

If SSL is off:
- Data is plain text over that network path.

For local Docker DB on same machine:
- SSL is often off.

For cloud DB (Supabase, managed DB):
- SSL is often required.

If client expects SSL but server does not support it:
- connection fails.

If server requires SSL but client does not use it:
- connection fails.

So SSL must match on both sides.

---

## 12. Quick Mental Model for SSL Errors

Think of SSL as language mode:

- Client says: "Let's speak encrypted"
- Server says: "I only speak plain"
-> Failure

Or:

- Server says: "I require encrypted"
- Client says: "I only speak plain"
-> Failure

Match modes = success.

---

## 13. `.env` File: What It Is

`.env` is just key=value lines.

Example:

PORT=8080
DB_HOST=example.com
DB_PASSWORD=secret

Backend reads this at runtime.

Never commit real secrets to git.

---

## 14. Where `.env` Is Read in Your Setup

This is very important in your project:

- Your current compose file uses backend env_file:
  - `./backend/.env`

So backend gets environment from backend/.env,
not necessarily from root .env.

Always verify current compose file behavior.

---

## 15. Why You Can Feel Confused About `.env`

Because there are 3 common patterns:

Pattern A: App reads root .env directly.
Pattern B: Compose injects env from root .env.
Pattern C: Compose injects env_file from service path.

Different repos use different patterns.

Your confusion is normal.

---

## 16. Golden Rule for Env Debugging

When unsure, do this:

1. Check compose file:
- Is `environment:` used?
- Is `env_file:` used?

2. Check app config code:
- Which env vars are read?

3. Check runtime inside container:
`docker-compose exec backend env | sort`

Then you know truth, not assumptions.

---

## 17. Minimal "Is Backend Healthy?" Checklist

Run these in order:

1. `docker-compose ps`
- Are backend and db running?

2. `docker-compose logs --tail=100 backend`
- Any crash stacktrace?

3. `curl http://localhost:8080/health`
- Do you get JSON success?

4. If health fails, backend is not healthy.

---

## 18. Minimal "Can Frontend Talk to Backend?" Checklist

1. Frontend loads:
`curl -I http://localhost:5173`

2. Backend health:
`curl http://localhost:8080/health`

3. If frontend up but backend down:
- browser shows fetch/server connection errors.

---

## 19. Why `docker compose` vs `docker-compose` Confuses People

Both are Compose commands.

- `docker compose` (new plugin style)
- `docker-compose` (older standalone binary)

Your machine may support only one.

That is why scripts often detect both.

---

## 20. Your Starter Script Strategy (Good Practice)

Your script does:

- Detect compose command.
- Ensure env file exists.
- Run up with build.
- Retry with down+up when compose v1 bug appears.
- Print status and URLs.

That is exactly the right practical approach for your current setup.

---

## 21. Common Errors and Meaning (No Jargon)

Error: `ECONNREFUSED`
- App tried connecting to host:port.
- Nothing accepted connection there.
- Usually DB down/wrong host/wrong network.

Error: `server does not support SSL connections`
- Client forced SSL.
- DB server is non-SSL.

Error: `password authentication failed`
- DB username/password wrong.

Error: `ENOTFOUND`
- Hostname cannot resolve via DNS.

Error: `429 quota exceeded`
- External API limit hit (Google Books).

---

## 22. Step-by-Step: Local Run (Simple Routine)

Use this routine exactly.

1. Open project root.
2. Ensure backend/.env has correct values.
3. Run:
`bash scripts/local/run-project.sh up`
4. Check status:
`bash scripts/local/run-project.sh status`
5. Check backend health:
`curl http://localhost:8080/health`
6. Open frontend:
http://localhost:5173

If failing:
7. Logs:
`docker-compose logs -f backend`

---

## 23. Step-by-Step: Clean Restart

If state is messy:

1. `docker-compose down`
2. `docker-compose up -d --build`
3. `docker-compose ps`
4. `curl http://localhost:8080/health`

Only if DB data corruption suspected:
- `docker-compose down -v`
- then up again
- this destroys local DB data

---

## 24. Supabase DB Connection Tips

For Supabase DB with pg:

Use either:

A) DATABASE_URL only
or
B) DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD

Do not mix inconsistently.

Ensure special chars in passwords are handled properly.

In .env key=value format, plain value is usually fine,
but avoid shell interpolation issues in scripts.

---

## 25. API Key Basics (Google Books)

Google API key is used for request quota identity.

If key missing:
- requests use anonymous quota
- may hit limits quickly

If key set:
- uses your project quota

Still can hit quota if overused,
but usually much more stable than anonymous.

---

## 26. Security Basics You Must Follow

1. Never commit real keys/passwords.
2. Keep `.env` and `backend/.env` in `.gitignore`.
3. If secrets were shared publicly, rotate them.
4. Use different secrets for dev and production.

---

## 27. How to Learn This Without Overwhelm

Do it in 3 layers.

Layer 1: Run app reliably.
- commands only
- no deep internals

Layer 2: Understand one failure at a time.
- frontend fetch error
- backend logs
- db connectivity

Layer 3: Understand architecture.
- why each service exists
- how they talk

You are already entering layer 2.
That is good progress.

---

## 28. Beginner Exercise 1 (5 minutes)

Goal: prove service health checks.

1. run up script
2. run status command
3. hit health endpoint
4. stop all

Expected result:
- You can explain what is up/down without guessing.

---

## 29. Beginner Exercise 2 (10 minutes)

Goal: understand logs.

1. Start app.
2. Open backend logs.
3. Trigger one frontend action (search).
4. See logs change.

Expected result:
- You can map user action -> backend behavior.

---

## 30. Beginner Exercise 3 (15 minutes)

Goal: practice failure triage.

1. Temporarily set wrong DB password in backend/.env.
2. Restart backend.
3. Observe failure logs.
4. Restore password.
5. Restart and verify health success.

Expected result:
- You stop fearing error messages.

---

## 31. Real-World Debug Loop (Use This Always)

When broken, do this exact loop:

1. Reproduce issue.
2. Check container status.
3. Check backend logs.
4. Check health endpoint.
5. Check config/env variables.
6. Apply one fix.
7. Re-test.

One fix at a time.

Never change 10 things blindly.

---

## 32. Fast Cheat Sheet

Start app:
`bash scripts/local/run-project.sh up`

See status:
`bash scripts/local/run-project.sh status`

See logs:
`bash scripts/local/run-project.sh logs`

Stop app:
`bash scripts/local/run-project.sh down`

Backend health:
`curl http://localhost:8080/health`

Search test:
`curl "http://localhost:8080/api/books/search?q=harry%20potter&limit=1"`

---

## 33. What To Do If You Feel Lost Again

Use this message format:

"I ran:
1) <command>
2) <command>

I got this output:
<paste exact error>

I expected:
<what I expected>"

That format makes debugging 10x faster.

---

## 34. Your Current Situation (Simple Summary)

- Frontend can run.
- Backend needs valid DB connection.
- DB can be local docker postgres or remote Supabase.
- Env location and SSL mode must match setup.
- If backend is healthy, frontend fetch errors usually disappear.

---

## 35. Final Encouragement

You are not behind.

You are doing the hard part:
understanding systems, not just copy-pasting commands.

Keep asking "why".
That is how you become strong.

---

## 36. If You Want Next Guide

Ask for:
"Part 2: Networking and Ports with diagrams"

or

"Part 2: Database connections and SSL with examples"

I can build those in the same beginner style.
