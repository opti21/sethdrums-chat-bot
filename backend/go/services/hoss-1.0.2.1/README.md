# OneThirtyOne | Hoss

GRPC service for storage of banned tracks.

---
## Setup
- Install MySQL (or have a remote redis instance/container running)
- Copy .env.dist to .env and fill out any unset variables
- `go run cmd/app.go`
- import `proto/hoss.proto` into BloomRPC

## Flow
- Check if a song is on the banned tracks list
- Submit status of a track's PG check

---
## Example Requests/Responses
### Query All Banned Tracks
#### Request Body
```json
{}
```

### List Banned List
#### Request Body
```json
{
  "banned_tracks": [
    {
      "video_id": "jZQ7KTd6xpc",
      "status": true,
      "reason": "Example Banned Track",
      "added_by": "mean_mod",
      "timestamp": "1631478224"
    },
    {
      "video_id": "_Vz3_F-iaSQ",
      "status": true,
      "reason": "Another Banned Track",
      "added_by": "mean_mod",
      "timestamp": "1631478224"
    }
  ]
}
```

### Query Single Track
#### Request Body
```json
{
  "video_id": "_Vz3_F-iaSQ"
}
```

#### Response Body
##### Banned Track
```json
{
  "video_id": "_Vz3_F-iaSQ",
  "status": true,
  "reason": "Another Banned Track",
  "added_by": "mean_mod",
  "timestamp": "1631478224"
}
```

##### Not Banned Track
```json
{
  "video_id": "_Vz3_F-iaSQ",
  "status": false,
  "reason": "",
  "added_by": "",
  "timestamp": ""
}
```

### Add Banned Track
#### Request Body
```json
{
  "video_id": "_Vz3_F-iaSQ",
  "reason": "Another Banned Track",
  "added_by": "mean_mod"
}
```

#### Response Body
```json
{
  "video_id": "_Vz3_F-iaSQ",
  "status": true,
  "reason": "Another Banned Track",
  "added_by": "mean_mod",
  "timestamp": "1631478224"
}
```

### Remove Banned Track
#### Request Body
```json
{
  "video_id": "_Vz3_F-iaSQ"
}
```

#### Response Body
```json
{
  "removed": true
}
```

