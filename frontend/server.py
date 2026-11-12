import http.server
import socketserver
import os
import sys
import gzip
import io
import urllib.parse

PORT = 5500
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

COMPRESSIBLE_EXTS = ('.html', '.htm', '.css', '.js', '.json', '.svg', '.xml', '.map')

class OptimizedGzipHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_HEAD(self):
        f = self.send_head()
        if f:
            f.close()

    def do_GET(self):
        f = self.send_head()
        if f:
            try:
                self.copyfile(f, self.wfile)
            finally:
                f.close()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            parts = urllib.parse.urlsplit(self.path)
            if not parts.path.endswith('/'):
                self.send_response(http.HTTPStatus.MOVED_PERMANENTLY)
                new_parts = (parts[0], parts[1], parts[2] + '/', parts[3], parts[4])
                self.send_header("Location", urllib.parse.urlunsplit(new_parts))
                self.send_header("Content-Length", "0")
                self.end_headers()
                return None
            for index in "index.html", "index.htm":
                idx_path = os.path.join(path, index)
                if os.path.exists(idx_path):
                    path = idx_path
                    break
            else:
                return super().send_head()

        if not os.path.isfile(path):
            self.send_error(http.HTTPStatus.NOT_FOUND, "File not found")
            return None

        ctype = self.guess_type(path)
        clean_path = path.lower()

        try:
            with open(path, 'rb') as f:
                raw_bytes = f.read()
        except OSError:
            self.send_error(http.HTTPStatus.NOT_FOUND, "File not found")
            return None

        # Verificar se o cliente aceita compactação GZIP
        accept_enc = self.headers.get('Accept-Encoding', '')
        can_gzip = 'gzip' in accept_enc and any(clean_path.endswith(ext) for ext in COMPRESSIBLE_EXTS) and len(raw_bytes) > 256

        if can_gzip:
            payload = gzip.compress(raw_bytes, compresslevel=6)
        else:
            payload = raw_bytes

        self.send_response(http.HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(payload)))

        if can_gzip:
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")

        # Cache HTTP agressivo para assets
        if clean_path.endswith(('.woff2', '.woff', '.ttf', '.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico')):
            self.send_header('Cache-Control', 'public, max-age=86400, immutable')
        elif clean_path.endswith(('.css', '.js')):
            self.send_header('Cache-Control', 'public, max-age=7200')
        else:
            self.send_header('Cache-Control', 'no-cache, must-revalidate')

        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        return io.BytesIO(payload)

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 128

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    print(f"[*] Best Buddy - Frontend Server rodando em http://localhost:{port}/ com GZIP e Cache Otimizados")
    with ThreadingHTTPServer(("", port), OptimizedGzipHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nEncerrando servidor...")
