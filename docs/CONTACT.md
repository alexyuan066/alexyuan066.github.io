# Add your contact details yourself

You do not need to send an email address or phone number to the assistant. The site reads the optional public contact fields from one file: [`src/contact.json`](../src/contact.json).

## Edit in GitHub

Use the contact file on the repository's `main` branch:

1. Open [the contact file editor](https://github.com/alexyuan066/alexyuan066.github.io/edit/main/src/contact.json) while signed in to your GitHub account. You can also open `src/contact.json` in the repository and choose the pencil/edit control.
2. Put the details you want public inside the existing quotation marks. Leave any unwanted field as `""`.
3. Commit the change to `main`. The existing GitHub Actions workflow will build and publish the update. Wait for its green check, then refresh the website.

The starting file is:

```json
{
  "email": "",
  "phone": "",
  "linkedIn": "",
  "resume": ""
}
```

- `email`: an email address, without a `mailto:` prefix. This creates a clickable email link.
- `phone`: a phone number, optionally including a country code, spaces, parentheses, or hyphens. This creates a clickable telephone link. It is optional.
- `linkedIn`: the full `https://` URL of your profile.
- `resume`: leave blank until a real PDF is available. Upload your intended public PDF to `public/resume.pdf`, then set this value to `/resume.pdf`. A full HTTPS URL to a hosted resume is also accepted.

Keep the JSON quotes and commas intact. Empty or invalid values are not rendered as links. There is no need to edit the React components or run a server to make these changes on GitHub.

## What is public

These are **public website fields**, not secrets. Their values will be visible on the website and in the public GitHub repository. Editing them yourself avoids sending them in chat; it does not make them private or inaccessible to someone reading the site/source. A dedicated professional email alias or a LinkedIn link can be used instead of personal contact details. You can omit phone entirely.

If you want visitors to send a message without seeing an email address, that requires a hosted contact-form service or another backend. Do not put a private email-service password, API key, or token in this JSON file. No contact-form service is configured by this revision.
