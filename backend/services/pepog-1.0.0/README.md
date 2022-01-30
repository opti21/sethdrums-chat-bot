# OneThirtyOne | PepoG

![](https://cdn.betterttv.net/emote/609258eb39b5010444d0be7c/2x)

GRPC service to retrieve key info from YouTube videos. Error responses are raw returns so should be handled
gracefully on the consuming service. Response times are highly dependent on peering to a Google/YouTube edge 
node but hover around the 50ms RTT range.

---
## Setup
- Get a Google services API key with YouTube as an enabled application
- Copy .env.dist to .env and fill out `GOOGLE_API_KEY` variable
- `go run cmd/app.go`
- import `proto/lookup.proto` into BloomRPC

---
## Example Requests/Responses

#### Request Body
```json
{
  "id": "fefa7074-17b5-4e5b-a8eb-750873eb14d6",
  "video_id": "laj9QjtgARc",
  "region": "US"
}
```

#### Successful Response
```json
{
  "id": "laj9QjtgARc",
  "title": "The Midnight - Monsters (Feint Remix)",
  "channel": "Feint",
  "region_blocked": false,
  "embed_blocked": false,
  "duration": "199"
}
```

#### Region Blocked Response
```json
{
  "id": "P-WP6POdTgY",
  "title": "Belinda Carlisle - Heaven Is A Place On Earth (Official Music Video)",
  "channel": "Cover Story / Best Hits",
  "region_blocked": true,
  "embed_blocked": false,
  "duration": "252"
}
```

#### Invalid Video ID Response
```json
{
  "error": "2 UNKNOWN: no results for provided video id"
}
```

---

#### Todo List
- Implement cache layer
- Background refresh of cached video details