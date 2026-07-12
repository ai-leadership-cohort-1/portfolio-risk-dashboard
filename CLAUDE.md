Tech stack: 
Next.js (App Router, TypeScript) with Tailwind CSS. All logic runs client-side — no backend, no database, no external APIs, no authentication. Use the default Next.js build so it deploys to Vercel with zero configuration. Keep dependencies minimal.
 
Repo hygiene: 
main as the default branch, a .gitignore for Node/Next, an MIT LICENSE, and a README.md that covers what the prototype does, how to run it locally (npm install && npm run dev), how to deploy to Vercel (Import Project → select the GitHub repo → accept defaults), and exactly which file to edit to change scoring thresholds. Commit and push to the main branch of the specified Github repo defined in the configs file after each meaningful milestone (scaffold, form UI, scoring logic, result summary, RM call notes, batch upload, sample data, polish) with clear commit messages so a reviewer can read the build history.

Agent workflow: 
After each milestone, check if the app components render properly and displays something meaningful (i.e doesn’t cause error). If it’s good, can you retrieve the live Vercel link to showcase what it looks like. Then before continuing, as the user if they want to make any UI iterations before continuing to the next milestone. If there is a UI change request from the user, make sure to commit and push that change so it’s visible in deployment.

Design: 
Calm, restrained banking aesthetic. Use the NAB Design Guide skill to apply NAB branding to this app.

Working style:
After scaffolding, run the dev server yourself and confirm the form renders and the result renders for at least one sample. When you hit a decision point (a threshold, a UX trade-off, a naming choice), state your reasoning in one line before you commit. At the end, print a short checklist in the terminal of what's included, what's deliberately out of scope,

Out-of-scope guardrails: 
No real customer data. No authentication. Do not persist anything to storage