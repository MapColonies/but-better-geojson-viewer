# Agent Guide for This Repo

This file helps coding agents work safely and consistently here.
It summarizes how to build, lint, and test the project, along with
code style expectations. If you add tooling, update this doc.

## Project Scan Summary

- React + Vite + TypeScript app with OpenLayers.
- Package manager: npm (via `package.json`).
- No lint or test runner configured yet.
- No Cursor or Copilot rules found.

If you add tooling later, update this file with exact commands.

## Build, Lint, Test

### Install

- `npm install`

### Build

- `npm run build`

### Dev Server

- `npm run dev`

### Lint

- Not configured yet.

### Test

- Not configured yet.

### Single Test

- Not configured yet.

### Single Test Conventions (Examples)

Use patterns like these once a test runner is chosen:

- Jest: `npx jest path/to/test -t "test name"`
- Vitest: `npx vitest path/to/test -t "test name"`
- Pytest: `pytest path/to/test.py::TestClass::test_name`
- Go: `go test ./path -run TestName`
- RSpec: `bundle exec rspec path/to/spec.rb:123`

Replace with the actual project command and runner flags.

## Code Style Guidelines

Because there is no existing code yet, follow these defaults until
the project defines its own rules. Prefer existing conventions once
code exists, even if they differ from these suggestions.

### Formatting

- Use the repo's formatter if configured (Prettier, Black, gofmt, etc.).
- Keep line length consistent with the formatter defaults.
- Prefer single quotes only if the repo already does.
- Keep indentation consistent within each file.

### Imports

- Group imports by origin: standard library, third-party, local.
- Alphabetize within each group.
- Avoid unused imports; remove them promptly.
- Prefer explicit imports over wildcards when possible.

### Naming

- Use descriptive, intention-revealing names.
- Functions and variables: lowerCamelCase (JS/TS), snake_case (Py),
  or the language's standard.
- Classes and types: PascalCase.
- Constants: UPPER_SNAKE_CASE or the language's standard.
- Avoid abbreviations unless they are widely understood.

### Types

- Prefer explicit types for public APIs.
- Keep type definitions close to their usage.
- Avoid overly generic types like `any` unless unavoidable.
- Use type aliases for readability when types get complex.

### Error Handling

- Fail fast with clear error messages.
- Include context in errors (inputs, identifiers, or operation).
- Avoid swallowing errors; log or return them appropriately.
- Prefer structured error types if the language supports them.

### Functions and Structure

- Keep functions small and single-purpose.
- Avoid deep nesting; return early where it improves clarity.
- Favor pure functions where practical.
- Keep side effects localized and documented.

### Comments and Documentation

- Write comments only for non-obvious logic.
- Keep comments up to date with code changes.
- Prefer self-documenting names over comments.

### Tests

- Name tests to describe behavior, not implementation.
- Arrange, Act, Assert pattern where appropriate.
- Cover edge cases and error paths.

### Security and Secrets

- Do not add secrets to the repo.
- Use environment variables or secret managers.
- Redact sensitive values in logs.

## Repository Hygiene

- Keep commits scoped and descriptive.
- Avoid mixing refactors with behavior changes.
- Update docs when behavior or usage changes.

## Cursor and Copilot Rules

No rules found in `.cursor/rules/`, `.cursorrules`, or
`.github/copilot-instructions.md` at time of scan.

If these files are added later, summarize them here.
