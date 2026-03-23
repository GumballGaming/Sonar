# Changelog

## [1.7] - 2026-03-23

### Bug Fixes
- Fixed uninitialized config guard in `saveSession()` to prevent crashes on early exit signals
- Resolved version mismatch between `package.json` and `Handler.ts` (was 1.1 vs 1.1.1)
- Fixed all internal "Cody" references updated to "Sonar" across the codebase (agent prompt, API headers, env vars, config dir, binary name)

### Improvements
- Consistent version numbering across all project files
- More robust session save logic with null-safety check on config before writing
- Config directory moved from `~/.cody` to `~/.sonar`
- Environment variables now use `SONAR_` prefix (`SONAR_API_URL`, `SONAR_API_KEY`, `SONAR_MODEL`, `SONAR_TIMEOUT`)
- Binary renamed from `cody` to `sonar`

### Known Limitations
- No automated test coverage
- Directory cache does not invalidate on external filesystem changes during a session
