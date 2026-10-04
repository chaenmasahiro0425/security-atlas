import importlib.util
import unittest
from io import BytesIO

spec = importlib.util.spec_from_file_location("collector", "scripts/collect-security.py")
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)


class Response(BytesIO):
    def __init__(self, body, url):
        super().__init__(body)
        self.url = url

    def geturl(self):
        return self.url


RSS = b'<rss><channel><item><title>A &amp; B</title><link>https://example.org/a</link><pubDate>Sat, 03 Oct 2026 00:11:21 +0900</pubDate></item></channel></rss>'


class CollectorTests(unittest.TestCase):
    def test_rss_and_rdf_dates_and_plain_text(self):
        self.assertEqual(c.parse_feed(RSS, c.FEEDS[0])[0]["publishedAt"], "2026-10-02T15:11:21Z")
        rdf = b'<rdf:RDF xmlns:rdf="urn:rdf" xmlns="urn:rss" xmlns:dc="urn:dc"><item><title>Notice</title><link>https://example.org/a</link><dc:date>2026-10-02T10:00:00+09:00</dc:date></item></rdf:RDF>'
        self.assertEqual(c.parse_feed(rdf, c.FEEDS[0])[0]["publishedAt"], "2026-10-02T01:00:00Z")

    def test_unsafe_xml_and_urls_are_rejected(self):
        for xml in [b'<!DOCTYPE rss><rss/>', b'<!ENTITY test "a"><rss/>', b'x' * (c.MAX_BYTES + 1), RSS.replace(b'https://example.org/a', b'javascript:alert(1)'), RSS.replace(b'https://example.org/a', b'https://user:pass@example.org/a')]:
            with self.assertRaises((ValueError, c.ET.ParseError)):
                c.parse_feed(xml, c.FEEDS[0])

    def test_deduplication_preserves_existing_metadata(self):
        previous = {"items": c.parse_feed(RSS, c.FEEDS[0])}
        previous["items"][0]["title"] = "Approved title"
        result = c.collect(previous, lambda request, timeout: Response(RSS, request.full_url))
        self.assertEqual(len(result["items"]), 1)
        self.assertEqual(result["items"][0]["title"], "Approved title")
        self.assertEqual(previous["items"][0]["title"], "Approved title")

    def test_partial_failure_preserves_old_items_and_reports_failure(self):
        def opener(request, timeout):
            if "piyolog" in request.full_url:
                raise TimeoutError()
            return Response(RSS, request.full_url)
        result = c.collect({"items": [{"url": "https://example.org/old", "publishedAt": "2020-01-01T00:00:00Z"}]}, opener)
        self.assertEqual(len(result["items"]), 2)
        self.assertEqual(result["feeds"][1]["status"], "error")

    def test_total_failure_and_unexpected_redirect_fail_closed(self):
        with self.assertRaises(RuntimeError):
            c.collect(opener=lambda request, timeout: Response(RSS, "https://other.example/feed"))


if __name__ == "__main__":
    unittest.main()
