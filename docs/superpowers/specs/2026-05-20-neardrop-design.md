# NearDrop — Design Spec

**Date:** 2026-05-20
**Status:** Approved
**Author:** ahomsi

---

## 1. Product Overview

NearDrop is a browser-based, PWA-installable file and text sharing app that works between any two devices on the same local WiFi network — or across any network via room codes. It requires no account, no cloud storage, and no app install. File data travels peer-to-peer via WebRTC DataChannels; the server never sees file contents.

**Core promise:** AirDrop-quality experience, open, browser-based, and privacy-first.

---

## 2. Goals

- Fully browser-based, installable as a PWA
- Fast local transfers (P2P via WebRTC DataChannels)
- No account required
- No external cloud storage — file data never touches a server
- Works on desktop and mobile
- Simple enough for non-technical users
- Personal-use first, but publicly accessible for others to use

---

## 3. Transfer Types (MVP)

- **Files** — any type, any size, no practical limit (chunked streaming)
- **Text snippets** — freeform text with a copy button on the receiver side

Not in MVP: clipboard auto-sync, link handling, folder transfers.

---

## 4. Architecture

### 4.1 Deployment

| Service | Stack | Host |
|---|---|---|
| `apps/web` | Next.js 14 (App Router) | Vercel (free CDN) |
| `apps/signaling` | Node.js + Socket.io | Railway (free tier) |
| `packages/shared` | TypeScript types | (local, consumed by both) |

Single monorepo managed with Turborepo. Vercel deploys from `apps/web`, Railway deploys from `apps/signaling`.

### 4.2 Data Flow

```
Browser A ──[Socket.io WSS]──▶ Signaling Server ◀──[Socket.io WSS]── Browser B
           ──────────── SDP offer/answer + ICE candidates only ────────────

Browser A ════════════════[WebRTC DataChannel, DTLS 1.3]════════════════ Browser B
                  File chunks + text — direct P2P, never touches server
```

The signaling server is stateless in memory. It holds room state in a `Map<roomCode, Set<peerId>>` only while peers are connected. Nothing is persisted to disk or a database.

### 4.3 External Services

| Service | Purpose | Cost |
|---|---|---|
| `stun.l.google.com:19302` | STUN / ICE | Free |
| Metered.ca TURN | Relay fallback when direct P2P fails | Free tier |

TURN is only used when NAT traversal fails (corporate firewalls, symmetric NAT). Home WiFi use almost never needs it.

---

## 5. Repository Structure

```
neardrop/
├── apps/
│   ├── web/                        # Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── page.tsx            # Home — device discovery
│   │   │   ├── room/[code]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── RadialCanvas.tsx    # SVG radial peer layout
│   │   │   ├── DeviceNode.tsx      # Single peer in radial view
│   │   │   ├── SendSheet.tsx       # Mobile bottom sheet
│   │   │   ├── DesktopSidebar.tsx  # Desktop left panel
│   │   │   ├── SendPanel.tsx       # Drop zone + text field
│   │   │   ├── TransferProgress.tsx
│   │   │   ├── QRCodePanel.tsx
│   │   │   ├── RoomCodeInput.tsx
│   │   │   └── IncomingAlert.tsx   # Accept/Reject prompt
│   │   ├── hooks/
│   │   │   ├── useSignaling.ts     # Socket.io client + reconnect
│   │   │   ├── useWebRTC.ts        # RTCPeerConnection lifecycle
│   │   │   ├── useTransfer.ts      # Chunked send + receive
│   │   │   └── usePeers.ts         # Peer list state
│   │   ├── lib/
│   │   │   ├── chunker.ts          # File → 64KB ArrayBuffer chunks
│   │   │   ├── assembler.ts        # Chunks → Blob (memory or IndexedDB)
│   │   │   ├── checksum.ts         # SHA-256 via Web Crypto API
│   │   │   └── deviceName.ts       # adjective + animal + emoji
│   │   ├── public/
│   │   │   ├── manifest.json       # PWA manifest
│   │   │   └── sw.js               # Service worker (next-pwa)
│   │   └── next.config.ts
│   │
│   └── signaling/                  # Node.js + Socket.io
│       ├── src/
│       │   ├── index.ts            # Fastify + Socket.io server
│       │   ├── rooms.ts            # In-memory room/peer state
│       │   ├── handlers.ts         # Socket event handlers
│       │   └── discovery.ts        # Public IP → auto-room grouping
│       └── Dockerfile
│
├── packages/
│   └── shared/
│       └── src/
│           ├── events.ts           # Socket.io event types
│           ├── transfer.ts         # DataChannel message types
│           └── peer.ts             # Peer + Room interfaces
│
├── turbo.json
├── package.json
└── .gitignore
```

---

## 6. Tech Stack

### Frontend (`apps/web`)
- **Next.js 14** (App Router) — framework
- **TypeScript** (strict) — language
- **TailwindCSS + shadcn/ui** — styling
- **Zustand** — peer/transfer state management
- **socket.io-client** — signaling connection
- **Native WebRTC API** — peer connection, DataChannels
- **qrcode** — QR code generation
- **html5-qrcode** — QR code scanning (camera)
- **next-pwa** — service worker + PWA manifest

### Signaling Server (`apps/signaling`)
- **Node.js 20 LTS** — runtime
- **Fastify** — HTTP (health check endpoint for Railway)
- **Socket.io 4** — WebSocket signaling
- **TypeScript** — language
- **nanoid** — room code generation
- **zod** — event payload validation

### Infrastructure
- **Turborepo** — monorepo build orchestration
- **Vercel** — frontend (free CDN tier)
- **Railway** — signaling server (free tier, persistent process)
- **Metered.ca** — TURN relay (free tier)

---

## 7. Device Identity

Each device gets a persistent identity stored in `localStorage`:

- **Name:** random adjective + animal (e.g. "Swift Fox", "Bold Penguin", "Calm Otter")
- **Icon:** emoji matched to the animal
- **Type:** auto-detected (`mobile` / `desktop`) via `navigator.userAgent`
- **ID:** `nanoid()` generated once, stored in `localStorage`

Users can tap their name to rename it at any time. The name is broadcast to peers on connection. Note: in private/incognito mode, `localStorage` is cleared on tab close — the device gets a new identity each session. This is acceptable behaviour and requires no special handling.

---

## 8. Peer Discovery

### Same-WiFi Auto-Discovery
The signaling server reads each socket's public IP from `socket.handshake.address`. Peers sharing the same public IP are placed in the same auto-room and see each other immediately with no user action.

**Limitation:** Breaks on large office/university networks where many users share one public IP. The room code fallback handles this case.

### Room Code / QR Pairing
- 6-character alphanumeric code generated with `nanoid` (e.g. `WOLF-42`)
- Expires after 10 minutes of inactivity
- Maximum 10 peers per room
- QR code encodes the full join URL: `https://<deployed-domain>/room/WOLF-42`
- Scanning with a phone camera opens the browser directly to the join page

---

## 9. WebRTC Connection Flow

```
1. Both peers join the same room (via IP grouping or room code)
2. Server emits peer-joined to existing peers
3. Initiator creates RTCPeerConnection + DataChannel('transfer')
4. Initiator: createOffer() → setLocalDescription() → emit('signal', offer)
5. Server relays signal to target peer
6. Responder: setRemoteDescription(offer) → createAnswer() → setLocalDescription() → emit('signal', answer)
7. Initiator: setRemoteDescription(answer)
8. Both sides exchange ICE candidates via emit('signal', { type: 'ice', ... })
9. DataChannel.onopen fires → P2P connection established
10. Signaling server no longer needed for data transfer
```

One `RTCPeerConnection` per peer pair. When peer C joins a room where A and B are already connected, both A and B independently initiate a connection to C — resulting in two separate RTCPeerConnections (A↔C and B↔C). The initiator in each pair is always the existing peer; the joiner is always the responder.

**Reconnection:** If the DataChannel closes unexpectedly, `useWebRTC` attempts to renegotiate automatically up to 3 times with exponential backoff (1s, 2s, 4s).

---

## 10. File Transfer Protocol

All messages travel over the WebRTC DataChannel as either JSON strings or binary `ArrayBuffer`.

### Message Types

| Type | Direction | Payload |
|---|---|---|
| `TRANSFER_OFFER` | Sender → Receiver | `{ id, name, size, mimeType, totalChunks, sha256 }` |
| `TRANSFER_ACCEPT` | Receiver → Sender | `{ id }` |
| `TRANSFER_REJECT` | Receiver → Sender | `{ id }` |
| `CHUNK` | Sender → Receiver | `ArrayBuffer` — first 4 bytes = `chunkIndex` (Uint32), rest = chunk data |
| `TRANSFER_DONE` | Sender → Receiver | `{ id, sha256 }` |
| `TRANSFER_ERROR` | Either | `{ id, reason }` |
| `TEXT_MESSAGE` | Either | `{ id, content, timestamp }` |

### Chunking
- Chunk size: **64KB** (65,536 bytes)
- Sender reads file with `File.slice()`, converts to `ArrayBuffer`, prepends 4-byte chunk index
- Backpressure: sender checks `channel.bufferedAmount` before each send; pauses when `> 16MB`, resumes on `bufferedamountlow` event

### Assembly
- Files **< 500MB**: chunks accumulated in a `Uint8Array[]` array in memory
- Files **≥ 500MB**: chunks written to IndexedDB keyed by `(transferId, chunkIndex)`
- On `TRANSFER_DONE`: reassemble into a `Blob`, compute SHA-256, compare with sender's hash
- On match: `URL.createObjectURL(blob)` → programmatic `<a>` click → browser download prompt
- Object URL revoked after 60 seconds

### Integrity
SHA-256 computed with `crypto.subtle.digest('SHA-256', buffer)` — no library needed. Mismatch triggers `TRANSFER_ERROR` and the user is notified.

---

## 11. Signaling Server API

### Socket.io Events

**Client → Server**

| Event | Payload |
|---|---|
| `join-room` | `{ roomCode?: string, deviceName: string, deviceType: 'mobile' \| 'desktop' }` |
| `signal` | `{ to: peerId, type: 'offer' \| 'answer' \| 'ice', payload: any }` |
| `leave-room` | `{ roomCode: string }` |

**Server → Client**

| Event | Payload |
|---|---|
| `room-joined` | `{ roomCode: string, peers: Peer[] }` |
| `peer-joined` | `{ peer: Peer }` |
| `peer-left` | `{ peerId: string }` |
| `signal` | `{ from: peerId, type: string, payload: any }` |
| `error` | `{ code: string, message: string }` |

### HTTP Endpoints
- `GET /health` — returns `{ status: 'ok' }` (used by Railway health checks)

---

## 12. UI / UX

### Responsive Layout Strategy

**Mobile (< 768px) — Radial View**
- Full-screen radial canvas: your device centered, peer devices orbiting
- Animated pulse rings radiate from center
- Tap a peer device → bottom sheet slides up with:
  - Drop zone (tap to file picker, or receive drops)
  - Text snippet field + send button
  - Active transfer progress
- "New Room" and "Join Code" buttons at the bottom of the radial view

**Desktop (≥ 768px) — Split Panel**
- Left sidebar (180px):
  - App name
  - Mini radial view of peers
  - Scrollable device list below the radial
  - New Room / Join Code buttons at bottom
- Right panel (flex):
  - Selected peer header (name, connection status, speed)
  - Large drop zone
  - Active transfer progress rows
  - Text snippet input bar

### Key UX Decisions
- **Accept/Reject on every incoming file** — files never arrive silently; receiver always sees filename + size before accepting
- **Screen-on nudge** — during active transfer, display a banner: "Keep screen on during transfer"
- **Device names** — animal + adjective makes it immediately obvious which device is which without any setup
- **Transfer speed shown** — "142 Mbps" in the connection status; real-time throughput calculated from chunk timing

### Visual Design
- **Palette:** Warm neutral — `#fafaf9` background, `#1c1917` text, `#f5f5f4` sidebar, `#e7e5e4` borders, `#16a34a` online indicator
- **Font:** System font stack (Inter or system-ui via Tailwind)
- **Radius:** 16–24px on cards, 50% on device avatars
- **Shadows:** Subtle — `0 2px 8px rgba(0,0,0,0.06)` only on elevated elements
- **Motion:** Pulse ring animation on radial view (CSS `@keyframes`); bottom sheet slide via Tailwind transitions

---

## 13. PWA Support

- `manifest.json`: name, short_name, icons (192×192, 512×512), `display: standalone`, `theme_color: #fafaf9`
- Service worker via `next-pwa`: caches app shell for offline load
- **Web Share Target API**: registered as a share target — on mobile, users can share files from Photos/Files directly to NearDrop
- **Limitation**: background transfers not possible in PWA; screen must stay awake during transfer

---

## 14. Security Model

| Layer | Mechanism |
|---|---|
| Transport encryption | DTLS 1.3 — mandatory on all WebRTC DataChannels, browser-enforced |
| Signaling transport | HTTPS + WSS — TLS in transit |
| File integrity | SHA-256 checksum verified on every transfer |
| Room access | 6-char code acts as a shared secret; rooms expire after 10min idle |
| Rate limiting | Signaling server: 30 socket events/sec per connection; 5 room joins/min per IP |
| Server visibility | Server sees: socket ID, public IP, room code, device name. Never sees: filenames, file content, text content |
| No auth | By design — zero friction is a feature; room codes provide sufficient pairing security for the use case |

---

## 15. MVP Scope

### In MVP
- Same-WiFi auto-discovery (IP-based grouping)
- Room code pairing (6-char code)
- QR code generation + scanning
- File transfer — any type, any size, chunked
- Text snippet send/receive with copy button
- Accept/Reject prompt on receiver
- SHA-256 integrity verification
- Transfer progress with speed estimate
- Responsive layout (radial mobile, split panel desktop)
- Device name + emoji system
- PWA manifest (installable)
- Service worker (offline shell)

### Post-MVP (Phase 2)
- Transfer history (IndexedDB)
- Multiple simultaneous transfers to different peers
- Drag file directly onto a device node in the radial view
- Web Share Target API registration
- Folder transfer (zip hint)
- Self-hostable Docker Compose image
- Dark mode variant

---

## 16. Scaling Considerations

The signaling server is stateless and tiny. At scale:
- Horizontal scaling requires sticky sessions (Socket.io + Redis adapter)
- At ~1,000 concurrent rooms: single Railway instance is sufficient
- At ~10,000+ concurrent rooms: add Redis adapter + multiple instances behind a load balancer
- File data is always P2P — the server load does not increase with file size or transfer speed

TURN relay is the only component that scales with traffic volume, since it proxies bytes. Metered.ca free tier covers ~500GB/month; upgrade or self-host `coturn` if usage grows.

---

## 17. Competitive Positioning

| Feature | NearDrop | AirDrop | Snapdrop | LocalSend |
|---|---|---|---|---|
| Browser-based | ✓ | ✗ | ✓ | ✗ |
| Cross-platform | ✓ | ✗ Apple only | ✓ | ✓ |
| No install required | ✓ | ✗ | ✓ | ✗ |
| Works across networks | ✓ | ✗ | ✗ | ✗ |
| Large file support | ✓ | ✓ | Limited | ✓ |
| Open source | ✓ | ✗ | ✓ | ✓ |
| PWA installable | ✓ | N/A | Partial | N/A |
| P2P (no relay) | ✓ | ✓ | ✓ | ✓ |

**Key differentiator:** Works across networks (room codes) while still doing auto-discovery on LAN. No other browser-based tool does both.

---

## 18. Complexity Estimate (Solo Developer)

| Phase | Scope | Estimate |
|---|---|---|
| Phase 1 — Core (MVP) | Signaling server, WebRTC connection, basic file transfer, minimal UI | 3–4 weeks |
| Phase 2 — Polish | Radial UI, QR pairing, PWA, progress tracking, mobile layout | 2–3 weeks |
| Phase 3 — Hardening | Reconnection logic, large file IndexedDB path, error handling, rate limiting | 1–2 weeks |
| **Total** | | **6–9 weeks** |

Overall complexity: **Medium-High** for a solo developer. WebRTC is the hardest part — signaling state machines, ICE negotiation edge cases, and DataChannel backpressure require careful implementation. Everything else is standard React/Node.js work.
