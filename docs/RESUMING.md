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
