#!/usr/bin/env python3
"""Simple HTTP server for Flags Battle Pro."""
import http.server, socketserver, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
    }

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"\n  🏁 Flags Battle Pro running at http://localhost:{PORT}\n")
    httpd.serve_forever()

