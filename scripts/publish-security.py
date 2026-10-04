"""Append an immutable snapshot on the dedicated feed branch; never overwrite data."""
import base64
import json
import os
import urllib.error
import urllib.request

repo = os.environ['GITHUB_REPOSITORY']
branch = 'feat-security-feed'
def api(path, body=None, method=None):
    request = urllib.request.Request('https://api.github.com/repos/' + repo + path,
        data=None if body is None else json.dumps(body).encode(), method=method,
        headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'SecurityAtlas'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)
try:
    api('/git/ref/heads/' + branch)
except urllib.error.HTTPError as error:
    if error.code != 404: raise
    main = api('/git/ref/heads/main')
    api('/git/refs', {'ref': 'refs/heads/' + branch, 'sha': main['object']['sha']}, 'POST')
with open('/tmp/security-news.json', 'rb') as file:
    snapshot = file.read()
data = json.loads(snapshot)
if not all(feed['status'] == 'ok' for feed in data['feeds']):
    raise ValueError('partial collection cannot publish')
path = 'feed-snapshots/security-news-' + os.environ['GITHUB_RUN_ID'] + '-' + os.environ['GITHUB_RUN_ATTEMPT'] + '.json'
api('/contents/' + path, {'message': 'Add daily security snapshot ' + os.environ['GITHUB_RUN_ID'], 'branch': branch, 'content': base64.b64encode(snapshot).decode()}, 'PUT')
print('Published immutable snapshot: ' + path)
