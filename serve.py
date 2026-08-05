"""Servidor estático para desarrollo.

Igual que `python -m http.server`, con dos agregados que evitan pelearse
con el caché del navegador en cada cambio de CSS o JS:

1. Manda `Cache-Control: no-store`.
2. Reescribe el HTML al vuelo agregando `?v=<mtime>` a los <link> y <script>
   locales. Como la URL cambia cuando cambia el archivo, el navegador no
   puede servir una versión vieja desde su caché en memoria.

Los archivos del proyecto no se tocan: la reescritura es solo en la respuesta.

Uso:  python serve.py [puerto]
"""

import os
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO

ROOT = "tienda-virtual"
ASSET = re.compile(r'((?:href|src)=")([^"#?:]+\.(?:css|js))(")')


class DevHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, "index.html")
        if not path.endswith((".html", ".htm")) or not os.path.isfile(path):
            return super().send_head()

        with open(path, "rb") as f:
            body = ASSET.sub(self._stamp, f.read().decode("utf-8")).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return BytesIO(body) if self.command == "GET" else None

    def _stamp(self, match):
        prefix, url, suffix = match.groups()
        asset = os.path.join(ROOT, url.lstrip("/"))
        if not os.path.isfile(asset):
            return match.group(0)
        return f"{prefix}{url}?v={int(os.path.getmtime(asset))}{suffix}"


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    handler = partial(DevHandler, directory=ROOT)
    print(f"Tienda:  http://localhost:{port}")
    print(f"Admin:   http://localhost:{port}/admin.html")
    ThreadingHTTPServer(("", port), handler).serve_forever()
