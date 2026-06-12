# Git Workflow & Conventions

A practical reference for working with git the way professional teams do.
Read top to bottom once; after that, use it as a cheat sheet.

The golden rule: **one commit = one logical change, with a message that explains
_why_.** Everything below serves that rule.

---

## 1. The everyday loop

```bash
git checkout -b <branch>      # 1. branch off main before you start
git status                    # 2. see what changed
git add -p                    # 3. stage selectively, reviewing each chunk
git diff --staged             # 4. final look at exactly what you'll commit
git commit                    # 5. opens editor for a full message
git push -u origin <branch>   # 6. push the branch, open a Pull Request
```

Avoid the lazy version (`git add . && git commit -m "" && git push` straight to
`main`). It works on a toy project and falls apart the moment you collaborate,
review, or need to debug history.

---

## 2. Commit message format (Conventional Commits)

```
<type>(<scope>): <short summary, imperative mood, no period>

<body — explain WHAT changed and WHY, wrapped at ~72 chars.
The diff already shows the how; the message captures the reason.>

<optional footer — refs, breaking changes, co-authors>
```

### Rules

- **Subject line ≤ ~50 chars**, imperative mood: "add", "fix", "refactor" —
  _not_ "added" / "fixes". Read it as: "this commit will **add** …".
- **No period** at the end of the subject.
- **Blank line** between subject and body (required — tools rely on it).
- **Body wrapped at ~72 chars**, focused on the _why_.
- One commit should describe **one** change. If your summary needs the word
  "and", it's probably two commits.

### Types

| Type       | Use for                                                       |
| ---------- | ------------------------------------------------------------ |
| `feat`     | A new feature or endpoint                                    |
| `fix`      | A bug fix                                                    |
| `refactor` | Code change that neither fixes a bug nor adds a feature      |
| `docs`     | Documentation only                                           |
| `style`    | Formatting, whitespace, semicolons — no logic change         |
| `test`     | Adding or fixing tests                                       |
| `chore`    | Build, deps, tooling, config — no app logic                  |
| `perf`     | A performance improvement                                    |

**scope** (optional) is the area touched: `auth`, `student`, `prisma`, `deps`.

### Examples

Short and complete:

```
fix(mail): use correct RESEND_API_KEY env var name

The Resend client read RESNEND_API_KEY (typo), so the key was always
undefined and every reset email silently failed to send.
```

A larger feature:

```
feat(auth): add session persistence and password reset flow

Add forgot-password / reset-password endpoints and persist refresh
sessions, replacing the unused change-password route.

- Add Session and PasswordReset models (tokens stored hashed)
- Issue, rotate, and revoke sessions on login/refresh/logout
- Send the reset link via Resend (MailService)
```

Trivial chore:

```
chore(deps): add resend to backend dependencies
```

---

## 3. Selective staging — the habit that matters most

`git add .` stages everything into one pile. Stage deliberately instead:

```bash
git add path/to/file.ts          # stage specific files
git add backend/prisma/          # stage a whole folder
git add -p                       # interactively stage chunk by chunk
```

`git add -p` walks each change and asks `Stage this hunk [y,n,s,q,?]`:

| Key | Meaning                                      |
| --- | -------------------------------------------- |
| `y` | stage this hunk                              |
| `n` | skip this hunk                               |
| `s` | split into smaller hunks                     |
| `q` | quit                                         |
| `?` | help                                         |

This is also how you **catch mistakes before committing** — a stray
`console.log`, a debug change, a half-finished edit. If you see it in the hunk,
say `n` and it stays out of the commit.

> Related files belong in the same commit. A Prisma schema change and its
> generated migration should be committed **together** — they describe the same
> logical change.

---

## 4. Branching

Never commit straight to `main`. `main` is the deployable, trusted history.

```bash
git checkout -b feat/auth-session-reset    # create + switch to a branch
git branch                                 # list branches (* = current)
git checkout main                          # switch back
git checkout -                             # switch to the previous branch
```

**Branch naming:** `<type>/<short-description>`

```
feat/auth-session-reset
fix/reset-email-not-sending
refactor/move-prisma-out-of-controllers
docs/git-workflow
```

A branch + Pull Request is a permanent record of _why_ a chunk of work exists —
valuable even when working solo.

---

## 5. Staying in sync with the team

When others push to `main` while you work, update your branch before pushing:

```bash
git pull --rebase origin main
```

`--rebase` replays _your_ commits on top of the latest `main`, keeping history
linear instead of cluttered with "Merge branch 'main'" commits.

If a rebase hits a conflict: fix the files, `git add` them, then
`git rebase --continue`. To bail out entirely: `git rebase --abort`.

---

## 6. Looking before you leap

Inspect constantly. These are read-only and safe:

```bash
git status                 # what's changed / staged
git diff                   # unstaged changes
git diff --staged          # what you're about to commit
git log --oneline -10      # last 10 commits, compact
git log --stat             # commits with files changed
git show <commit>          # full detail of one commit
```
---

## 7. Undoing things (safely)

| Goal                                            | Command                                 |
| ----------------------------------------------- | --------------------------------------- |
| Unstage a file (keep the edits)                 | `git restore --staged <file>`           |
| Discard unstaged edits to a file (**destroys**) | `git restore <file>`                    |
| Fix the **last** commit's message               | `git commit --amend`                    |
| Add a forgotten file to the last commit         | `git add <file> && git commit --amend`  |
| Undo last commit, keep changes staged           | `git reset --soft HEAD~1`               |
| Undo last commit, keep changes unstaged         | `git reset HEAD~1`                       |
| Safely reverse an _already-pushed_ commit       | `git revert <commit>`                   |

> `reset` rewrites history (only safe on commits you haven't pushed/shared).
> `revert` makes a _new_ commit that undoes an old one — safe for shared history.
> Never `--amend` or `reset` a commit others have already pulled.

---

## 8. What never goes in git

- **Secrets** — `.env`, API keys, credentials. Keep them in `.gitignore`.
- **Build output** — `dist/`, compiled files.
- **Dependencies** — `node_modules/`.
- **Local/editor cruft** — `.DS_Store`, IDE settings.

Habit: run `git status` before every commit and ask, "does this file _belong_ in
the repo?" If a secret ever gets committed, rotate it — removing it in a later
commit does **not** erase it from history.

---

## 9. Quick reference card

```bash
# start work
git checkout -b feat/thing

# stage + review + commit (repeat per logical change)
git status
git add -p
git diff --staged
git commit

# share
git pull --rebase origin main
git push -u origin feat/thing
# → open a Pull Request

# inspect
git log --oneline -10
git diff
git show <commit>

# undo
git restore --staged <file>      # unstage
git commit --amend               # fix last commit
git revert <commit>              # safely undo a pushed commit
```
