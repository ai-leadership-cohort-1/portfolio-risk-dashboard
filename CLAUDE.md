Tech stack: 
Next.js (App Router, TypeScript) with Tailwind CSS. All logic runs client-side — no backend, no database, no external APIs, no authentication. Use the default Next.js build so it deploys to Vercel with zero configuration. Keep dependencies minimal.
 
Repo hygiene: 
main as the default branch, a .gitignore for Node/Next, an MIT LICENSE, and a README.md that covers what the prototype does, how to run it locally (npm install && npm run dev), how to deploy to Vercel (Import Project → select the GitHub repo → accept defaults), and exactly which file to edit to change scoring thresholds. Commit and push to the main branch of the specified Github repo defined in the configs file with clear commit messages so a reviewer can read the build history.

Agent workflow: 
After deployment, can you ask the user if they want to make iterations or add an extension prompt which builds another feature. Make sure the question is clear in the UI. Don't make it lost lots of text paragraphs, display it in a pop up window.

After user has added their extension prompt or iterations, can you ask them if they are happy with the changes and are happy to deploy.

Every time you run a command during your workflow, can you provide a high level description to an executive audience on what you are doing.

Access: 
Don't ask the user for approvals during the first iteration/build run. Run completely automously. Once the app has had its initial deployment to Vercel then you can prompt the user for feedback as such:

Once the user makes there iterations and if adds an extension prompt, can you make sure after they deploy the change, as them if they would like to continue add more/modify.


Design: 
Calm, restrained banking aesthetic. Use the NAB Design Guide skill to apply NAB branding to this app.

Working style:
After scaffolding, run the dev server yourself and confirm the form renders and the result renders for at least one sample. When you hit a decision point (a threshold, a UX trade-off, a naming choice), state your reasoning in one line before you commit. At the end, print a short checklist in the terminal of what's included, what's deliberately out of scope,

Out-of-scope guardrails: 
No real customer data. No authentication. Do not persist anything to storage