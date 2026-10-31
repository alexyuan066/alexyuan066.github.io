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
- `linkedIn`: the full `https://` URL of your profile. The site's LinkedIn link opens in a new tab.
- `resume`: leave blank until your intended public resume file is available. Local Word (`.docx`) and PDF files are supported; see the upload steps below. A full HTTPS URL to a hosted resume is also accepted.

Keep the JSON quotes and commas intact. Empty or invalid values are not rendered as links. There is no need to edit the React components or run a server to make these changes on GitHub.

## Upload a Word resume

1. Name your file **`resume.docx`**.
2. Open [the repository's public folder](https://github.com/alexyuan066/alexyuan066.github.io/tree/main/public) while signed in to GitHub. Choose **Add file → Upload files**, then upload `resume.docx` into that folder.
3. Commit the upload to `main`. The file's repository path must be **`public/resume.docx`**.
4. Open [the contact file editor](https://github.com/alexyuan066/alexyuan066.github.io/edit/main/src/contact.json) and change the `resume` field to **`"/resume.docx"`**. Keep the other fields as you want them and commit this edit to `main`.
5. Wait for the latest GitHub Actions deployment to succeed, then refresh the website and check **Download resume**.

The repository folder name `public` is omitted from the website URL: `public/resume.docx` is served as `/resume.docx`. Match the filename and capitalization exactly. Visitors can download the Word file; opening it depends on their browser and installed document viewer.

A PDF also works: upload **`public/resume.pdf`** and set the field to **`"/resume.pdf"`** instead. Exporting the Word document to PDF is optional and can give visitors more consistent viewing across devices.

## What is public

These are **public website fields**, not secrets. Their values will be visible on the website and in the public GitHub repository. Editing them yourself avoids sending them in chat; it does not make them private or inaccessible to someone reading the site/source. A dedicated professional email alias or a LinkedIn link can be used instead of personal contact details. You can omit phone entirely.

If you want visitors to send a message without seeing an email address, that requires a hosted contact-form service or another backend. Do not put a private email-service password, API key, or token in this JSON file. No contact-form service is configured by this revision.
