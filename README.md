# Lawsome.Web.UI

## Development Setup

### Build & Commit Instructions

This project uses **Husky** pre-commit hooks to ensure code quality and prevent broken builds from being committed.

#### First-time Setup (New Developers)

1. **Install dependencies:**
   ```bash
   yarn install
   ```
   The `prepare` script will automatically set up Husky hooks.

2. **Initialize Husky (if not already done):**
   ```bash
   npx husky init
   ```

3. **Create the pre-commit hook file** (`.husky/pre-commit`):
   ```bash
   #!/bin/sh
   . "$(dirname "$0")/_/husky.sh"
   
   npm run pre-commit
   ```

#### Build Commands

- **Development server:** `yarn dev`
- **Production build:** `yarn build`
- **Type checking only:** `yarn type-check`
- **Linting:** `yarn lint`

#### Pre-commit Validation

Before each commit, the following checks will run automatically:

1. **TypeScript compilation check** (`tsc --noEmit`)
2. **ESLint validation** with auto-fixing
3. **Production build check** (`next build`)

If any check fails, the commit will be **blocked** until issues are resolved.

#### Working with Commits

**Normal commit** (with validation):
```bash
git add .
git commit -m "feat: add new feature"
```

**Emergency bypass** (use sparingly):
```bash
git commit --no-verify -m "emergency: hotfix for production"
```

#### Troubleshooting

**If pre-commit hooks don't run:**
```bash
# Reinstall husky
npm run prepare
```

**If TypeScript errors during commit:**
- Fix the TypeScript errors shown in the output
- Or run `yarn type-check` to see all errors
- Commit again after fixing

**Common issues:**
- Ensure you're using Node.js 18+ and latest Yarn
- Run `yarn install` after pulling changes
- Check that `.husky/pre-commit` file exists and is executable