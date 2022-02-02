package model

type Track struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Channel      string `json:"channel"`
	RegionBlock  bool   `json:"region_blocked"`
	EmbedBlocked bool   `json:"embed_blocked"`
	Duration     int64  `json:"duration"`
}
