% bash /Users/ramdhakne/Documents/work/github/tool-hooks-ide/studio-recipes/guardrail_directives/secure_at_inception/kiro_hooks/install.sh 
╔════════════════════════════════════════════════════════════╗
║     SNYK SECURITY PRE-COMMIT HOOK INSTALLER                ║
╚════════════════════════════════════════════════════════════╝

✓ Git repository found: /Users/ramdhakne/Documents/work/github/kiro-aws-dev/sample-app
✓ Python 3 found: 3.9.6
✓ Snyk CLI found: 1.1301.0
✓ Snyk authenticated

Installing pre-commit hook...
✓ Pre-commit hook copied to: /Users/ramdhakne/Documents/work/github/kiro-aws-dev/sample-app/.git/hooks/pre-commit
✓ Hook libraries copied to: /Users/ramdhakne/Documents/work/github/kiro-aws-dev/sample-app/.git/hooks/lib/

Installing Kiro background scanner...
⚠ .kiro directory not found
  This doesn't appear to be a Kiro workspace
Create .kiro/hooks/ directory? (y/n) y
✓ Kiro hooks installed to: /Users/ramdhakne/Documents/work/github/kiro-aws-dev/sample-app/.kiro/hooks/

╔════════════════════════════════════════════════════════════╗
║     INSTALLATION COMPLETE                                  ║
╚════════════════════════════════════════════════════════════╝

The Snyk security hooks are now active.

What happens:
  • Git: Pre-commit hook scans for NEW vulnerabilities (SAST/SCA)
  • Kiro: Background scanner caches results on file save
  • Commits are blocked if new issues are introduced

Configuration (environment variables):
  • SNYK_HOOK_DEBUG=1  - Enable verbose output
  • SNYK_HOOK_QUICK=1  - Skip old version comparison (faster)

To bypass the hook (use sparingly):
  git commit --no-verify

To uninstall:
  rm /Users/ramdhakne/Documents/work/github/kiro-aws-dev/sample-app/.git/hooks/pre-commit
  rm -rf /Users/ramdhakne/Documents/work/github/kiro-aws-dev/sample-app/.kiro/hooks/
