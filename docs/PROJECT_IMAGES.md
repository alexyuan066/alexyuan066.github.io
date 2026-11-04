# Add project images

Upload images to the matching project folder on GitHub. The site discovers them automatically at build time; no image list or React edits are needed.

| Work entry | Upload folder |
| --- | --- |
| Ultrasonic Invasive-Plant Control | [src/assets/projects/ultrasonic/](https://github.com/alexyuan066/alexyuan066.github.io/tree/main/src/assets/projects/ultrasonic) |
| Rocket Engineering & Team Leadership | [src/assets/projects/aiaa/](https://github.com/alexyuan066/alexyuan066.github.io/tree/main/src/assets/projects/aiaa) |
| Sustainable-Fuel Combustion Research | [src/assets/projects/combustion/](https://github.com/alexyuan066/alexyuan066.github.io/tree/main/src/assets/projects/combustion) |

HyAxiom has no image gallery. Do not upload confidential internship images or proprietary geometry.

## Upload in GitHub

1. Open the matching folder above while signed in to GitHub.
2. Choose **Add file → Upload files** and add your approved images. Supported formats are `.jpg`, `.jpeg`, `.png`, `.webp`, and `.avif`, including uppercase extensions. Spaces in filenames work. Use web-sized files to keep loading lightweight.
3. Use descriptive filenames. The gallery uses natural filename order; numeric prefixes such as `01-`, `02-`, and `03-` give you control over the sequence. Keep the exact filename when adding optional metadata below.
4. Commit the upload to `main` and wait for the GitHub Pages workflow to succeed.
5. Refresh the portfolio. The images appear in that work entry's compact image strip. Open a thumbnail for a larger view; use Previous/Next or the left/right arrow keys, and Close or Escape to return. The strip has left/right scroll controls when needed.

No gallery or missing-image placeholder appears before real images are uploaded. This workflow is for still images.

Senior Design also has a featured image preview with a full caption, visible previous/next controls, an image count, and mobile swipe. Its gallery is available before expanding the engineering description. See [the Senior Design image list](SENIOR_DESIGN_IMAGES.md) for the exact filenames, order, and approved captions. Other project galleries retain the compact horizontal strip.

## Optional descriptions, captions, and credits

Images appear without metadata. By default, the site makes readable text from each filename by removing the extension and numeric prefix and replacing hyphens or underscores with spaces. A useful filename is therefore better than a camera-generated name.

For a more precise description, edit [src/gallery-captions.json](https://github.com/alexyuan066/alexyuan066.github.io/edit/main/src/gallery-captions.json). Use the project key and the **exact image filename**, including capitalization and extension.

This example contains placeholder text only. Replace the filename and all description text with the actual file and verified context; it does not describe an existing image:

```json
{
  "ultrasonic": {
    "01-your-image.jpg": {
      "alt": "Replace with a concise description of what the actual image shows.",
      "caption": "Replace with verified context, date or design stage, and individual/team contribution.",
      "credit": "Replace with the actual creator or required public credit."
    }
  },
  "aiaa": {},
  "combustion": {}
}
```

Keep any existing entries when editing the JSON. Each metadata field is optional. Commit the change to `main` to update the deployed gallery. Use captions to distinguish concepts from built hardware, simulation from testing, and Alex's contribution from team work. Credit only the actual creators and share only material cleared for public use.
