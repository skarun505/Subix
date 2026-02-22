import http.server
import socketserver
import os

PORT = 8000

class ExtensionlessHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Extract the path without query parameters or fragments
        path = self.path.split('?')[0].split('#')[0]
        
        # If path doesn't have an extension and isn't a directory, try adding .html
        if not os.path.splitext(path)[1] and not path.endswith('/'):
            if os.path.exists(path[1:] + '.html'):
                self.path = path + '.html' + self.path[len(path):]
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

print(f"Serving at http://localhost:{PORT}")
print("Press Ctrl+C to stop")
with socketserver.TCPServer(("", PORT), ExtensionlessHandler) as httpd:
    httpd.serve_forever()
