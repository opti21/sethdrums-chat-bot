package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/bouffdaddy/pepog/internal/model"
	"github.com/bouffdaddy/pepog/internal/proto"
	"github.com/rickb777/date/period"
	"github.com/sirupsen/logrus"
)

const (
	GoogleApiFqdn     = "https://www.googleapis.com"
	GoogleApiEndpoint = "/youtube/v3/videos?id=%s&key=%s&part=%s"
	GoogleApiParts    = "snippet,contentDetails,status"
)

type youtubeService struct {
	APIKey string
	logger *logrus.Entry
	proto.UnimplementedVideoDetailsServiceServer
}

func NewYoutubeService(l *logrus.Entry, key string) *youtubeService {
	return &youtubeService{
		APIKey: key,
		logger: l,
	}
}

func (s youtubeService) Lookup(ctx context.Context, r *proto.ContentLookup) (*proto.VideoDetails, error) {
	l := s.logger.WithContext(ctx).WithTime(time.Now())
  fmt.Println(r.VideoId)

	payload := model.YoutubeVideoInfo{}

	url := s.queryUrl(r.VideoId)

	rsp, err := http.Get(url)
	if err != nil {
		l.WithError(err).Warn("failed to request from YouTube")
		return nil, err
	}

	if err = json.NewDecoder(rsp.Body).Decode(&payload); err != nil {
		l.WithError(err).Warn("failed to decode body")
		return nil, err
	}

	if len(payload.Items) < 1 {
		l.Warn("no results for video ID")
		return nil, errors.New("no results for provided video id")
	}

	m := payload.Items[0]

	duration, err := s.parseDuration(m.ContentDetails.Duration)
	if err != nil {
		l.WithError(err).Warn("failed to parse duration")
		return nil, err
	}

	l.Infof("serving response for %s", r.Id)

	return &proto.VideoDetails{
		Id:            m.ID,
		Title:         m.Snippet.Title,
		Channel:       m.Snippet.ChannelTitle,
		RegionBlocked: s.isRegionRestricted(m, r.Region),
		EmbedBlocked:  s.isEmbedBlocked(m),
		Duration:      duration,
	}, nil
}

func (s youtubeService) isRegionRestricted(m model.YoutubeItem, region string) bool {
	for _, c := range m.ContentDetails.RegionRestriction.Allowed {
		if c == region {
			return false
		}
	}

	for _, c := range m.ContentDetails.RegionRestriction.Blocked {
		if c == region {
			s.logger.Warnf("%s is explicitly blocked in %s", m.Snippet.Title, region)
			return true
		}
	}

	return false
}

func (s youtubeService) buildURL(m model.YoutubeItem) string {
	return fmt.Sprintf("https://youtu.be/%s", m.ID)
}

func (s youtubeService) parseDuration(duration string) (int64, error) {
	p, err := period.Parse(duration)
	if err != nil {
		return 0, err
	}

	totalDuration := 0
	totalDuration += p.Seconds()
	totalDuration += p.Minutes() * 60
	totalDuration += p.Hours() * 60 * 60

	t := int64(totalDuration)

	return t, nil
}

func (s youtubeService) isEmbedBlocked(m model.YoutubeItem) bool {
	if m.Status.Embeddable == false {
		return true
	}

	return false
}

func (s youtubeService) queryUrl(videoID string) string {
	uri := fmt.Sprintf(GoogleApiEndpoint, videoID, s.APIKey, GoogleApiParts)

	return fmt.Sprintf("%s%s", GoogleApiFqdn, uri)
}
