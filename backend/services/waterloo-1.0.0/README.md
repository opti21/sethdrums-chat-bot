# OneThirtyOne | Waterloo

GRPC cache layer for track metadata.

---
## Setup
- Install Redis (or have a remote redis instance/container running)
- Copy .env.dist to .env and fill out any unset variables
- `go run cmd/app.go`
- import `proto/waterloo.proto` into BloomRPC

## Flow
- Interceptor queries this service with a video ID
- If a match is found, return the video metadata
- If a cache miss is incurred query the video metadata through PepoG
- Store the result from PepoG into Waterloo
---
## Example Requests/Responses
### Query Cache
#### Request Body
```json
{
  "video_id": "t1a5jHVj4T4"
}
```

#### Cache Miss
```json
{
  "id": "",
  "title": "",
  "channel": "",
  "region_blocked": false,
  "embed_blocked": false,
  "duration": 0,
  "found": false
}
```

### Cache Hit
```json
{
  "id": "t1a5jHVj4T4",
  "title": "Lida x CMH x ЮГ 404 - Паркур (Lida prod.) [Премьера клипа, 2020]",
  "channel": "Lida",
  "region_blocked": false,
  "embed_blocked": false,
  "duration": "291",
  "found": true
}
```
## Store To Cache
#### Request Body
```json
{
  "id": "t1a5jHVj4T4",
  "title": "Lida x CMH x ЮГ 404 - Паркур (Lida prod.) [Премьера клипа, 2020]",
  "channel": "Lida",
  "region_blocked": false,
  "embed_blocked": false,
  "duration": "291"
}
```

#### Response Body
```json
{
  "state": true,
  "ttl": "1209600"
}
```
