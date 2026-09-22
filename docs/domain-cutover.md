# GitHub Pages domain cutover

Target: `https://comonad.com/reader/`, served by `ekmett/comonad.com`, branch `pages`, root directory. GitHub provides hosting and HTTPS; Namecheap remains the registrar and DNS provider. The repository root forwards to `reader/` with a relative HTML redirect.

## Order of operations

1. Build and check locally with the canonical `content/site.json` base URL and `dist/CNAME`.
2. Publish the `dist/` subtree, retaining `CNAME`. Confirm GitHub Pages has `comonad.com` configured before changing DNS.
3. In Namecheap Advanced DNS, replace only the apex and `www` web records with the records below. Preserve mail forwarding, MX, SPF, and all unrelated records.
4. Confirm authoritative DNS and public resolvers agree, then check GitHub's domain status and certificate. Enable Enforce HTTPS when the certificate is ready.
5. Verify `/`, `/reader/`, historical article URLs, `/haskell/`, feeds, styles, and WebAssembly over HTTPS, including `www` redirection. GitHub DNS and certificate processing can take up to 24 hours.

## Web records

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | ekmett.github.io |

Use a short TTL during cutover. Remove conflicting apex/www aliases or addresses only; do not change nameservers. Optional IPv6 addresses, if added, must be GitHub's published Pages addresses.

## Previous public DNS, recorded 22 September 2026

Both `comonad.com` and `www.comonad.com` had CNAME records pointing to `legacy.shiftedlands.com` with TTL 60. That host resolved to `18.222.237.184` when checked. DNS is served by `dns1.registrar-servers.com` and `dns2.registrar-servers.com`.

Mail records to preserve: priority 10 `eforward1`, `eforward2`, and `eforward3.registrar-servers.com`; priority 15 `eforward4.registrar-servers.com`; priority 20 `eforward5.registrar-servers.com`. The apex SPF TXT is `v=spf1 include:spf.efwd.registrar-servers.com ~all`.

If reverting the web cutover, restore the two previous web aliases in Namecheap and remove only the newly added GitHub web addresses. Keep mail settings intact. Restore the previous hosting base URL in `content/site.json` and remove `dist/CNAME` before republishing and clearing GitHub's custom-domain setting. RSS entry IDs remain unchanged across either move.

References: [GitHub custom-domain setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).
