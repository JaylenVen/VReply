# Security Policy

## Supported versions

Security fixes are applied to the latest release on the `main` branch.

| Version | Supported |
| --- | --- |
| 2.6.x | Yes |
| Earlier versions | No |

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Use GitHub's private vulnerability reporting for this repository when it is available. If that option is unavailable, contact [@JaylenVen](https://github.com/JaylenVen) and request a private channel before sharing exploit details.

Include the affected version or commit, reproduction steps, expected impact, and any suggested mitigation. Reports will be acknowledged as soon as possible. A fix and disclosure timeline will be coordinated after the issue is validated.

## Security boundaries

VReply processes untrusted YouTube URLs and subtitle text and can send transcript context to a user-configured OpenAI-compatible API. Security-sensitive changes should preserve:

- strict YouTube host, URL, port, and redirect validation;
- request, response, and timeout limits;
- separation of untrusted subtitle text from model instructions;
- structured validation of model responses;
- non-disclosure of API keys; and
- loopback-only service binding by default.

Do not expose VReply to an untrusted network without adding authentication and access controls.
