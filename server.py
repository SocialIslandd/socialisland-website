import os
import http.server
import socketserver

PORT = int(os.environ.get("PORT", 8080))

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # suppress logs

httpd = socketserver.TCPServer(("0.0.0.0", PORT), Handler)
httpd.allow_reuse_address = True
print(f"Serving on 0.0.0.0:{PORT}", flush=True)
httpd.serve_forever()
