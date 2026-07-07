#!/usr/bin/env python3
"""Render Mermaid diagrams to PNG via the mermaid.ink API.

Usage:
    python3 bin/render-mermaid.py <input.mmd> <output.png>
    echo 'graph TD; A-->B' | python3 bin/render-mermaid.py - output.png
"""

import sys
import base64
import urllib.request
import urllib.error


def render(input_path: str, output_path: str) -> None:
    if input_path == "-":
        diagram = sys.stdin.read()
    else:
        with open(input_path, "r", encoding="utf-8") as f:
            diagram = f.read()

    diagram = diagram.strip()
    encoded = base64.urlsafe_b64encode(diagram.encode("utf-8")).decode("ascii")
    url = f"https://mermaid.ink/img/{encoded}?type=png"

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.reason}", file=sys.stderr)
        print(f"URL prefix: {url[:80]}...", file=sys.stderr)
        sys.exit(1)

    with open(output_path, "wb") as f:
        f.write(data)

    print(f"Rendered -> {output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 bin/render-mermaid.py <input.mmd|-> <output.png>")
        sys.exit(1)

    render(sys.argv[1], sys.argv[2])
