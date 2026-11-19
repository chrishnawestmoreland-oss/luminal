# Contributing to Luminal

Thanks for helping build Luminal. A few ground rules:

1. **Keep the safety gate honest.** Never add a way to skip approval for
   risky actions, and never mark a risky action as safe to make a demo
   smoother. If a tool can delete, publish, send or spend, it goes through
   `safety.ts`.
2. **Small, reviewable changes.** One concern per pull request, with a
   short description of what changed and how you tested it.
3. **Test the loop, not just the code.** Run `npm run build` and try a
   real goal from `examples/goal.md` before opening a PR.
4. **No secrets in the repo.** API keys go in environment variables
   (`LUMINAL_API_KEY`), never in code, examples or commit messages.
