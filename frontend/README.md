# JobMatchAgent AI

An AI-powered agent that evaluates job links based on your resume and criteria, and helps draft application responses.

## How to sync this code to GitHub

To sync this local codebase to a new GitHub repository, follow these steps in your terminal:

### 1. Initialize Git
Open your terminal, navigate to the root folder of this project, and initialize a new Git repository:
```bash
git init
```

### 2. Add and Commit Files
Stage all your files and create your first commit:
```bash
git add .
git commit -m "Initial commit: JobMatchAgent AI setup"
```

### 3. Create a Repository on GitHub
1. Go to [GitHub](https://github.com/) and log in.
2. Click the **+** icon in the top right corner and select **New repository**.
3. Name your repository (e.g., `job-match-agent-ai`).
4. Leave it Public or Private, and **do not** initialize it with a README, .gitignore, or license (since you already have them locally).
5. Click **Create repository**.

### 4. Link Local Code to GitHub
Copy the remote repository URL provided by GitHub (it looks like `https://github.com/yourusername/job-match-agent-ai.git`). Then run:
```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
```

### 5. Push Your Code
Push your local commits to the main branch on GitHub:
```bash
git branch -M main
git push -u origin main
```

Your code is now synced to GitHub! Any future changes can be synced by running:
```bash
git add .
git commit -m "Describe your changes"
git push
```

## Environment Variables
Make sure to set up your `API_KEY` in your environment or deployment platform for the Gemini API to work correctly. Do not commit your API keys to GitHub (they are ignored via `.gitignore`).
