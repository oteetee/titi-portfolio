# Titi Arigbe, portfolio

Static website. No build step, no framework, no dependencies.

## Run locally
Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

## Deploy (Netlify)
- Build command: none
- Publish directory: the root of this folder (`.`)
- Drag and drop this folder onto app.netlify.com, or connect the GitHub repo.
- `netlify.toml` already sets the publish directory, security headers and image caching.

## Structure
    index.html              homepage, includes both case studies inline (opened by the View case study buttons)
    404.html                branded not-found page
    case-studies/           standalone versions of the same case studies, for direct linking
      nairacompare.html
      maxella-ai.html
    css/                    one stylesheet per page
    js/                     one script per page
    assets/
      images/               photography, screenshots, artwork, logo
      icons/                favicons, apple touch icon, Open Graph share image
      docs/                 CV (PDF)
    __forms.html            hidden form definition so Netlify Forms detects the contact form
    netlify.toml            publish directory, headers, caching
    robots.txt / sitemap.xml

## Contact form
Uses Netlify Forms (form name: `contact`). It only works once deployed to Netlify.
After the first deploy, check Site configuration, Forms, and add a notification email.

## Fonts
Google Fonts (DM Sans, Fraunces, Caveat) loaded over HTTPS. To self-host, download the
families into `assets/fonts/` and replace the `<link>` tags in each HTML file.

## Third-party scripts
- Spotify iFrame API, used by the playlist card in The Other Side.
- three.js (CDN), used by the embedded Maxella site preview inside the Maxella AI case study.
Both load from public CDNs. No keys, tokens or credentials anywhere in this project.
