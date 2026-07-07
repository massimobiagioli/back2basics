# HTTP Protocol

**One-liner**: HTTP is the foundation of the web — a stateless, text-based request-response protocol that lets clients ask servers for resources.

---

## How HTTP Works

![HTTP request-response flow](http-request-response.png)

Every HTTP interaction is a **request** from the client followed by a **response** from the server. The server never initiates.

---

## Request Structure

```
METHOD /path HTTP/VERSION
Header: value

[optional body]
```

Example:

```
POST /api/users HTTP/1.1
Host: api.example.com
Content-Type: application/json

{"name": "Alice"}
```

---

## HTTP Methods

| Method | Purpose | Idempotent | Has Body |
|--------|---------|------------|----------|
| **GET** | Read a resource | ✅ | ❌ |
| **POST** | Create a resource | ❌ | ✅ |
| **PUT** | Replace a resource | ✅ | ✅ |
| **PATCH** | Partially update | ❌ | ✅ |
| **DELETE** | Remove a resource | ✅ | ❌ |
| **HEAD** | Like GET, but no body | ✅ | ❌ |
| **OPTIONS** | Check allowed methods | ✅ | ❌ |

**Idempotent** means: calling it N times has the same effect as calling it once. PUT, DELETE, GET are idempotent. POST is not.

---

## Status Codes

| Range | Meaning | Examples |
|-------|---------|----------|
| **1xx** | Informational | `100 Continue` |
| **2xx** | Success | `200 OK`, `201 Created`, `204 No Content` |
| **3xx** | Redirection | `301 Moved Permanently`, `302 Found`, `304 Not Modified` |
| **4xx** | Client Error | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable` |
| **5xx** | Server Error | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` |

**Key ones for REST APIs**: `200`, `201`, `204`, `301`, `400`, `401`, `403`, `404`, `422`, `500`.

---

## Headers

Headers are key-value metadata attached to every request and response.

### Request Headers

| Header | Example | Purpose |
|--------|---------|---------|
| `Host` | `api.example.com` | Which domain (required in HTTP/1.1) |
| `Content-Type` | `application/json` | Format of the body |
| `Accept` | `application/json` | Format the client wants back |
| `Authorization` | `Bearer <token>` | Authentication |
| `User-Agent` | `Mozilla/5.0...` | Client identification |

### Response Headers

| Header | Example | Purpose |
|--------|---------|---------|
| `Content-Type` | `text/html` | Format of the body |
| `Cache-Control` | `max-age=3600` | Caching rules |
| `Set-Cookie` | `session=abc` | Store data on the client |
| `Location` | `/new-url` | Used with 3xx redirects |

---

## Content Negotiation

The client says what it wants (`Accept` header), the server says what it's sending (`Content-Type` header).

```
Request:  Accept: application/json
Response: Content-Type: application/json
```

If the server can't provide the requested format, it returns `406 Not Acceptable`.

---

## Statelessness

HTTP is **stateless**: each request is independent. The server does not remember previous requests.

This is why we have:
- **Cookies**: stored on the client, sent with every request
- **Tokens** (JWT, OAuth): sent in `Authorization` header
- **Sessions**: server-side state referenced by a cookie

For REST APIs, statelessness is a feature: each request must contain everything the server needs to process it.

---

**Check Your Understanding**

> **Q:** Why is POST not idempotent while PUT is?
>
> <details><summary>Answer</summary>
> PUT replaces the resource at a specific URI — sending the same PUT twice has the same result. POST typically creates a new resource — sending the same POST twice creates two resources.
> </details>

> **Q:** When would you return `201 Created` vs `200 OK`?
>
> <details><summary>Answer</summary>
> `201 Created` means a new resource was created (typically in response to POST). `200 OK` means the request succeeded and the response contains the requested data (typically GET or PUT).
> </details>
