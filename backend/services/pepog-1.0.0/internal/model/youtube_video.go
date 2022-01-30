package model

type YoutubeVideoInfo struct {
	Items []YoutubeItem `json:"items"`
}

type YoutubeItem struct {
	ID             string         `json:"id"`
	Snippet        Snippet        `json:"snippet"`
	ContentDetails ContentDetails `json:"contentDetails"`
	Status         Status         `json:"status"`
}

type Snippet struct {
	ChannelID    string `json:"channelId"`
	Title        string `json:"title"`
	ChannelTitle string `json:"channelTitle"`
}

type ContentDetails struct {
	Duration          string             `json:"duration"`
	RegionRestriction RegionRestrictions `json:"regionRestriction"`
}

type RegionRestrictions struct {
	Allowed []string `json:"allowed"`
	Blocked []string `json:"blocked"`
}

type Status struct {
	Embeddable bool `json:"embeddable"`
}
