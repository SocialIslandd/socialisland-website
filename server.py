import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.headers.get('X-Forwarded-Proto') == 'http':
            host = self.headers.get('Host', '')
            self.send_response(301)
            self.send_header('Location', f'https://{host}{self.path}')
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        super().end_headers()

    def log_message(self, format, *args):
        pass

port = int(os.environ.get("PORT", 8080))
server = HTTPServer(("0.0.0.0", port), Handler)
print(f"Listening on port {port}", flush=True)
server.serve_forever()
