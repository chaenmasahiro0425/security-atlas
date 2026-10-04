#!/usr/bin/env python3
"""Collect public feed metadata only. Never infer incidents or scrape article bodies."""
import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

FEEDS = [
    {"name": "JPCERT/CC", "url": "https://www.jpcert.or.jp/rss/jpcert.rdf", "kind": "公式の注意喚起"},
    {"name": "piyolog", "url": "https://piyolog.hatenadiary.jp/rss", "kind": "二次情報・調査の入口"},
]
MAX_BYTES = 4 * 1024 * 1024


def safe_url(value):
    try:
        parsed = urlsplit(value)
        return parsed.scheme == "https" and bool(parsed.hostname) and not parsed.username and not parsed.password
    except ValueError:
        return False


def parse_feed(body, feed):
    if len(body) > MAX_BYTES or re.search(br"<!\s*(?:DOCTYPE|ENTITY)", body, re.I):
        raise ValueError("Unsafe or oversized XML")
    root = ET.fromstring(body)
    items = []
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1] != "item":
            continue
        fields = {child.tag.rsplit("}", 1)[-1]: (child.text or "").strip() for child in element}
        title, url = fields.get("title", ""), fields.get("link", "")
        date = fields.get("date") or fields.get("pubDate")
        if not title or not safe_url(url) or not date:
            continue
        try:
            try:
                published = datetime.fromisoformat(date.replace("Z", "+00:00"))
            except ValueError:
                published = parsedate_to_datetime(date)
            if published.tzinfo is None:
                published = published.replace(tzinfo=timezone.utc)
            published = published.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        except (ValueError, TypeError, OverflowError):
            continue
        items.append({"id": hashlib.sha256(url.encode()).hexdigest()[:24], "title": title[:500], "url": url,
                      "publishedAt": published, "source": feed["name"], "kind": feed["kind"], "status": "未確認"})
    if not items:
        raise ValueError("Feed contains no valid items")
    return items


def collect(previous=None, opener=urlopen):
    previous = previous or {"items": []}
    # Keep previous metadata verbatim: same URL is never overwritten by a later feed.
    items = {item["url"]: item for item in previous["items"]}
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    results = []
    for feed in FEEDS:
        try:
            request = Request(feed["url"], headers={"User-Agent": "SecurityAtlas/1.0 (+https://github.com/chaenmasahiro0425/security-atlas)"})
            with opener(request, timeout=30) as response:
                if not safe_url(response.geturl()) or urlsplit(response.geturl()).hostname != urlsplit(feed["url"]).hostname:
                    raise ValueError("Unexpected feed redirect")
                entries = parse_feed(response.read(MAX_BYTES + 1), feed)
            for item in entries:
                items.setdefault(item["url"], item)
            results.append({**feed, "status": "ok", "count": len(entries), "lastSuccessAt": now})
        except Exception as error:
            # Log the class only; remote content and potential credentials are not logged.
            results.append({**feed, "status": "error", "error": type(error).__name__})
    if all(result["status"] == "error" for result in results):
        raise RuntimeError("All feeds failed; previous output preserved")
    return {"fetchedAt": now, "feeds": results,
            "items": sorted(items.values(), key=lambda item: (item["publishedAt"], item["url"]), reverse=True)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="public/data/security-news.json")
    parser.add_argument("--previous", help="Previously approved JSON; read only")
    args = parser.parse_args()
    target = Path(args.output)
    if target.exists():
        parser.error("Output exists; choose a new path. Existing data is never overwritten.")
    previous = json.loads(Path(args.previous).read_text()) if args.previous else None
    result = collect(previous)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(f"Collected {len(result['items'])} items; {sum(f['status'] == 'error' for f in result['feeds'])} feed failures")
    if any(feed["status"] == "error" for feed in result["feeds"]):
        sys.exit(2)


if __name__ == "__main__":
    main()
