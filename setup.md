# Mac Development Environment Setup

A reusable setup guide for configuring a fresh Mac for Node.js / GitHub / Python development. Replace the placeholders below (`<PROJECT_NAME>`, `<REPO_URL>`, etc.) with your own values.

## 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Add Homebrew to your PATH (only needed once, right after install — the installer will print the exact commands for your shell, e.g.):

```bash
echo >> ~/.zprofile
echo 'eval "$(/opt/homebrew/bin/brew shellenv zsh)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
```

`~` automatically resolves to the current user's home directory, so this works regardless of username.

## 2. Install Node.js

```bash
brew install node
node -v
```

Update npm to the latest version:

```bash
npm install -g npm@latest
npm -v
```

## 3. Install GitHub CLI

```bash
brew install gh
gh --version
```

## 4. Install Python

```bash
brew install python
```

Note: macOS ships with an older system Python (`python3`). Homebrew installs a versioned binary (e.g. `python3.14`) alongside it rather than replacing it. To use the Homebrew version by default, add its bin directory to your PATH (Homebrew prints the exact path in its install output — typically `/opt/homebrew/opt/python@<version>/libexec/bin`).

## 5. Authenticate GitHub CLI

```bash
gh auth login
```

Recommended prompts:
- Where do you use GitHub? → **GitHub.com**
- Preferred protocol for Git operations → **HTTPS**
- Authenticate Git with your GitHub credentials? → **Yes**
- How would you like to authenticate? → **Login with a web browser**

This opens a device-code flow in the browser; once approved, `gh` and `git` are both authenticated and the token is stored securely in the macOS keychain.

Verify with:

```bash
gh auth status
```

## 6. Set up a project repo

```bash
cd ~/<PROJECT_NAME>
git init
```

This initializes a `.git` folder at `~/<PROJECT_NAME>/.git`. Any subfolders (e.g. a nested app folder) are part of this same repo unless you `git init` inside them separately.

## 7. Store GitHub remote repo URL and personal access token (config.txt)

The purpose of `config.txt` is to give Claude Cowork the information it needs to push commits to the remote GitHub repo on your behalf. Create it inside the project folder:

```
GITHUB_REPO_URL=<REPO_URL>
GITHUB_PAT=<PERSONAL_ACCESS_TOKEN>
```

> ⚠️ **Security note:** Storing a personal access token in plain text is risky, especially if this folder is ever committed to git or shared. Recommended precautions:
> - Add `config.txt` to `.gitignore` immediately so it's never committed:
>   ```bash
>   echo "config.txt" >> .gitignore
>   ```
> - Treat the PAT like a password — regenerate it on GitHub (Settings → Developer settings → Personal access tokens) if it's ever exposed or committed by accident.
> - Since `gh auth login` already stores an authenticated token securely in the macOS keychain, a separate `config.txt` PAT may not even be necessary for most git/gh operations — it's primarily useful as a manual reference for the remote URL and token.

## 8. Configure Claude app domain access for GitHub

If you're using Claude Cowork to work in this repo and push changes, you need to explicitly allow it to reach GitHub:

1. Go to **claude.ai/settings/capabilities** (or Claude Desktop → Settings → Capabilities)
2. Under **"Code execution and file creation,"** make sure **"Allow network egress"** is enabled
3. Set the **domain allowlist** to include `github.com` (add `api.github.com` and `codeload.github.com` as well if you run into blocked requests)
4. Restart the Claude app for the setting to take effect, then open a new Cowork session

Without this, Cowork will be blocked from reaching GitHub even if `config.txt` has valid credentials — the two settings work together (credentials + network access) to let Cowork push on your behalf.

> Note: this is a known rough edge — some users have reported the domain allowlist not applying reliably to Cowork sessions even after a restart (see open issues on Anthropic's GitHub tracker). If pushes still fail after following the steps above, try toggling the setting off/on, fully quitting and reopening the app, or starting a fresh Cowork session.

## 9. Install project dependencies and run the app

```bash
cd ~/<PROJECT_NAME>/<APP_SUBFOLDER>
npm install
npm run dev
```

`npm install` is required before `npm run dev` — without it, binaries like `next` won't be found, causing a `command not found` error.

## Useful verification commands

| Check | Command |
|---|---|
| Node installed | `node -v` |
| npm version | `npm -v` |
| GitHub CLI installed | `gh --version` |
| GitHub CLI authenticated | `gh auth status` |
| Folder is a git repo | `ls -a` (look for `.git`) or `git status` |
| Git repo root location | `git rev-parse --show-toplevel` |
| Current username | `whoami` |
