# Resuming work

How to pick up where the last Claude Code session stopped, for the owner and for agents.

## For the owner: which command to run

Run these from the repo folder (`cd ~/PycharmProjects/YmarqApp`); sessions are stored per folder.

| You want                                            | Run                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| The **same conversation**, with its full history    | `claude --continue` (`-c`): the most recent session in this folder       |
| An older conversation                               | `claude --resume` (`-r`) and pick it from the list, or `/resume` inside  |
| A **fresh** conversation that continues the work    | `claude`, then type `resume` (the agent follows the checklist below)     |

- Resuming reopens the old session, so it keeps the old session's name. To rename it, type
  `/rename <new name>` inside the session.
- A fresh session is cheaper and is fine for most days: the state of the work lives in GitHub
  (issues, PRs, CI) and in Claude's memory, not in the old chat.

### Remote control (driving the Mac from claude.ai or the phone app)

```bash
cd ~/PycharmProjects/YmarqApp
caffeinate -dimsu & claude remote-control --spawn worktree --permission-mode acceptEdits --name "ymarq-<topic>"
```

- Run **one** `claude remote-control` at a time. Stop the old one (Ctrl+C in its terminal) before
  starting a new one; `ps aux | grep "claude remote-control"` shows what is running.
- `--name` names the session that is created **in the repo folder** when the command starts. On
  2026-10-13 a second run (`ymarq2`) picked up the session that the first run (`ymarq1`) had
  just created there, so it still showed `ymarq1`. If that happens, rename it from inside
  (`/rename ymarq2`) or ask Claude to rename it.
- `--spawn worktree`: sessions you start from claude.ai get their own copy of the repo under
  `.claude/worktrees/`, so two of them can work at once without touching each other's files.
  The first session (in the repo folder) does not.
- `claude remote-control -c` reattaches to the last remote-control session in this folder (within
  about 4 hours) instead of creating a new one.
- `caffeinate -dimsu &` keeps the Mac awake; it keeps running after you stop Claude
  (`killall caffeinate` to stop it).

## For agents: the resume checklist

1. Read `AGENTS.md`, then the handoff note in memory (`ymarq-handoff`): what was in flight and
   what comes next.
2. `git fetch && git status`; `git checkout master && git pull`.
3. `gh pr list --state all --limit 10` and `gh pr checks <n>` for each open PR. Merged PRs: delete
   nothing, just move on. Red or conflicted PRs: fix them first (merge master in; never rebase).
4. `gh issue list --label dod --state open` and `npm run roadmap`: pick the next unblocked issue.
5. Tell the owner in two lines what you found and what you're doing next, then start.

## For agents: before the session ends

Update the `ymarq-handoff` memory (overwrite it, don't append): open PRs and their state, the
next step, and anything the owner must do. Keep it under 15 lines.
