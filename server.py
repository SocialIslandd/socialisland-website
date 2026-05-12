import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

port = int(os.environ.get("PORT", 8080))
server = HTTPServer(("0.0.0.0", port), SimpleHTTPRequestHandler)
print(f"Listening on port {port}", flush=True)
server.serve_forever()
