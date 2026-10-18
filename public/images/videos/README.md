# Original video thumbnails

Place your actual thumbnail images in this folder, preserving their filenames.
No thumbnail files were available when the video collection was implemented.

Match each image to a project by its filename and visible content, then update that
project's `thumbnailPath` in `src/data/videoProjects.js` to its public URL:
`/images/videos/<exact original filename>` (including extension and case).
URL-encode reserved characters such as `#` as `%23` if present in a filename.
Keep uncertain matches as `null` until confirmed. Do not rename the original files.

Thumbnails display in 16:9 containers with `object-fit: cover`; original files are
never modified. Missing/unreadable images display a labeled text-only state.
Do not put confidential screenshots or internal credentials in public assets.
