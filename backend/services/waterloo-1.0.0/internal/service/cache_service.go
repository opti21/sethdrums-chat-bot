package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/bouffdaddy/waterloo/internal/model"

	p "github.com/bouffdaddy/waterloo/internal/proto"
	"github.com/go-redis/redis/v8"
	"github.com/sirupsen/logrus"
)

type redisCredentials struct {
	host string
	port string
	pass string
	ttl  int
}
type cacheService struct {
	secrets *redisCredentials
	logger  *logrus.Entry
	redis   *redis.Client
	p.UnimplementedPublicQueueCacheServiceServer
}

func NewCacheService(l *logrus.Entry, host, port, pass string, ttl int) *cacheService {
	s := &cacheService{
		secrets: &redisCredentials{
			host: host,
			port: port,
			pass: pass,
			ttl:  ttl,
		},
		logger: l,
	}

	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", s.secrets.host, s.secrets.port),
		Password: s.secrets.pass,
	})

	if _, err := client.Ping(context.Background()).Result(); err != nil {
		l.WithError(err).Panic("could not connect to redis")
	}

	l.Info("connected to redis")

	s.redis = client

	return s
}

func (s cacheService) Lookup(ctx context.Context, search *p.CacheSearch) (*p.CacheResult, error) {
	res := s.redis.Get(context.Background(), search.GetVideoId()).Val()
	l := s.logger.WithContext(ctx)

	msg := p.CacheResult{}
	if res != "" {
		msg.Found = true

		m := model.Track{}
		err := json.Unmarshal([]byte(res), &m)
		if err != nil {
			l.Warn(fmt.Sprintf("failed to unmarshal for [%s]", search.VideoId))

			return &msg, nil
		}

		proto := p.CacheResult{
			Found:         true,
			Id:            m.ID,
			Title:         m.Title,
			Channel:       m.Channel,
			RegionBlocked: m.RegionBlock,
			EmbedBlocked:  m.EmbedBlocked,
			Duration:      m.Duration,
		}

		return &proto, nil
	}

	l.Warn(fmt.Sprintf("cache miss for [%s]", search.VideoId))

	return &msg, nil
}

func (s cacheService) Store(ctx context.Context, v *p.CacheVideoDetails) (*p.StoreStatus, error) {
	l := s.logger.WithContext(ctx)

	m := model.Track{
		ID:           v.GetId(),
		Title:        v.GetTitle(),
		Channel:      v.GetChannel(),
		RegionBlock:  v.GetRegionBlocked(),
		EmbedBlocked: v.GetEmbedBlocked(),
		Duration:     v.GetDuration(),
	}
	str, err := json.Marshal(m)
	if err != nil {
		l.WithError(err).Warn("failed to marshal video details")

		return &p.StoreStatus{
			State: false,
			Ttl:   0,
		}, nil
	}
	_, err = s.redis.Set(context.Background(), v.GetId(), str, time.Duration(3600)).Result()
	if err != nil {
		l.WithError(err).Warn("failed to store video details")

		return &p.StoreStatus{
			State: false,
			Ttl:   0,
		}, nil
	}

	l.Infof("stored metadata for video [%s]", v.GetId())
	return &p.StoreStatus{
		State: true,
		Ttl:   int64(s.secrets.ttl),
	}, nil
}
