import os
import json
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

SYSTEM_PROMPT = """Je bent de AI-assistent van Social Island, een Belgisch digital agency gerund door Billy en Céline.
Social Island helpt ondernemers met AI-systemen, slimme funnels en advertentie back-ends zodat ze hun business op automatische piloot kunnen zetten.

Beantwoord vragen kort, vriendelijk en professioneel in het Nederlands.
Als iemand een afspraak wil, stuur hen naar: https://calendly.com/socialisland
Als iemand een vraag stelt die je niet kan beantwoorden, stel voor om een gratis strategiecall te boeken.
Spreek de bezoeker altijd aan met 'je/jij'.
Houd antwoorden beknopt (max 3-4 zinnen)."""


class Handler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            try:
                data    = json.loads(body)
                message = data.get('message', '').strip()
                if not message:
                    self._json(400, {'error': 'Geen bericht'})
                    return
                if not OPENAI_API_KEY:
                    self._json(500, {'error': 'API key niet geconfigureerd'})
                    return

                payload = json.dumps({
                    'model': 'gpt-4o-mini',
                    'messages': [
                        {'role': 'system', 'content': SYSTEM_PROMPT},
                        {'role': 'user',   'content': message}
                    ],
                    'max_tokens': 300,
                    'temperature': 0.7
                }).encode()

                req = urllib.request.Request(
                    'https://api.openai.com/v1/chat/completions',
                    data=payload,
                    headers={
                        'Authorization': f'Bearer {OPENAI_API_KEY}',
                        'Content-Type': 'application/json'
                    }
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    result  = json.loads(resp.read())
                    answer  = result['choices'][0]['message']['content'].strip()
                    self._json(200, {'reply': answer})

            except urllib.error.HTTPError as e:
                self._json(502, {'error': f'OpenAI fout: {e.code}'})
            except Exception as ex:
                self._json(500, {'error': str(ex)})
            return
        self.send_response(404)
        self.end_headers()

    def do_GET(self):
        if self.headers.get('X-Forwarded-Proto') == 'http':
            host = self.headers.get('Host', '')
            self.send_response(301)
            self.send_header('Location', f'https://{host}{self.path}')
            self.end_headers()
            return
        super().do_GET()

    def _json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

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
