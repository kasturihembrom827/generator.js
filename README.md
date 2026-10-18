# Wapkiz All-in-One Generator v2 (starter integration)

## Files
- `generator.js`: shared TMDB search/autofill + Movie and Theme/Script output helpers.
- `generator.html`: standalone demo UI for testing and reference.
- `wapkiz-integration.html`: Wapkiz page markup example that loads the shared JS.
- `README.md`: setup notes.

## Important integration notes
1. This is a client-side generator. It generates Wapkiz post HTML; it does not automatically publish posts.
2. Keep the Movie form and Theme form separate because they submit to different Wapkiz blog IDs.
3. Update the TMDB API key before production. Any key embedded in browser JavaScript is public.
4. GitHub Pages works with a PUBLIC repository. If you later make the repo private, do not rely on the public Pages URL to serve `generator.js`.
5. Wapkiz custom tags such as `[blog_form]` must be processed by Wapkiz. Test the integration page in your actual Wapkiz editor; a plain GitHub preview cannot process those tags.
