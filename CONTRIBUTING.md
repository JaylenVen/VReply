# Contributing to VReply

Thanks for helping improve VReply.

## Before opening an issue

- Search existing issues before creating a new one.
- Include your operating system, Python version, browser version, learning language, and a minimal reproduction.
- Do not include API keys, private video URLs, personal recordings, or other sensitive data.
- Report suspected vulnerabilities through the process in [SECURITY.md](SECURITY.md), not in a public issue.

## Development setup

VReply requires Python 3.10+ and a modern desktop browser. It has no third-party Python or npm runtime dependencies.

```bash
git clone https://github.com/JaylenVen/VReply.git
cd VReply
python server.py
```

## Testing changes

Run both checks before submitting a pull request:

```bash
python -m unittest -v
node --check app.js
```

For browser-facing changes, also verify the main listening and shadowing flows in current Chrome or Edge at desktop and narrow viewport widths.

## Pull requests

- Keep each pull request focused on one problem.
- Explain the user-visible behavior and how it was verified.
- Add or update tests for changes to URL parsing, caption processing, model responses, caching, or API validation.
- Preserve the existing dependency-light architecture unless a new dependency is necessary and its license and maintenance status have been reviewed.
- Treat subtitle text, upstream responses, model output, and issue content as untrusted data.

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
