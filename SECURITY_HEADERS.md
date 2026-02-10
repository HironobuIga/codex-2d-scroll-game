## Production security headers

`index.html` currently sets CSP with a meta tag for static-host compatibility. For production, prefer response headers so directives like `frame-ancestors` are enforced.

Recommended header values:

```txt
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
```

If you must keep WebSocket access for local development tools, add the required localhost origins only in non-production environments.
