# Sharing API Documentation

## Overview

The Principle Sharing API allows you to share concept maps publicly or with specific users, and export them in multiple formats.

**Base URL**: `http://localhost:3000/api` (development)

**Rate Limiting**: 100 requests per minute per IP address

---

## Table of Contents

1. [Authentication](#authentication)
2. [Public Share Endpoints](#public-share-endpoints)
3. [Map Management Endpoints](#map-management-endpoints)
4. [Error Responses](#error-responses)
5. [Code Examples](#code-examples)

---

## Authentication

Currently, the sharing API does not require authentication for **public share endpoints**. Authentication will be added in a future version for managing share settings.

---

## Public Share Endpoints

### Get Shared Map Data

Retrieve complete concept map data including nodes, edges, and media.

**Endpoint**: `GET /api/share/:shareSlug`

**Parameters**:
- `shareSlug` (path, required) - The unique share identifier
- `token` (query, optional) - Required for unlisted maps

**Response** (`200 OK`):
```json
{
  "version": "1.0",
  "exportedAt": "2025-12-31T12:00:00.000Z",
  "map": {
    "id": "uuid",
    "name": "My Concept Map",
    "description": "A sample concept map",
    "viewport": {"x": 0, "y": 0, "zoom": 1},
    "createdAt": "2025-12-30T10:00:00.000Z",
    "updatedAt": "2025-12-31T11:00:00.000Z"
  },
  "nodes": [
    {
      "id": "node-uuid",
      "title": "Node Title",
      "content": {"type": "doc", "content": [...]},
      "position": {"x": 100, "y": 200},
      "style": {},
      "shape": "rounded-rectangle",
      "imageIds": [],
      "tags": ["tag1", "tag2"],
      "createdAt": "2025-12-30T10:05:00.000Z",
      "updatedAt": "2025-12-30T10:05:00.000Z"
    }
  ],
  "edges": [
    {
      "id": "edge-uuid",
      "sourceNodeId": "node1-uuid",
      "targetNodeId": "node2-uuid",
      "sourceHandleId": "right",
      "targetHandleId": "left",
      "label": null,
      "style": {},
      "createdAt": "2025-12-30T10:10:00.000Z"
    }
  ],
  "media": [
    {
      "id": "media-uuid",
      "nodeId": "node-uuid",
      "originalName": "image.png",
      "url": "http://localhost:3000/api/media/file/abc123",
      "thumbnailUrl": "http://localhost:3000/api/media/file/abc123-thumb",
      "width": 1920,
      "height": 1080
    }
  ]
}
```

**Headers**:
- `Cache-Control: public, max-age=300` (cached for 5 minutes)
- `RateLimit-Limit: 100`
- `RateLimit-Remaining: 94`

**Errors**:
- `404` - Map not found
- `403` - Map is private or invalid token for unlisted map
- `429` - Rate limit exceeded (too many requests)

**Example**:
```bash
curl http://localhost:3000/api/share/my-concept-map-abc123
```

---

### Download JSON File

Download concept map as a JSON file.

**Endpoint**: `GET /api/share/:shareSlug/download.json`

**Parameters**:
- `shareSlug` (path, required) - The unique share identifier
- `token` (query, optional) - Required for unlisted maps

**Response** (`200 OK`):
- Same JSON structure as above
- Downloads as `{shareSlug}.json` file

**Headers**:
- `Content-Type: application/json`
- `Content-Disposition: attachment; filename="{shareSlug}.json"`
- `Cache-Control: public, max-age=300`

**Example**:
```bash
curl -O http://localhost:3000/api/share/my-concept-map-abc123/download.json
```

---

### Download HTML Viewer

Download standalone HTML viewer with embedded map data.

**Endpoint**: `GET /api/share/:shareSlug/download.html`

**Parameters**:
- `shareSlug` (path, required) - The unique share identifier
- `token` (query, optional) - Required for unlisted maps

**Response** (`200 OK`):
- Single HTML file with embedded React viewer and map data
- Works completely offline (except for images)
- File size: ~700KB - 2MB depending on map size

**Headers**:
- `Content-Type: text/html; charset=utf-8`
- `Content-Disposition: attachment; filename="{shareSlug}.html"`
- `Cache-Control: public, max-age=300`

**Example**:
```bash
curl -O http://localhost:3000/api/share/my-concept-map-abc123/download.html
```

---

## Map Management Endpoints

### Enable Sharing

Enable public sharing for a concept map.

**Endpoint**: `POST /api/mindmaps/:mapId/share`

**Parameters**:
- `mapId` (path, required) - The concept map UUID

**Request Body**:
```json
{
  "visibility": "public"  // or "unlisted"
}
```

**Response** (`200 OK`):
```json
{
  "visibility": "public",
  "shareSlug": "my-concept-map-abc123",
  "shareUrl": "http://localhost:5173/share/my-concept-map-abc123",
  "shareToken": null,  // or token string for unlisted maps
  "sharedAt": "2025-12-31T12:00:00.000Z"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/mindmaps/{mapId}/share \
  -H "Content-Type: application/json" \
  -d '{"visibility":"public"}'
```

---

### Get Sharing Settings

Get current sharing settings for a concept map.

**Endpoint**: `GET /api/mindmaps/:mapId/share`

**Parameters**:
- `mapId` (path, required) - The concept map UUID

**Response** (`200 OK`):
```json
{
  "visibility": "public",
  "shareSlug": "my-concept-map-abc123",
  "shareUrl": "http://localhost:5173/share/my-concept-map-abc123",
  "shareToken": null,
  "sharedAt": "2025-12-31T12:00:00.000Z"
}
```

**Response** (`404 Not Found`):
```json
{
  "error": "Map is not currently shared"
}
```

---

### Disable Sharing

Disable sharing for a concept map.

**Endpoint**: `DELETE /api/mindmaps/:mapId/share`

**Parameters**:
- `mapId` (path, required) - The concept map UUID

**Response** (`200 OK`):
```json
{
  "success": true
}
```

**Example**:
```bash
curl -X DELETE http://localhost:3000/api/mindmaps/{mapId}/share
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid parameters or request body |
| `403` | Forbidden - Map is private or invalid share token |
| `404` | Not Found - Map or share slug doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded (100 req/min) |
| `500` | Internal Server Error - Something went wrong on the server |

---

## Code Examples

### JavaScript (Fetch API)

```javascript
// Get shared map data
async function getSharedMap(shareSlug, token = null) {
  const url = new URL(`http://localhost:3000/api/share/${shareSlug}`);
  if (token) {
    url.searchParams.set('token', token);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Enable sharing
async function enableSharing(mapId, visibility = 'public') {
  const response = await fetch(`http://localhost:3000/api/mindmaps/${mapId}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ visibility }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Download JSON
function downloadJSON(shareSlug, token = null) {
  const url = new URL(`http://localhost:3000/api/share/${shareSlug}/download.json`);
  if (token) {
    url.searchParams.set('token', token);
  }

  window.open(url.toString(), '_blank');
}
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// Get shared map data
async function getSharedMap(shareSlug, token = null) {
  const response = await axios.get(`${API_BASE}/share/${shareSlug}`, {
    params: token ? { token } : {},
  });
  return response.data;
}

// Enable sharing
async function enableSharing(mapId, visibility = 'public') {
  const response = await axios.post(`${API_BASE}/mindmaps/${mapId}/share`, {
    visibility,
  });
  return response.data;
}

// Disable sharing
async function disableSharing(mapId) {
  const response = await axios.delete(`${API_BASE}/mindmaps/${mapId}/share`);
  return response.data;
}
```

### Python (requests)

```python
import requests

API_BASE = 'http://localhost:3000/api'

# Get shared map data
def get_shared_map(share_slug, token=None):
    url = f'{API_BASE}/share/{share_slug}'
    params = {'token': token} if token else {}

    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

# Enable sharing
def enable_sharing(map_id, visibility='public'):
    url = f'{API_BASE}/mindmaps/{map_id}/share'
    payload = {'visibility': visibility}

    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

# Download JSON file
def download_json(share_slug, token=None, output_file='map.json'):
    url = f'{API_BASE}/share/{share_slug}/download.json'
    params = {'token': token} if token else {}

    response = requests.get(url, params=params)
    response.raise_for_status()

    with open(output_file, 'w') as f:
        json.dump(response.json(), f, indent=2)
```

### cURL

```bash
# Get shared map data
curl http://localhost:3000/api/share/my-map-abc123

# Get unlisted map with token
curl "http://localhost:3000/api/share/my-map-abc123?token=secret-token-here"

# Download JSON
curl -O http://localhost:3000/api/share/my-map-abc123/download.json

# Download HTML
curl -O http://localhost:3000/api/share/my-map-abc123/download.html

# Enable public sharing
curl -X POST http://localhost:3000/api/mindmaps/{mapId}/share \
  -H "Content-Type: application/json" \
  -d '{"visibility":"public"}'

# Enable unlisted sharing (with secret token)
curl -X POST http://localhost:3000/api/mindmaps/{mapId}/share \
  -H "Content-Type: application/json" \
  -d '{"visibility":"unlisted"}'

# Get sharing settings
curl http://localhost:3000/api/mindmaps/{mapId}/share

# Disable sharing
curl -X DELETE http://localhost:3000/api/mindmaps/{mapId}/share
```

---

## Visibility Options

| Visibility | Description | Token Required | Public Listing |
|------------|-------------|----------------|----------------|
| `private` | Only accessible by owner (default) | N/A | No |
| `public` | Anyone with URL can access | No | Yes (future) |
| `unlisted` | Secret link - not publicly listed | Yes | No |

**Note**: Public vs Unlisted
- **Public**: Anyone can access with just the share slug
- **Unlisted**: Requires both share slug AND secret token in URL

---

## Best Practices

1. **Use Unlisted for Sensitive Maps**: If your concept map contains sensitive information, use `unlisted` visibility to require a secret token.

2. **Handle Rate Limits**: Check `RateLimit-Remaining` header and implement exponential backoff when limit is reached.

3. **Cache Responses**: The API returns `Cache-Control` headers - respect them to reduce server load.

4. **Error Handling**: Always handle `403` (private/invalid token) and `404` (not found) errors gracefully.

5. **HTTPS in Production**: Use HTTPS in production to protect share tokens from being intercepted.

---

## Future Features

- User authentication and authorization
- Team sharing with permissions
- Versioning and history
- Public gallery of shared maps
- Webhooks for share events
- Analytics (view counts, etc.)

---

## Support

For bug reports or feature requests, please open an issue on the [GitHub repository](https://github.com/your-repo/principle).

**Last Updated**: December 31, 2025
