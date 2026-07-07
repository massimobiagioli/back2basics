# Networking Fundamentals

**One-liner**: Networking is how computers talk to each other using a layered stack of protocols that handle everything from physical signals to application data.

---

## The TCP/IP Stack

The TCP/IP model has four layers. Each layer encapsulates the data from the layer above.

![TCP/IP Stack diagram](tcp-ip-stack.png)

- **Link Layer**: Moves frames between two directly connected nodes (MAC addresses).
- **Internet Layer**: Routes packets across networks (IP addresses).
- **Transport Layer**: Delivers data reliably (TCP) or quickly (UDP) between processes (ports).
- **Application Layer**: Protocols that applications use directly (HTTP, DNS, SSH).

### Encapsulation

Data flows down the stack when sending: each layer wraps the payload from above with its own header. When receiving, each layer strips its header and passes the payload up.

---

## IP Addressing

Every device on the internet has an IP address. IPv4 addresses are 32 bits, written as four octets: `192.168.1.1`.

### Subnet Masks

A subnet mask tells you which part of the IP is the **network** and which is the **host**:

```
IP:   192.168.1.42
Mask: 255.255.255.0  → Network: 192.168.1.0, Host: 42
```

### CIDR Notation

`192.168.1.0/24` means "the first 24 bits are the network prefix." Equivalent to mask `255.255.255.0`.

| CIDR | Mask | Hosts |
|------|------|-------|
| /8 | 255.0.0.0 | ~16 million |
| /16 | 255.255.0.0 | 65,534 |
| /24 | 255.255.255.0 | 254 |

---

## DNS: The Internet's Phonebook

DNS translates human-readable names (`google.com`) to IP addresses (`142.250.185.78`).

### Domain Hierarchy

```
Root (.)
 └── com
      └── example
           ├── www   (A record → IP)
           └── mail  (A record → IP)
```

### Record Types

| Record | Purpose | Example |
|--------|---------|---------|
| **A** | Maps domain to IPv4 | `example.com → 93.184.216.34` |
| **AAAA** | Maps domain to IPv6 | `example.com → 2606:2800:220:1:248:1893:25c8:1946` |
| **CNAME** | Alias to another domain | `www.example.com → example.com` |
| **MX** | Mail server | `example.com → mail.example.com` |
| **TXT** | Arbitrary text | SPF, DKIM, verification |

### Subdomains

A subdomain is a prefix added to a domain: `blog.example.com`. Each subdomain can have its own DNS records and point to a different server.

### CNAME vs A

- An **A record** points directly to an IP address. Use it for root domains and when the IP is stable.
- A **CNAME** points to another domain name. Use it for subdomains that should always follow the target. **Never use CNAME on a root domain** (RFC violation).

### TTL (Time to Live)

TTL tells DNS resolvers how long to cache a record (in seconds). Low TTL = faster propagation on changes, more DNS queries. High TTL = cheaper, slower to change.

---

## Routing

Routers forward packets between networks using routing tables. The key concept: a router only needs to know the **next hop**, not the entire path.

---

**Check Your Understanding**

> **Q:** Why can't you use a CNAME on the root domain (`example.com`)?
>
> <details><summary>Answer</summary>
> A CNAME cannot coexist with other records (like SOA or NS) that the root domain requires. RFC 1034 prohibits it. Use an A record or an ALIAS/ANAME record (provider-specific).
> </details>

> **Q:** What happens to DNS resolution when TTL expires?
>
> <details><summary>Answer</summary>
> The resolver discards the cached record and queries the authoritative nameserver again. If the IP has changed since the last query, the resolver gets the new value.
> </details>
