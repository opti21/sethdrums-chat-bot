package service

import (
	"context"
	"time"

	"github.com/pkg/errors"

	p "github.com/bouffdaddy/hoss/internal/proto"
	"github.com/bouffdaddy/hoss/internal/storage"
	"github.com/sirupsen/logrus"
)

type bannedTrackService struct {
	logger *logrus.Entry
	db     *storage.MySQL
	p.UnimplementedBannedTracksServiceServer
}

func NewBannedTracksService(l *logrus.Entry, db *storage.MySQL) *bannedTrackService {
	return &bannedTrackService{
		logger: l,
		db:     db,
	}
}

func (s *bannedTrackService) GetAll(ctx context.Context, _ *p.NullMessage) (*p.ListBannedTracks, error) {
	l := s.logger.WithContext(ctx)
	c := s.db.Conn

	res, err := c.Query(`
		SELECT video_id,
		       status,
		       reason,
		       added_by,
		       timestamp
		FROM banned_tracks
	`)

	defer res.Close()

	if err != nil {
		l.Errorf("failed to execute getAll query - %s", err)

		return nil, errors.Wrap(err, "failed to get list of banned tracks")
	}

	msgWrap := p.ListBannedTracks{}

	for res.Next() {
		msg := p.BannedTrack{}

		err = res.Scan(
			&msg.VideoId,
			&msg.Status,
			&msg.Reason,
			&msg.AddedBy,
			&msg.Timestamp,
		)

		if err != nil {
			l.Errorf("failed to populate result - %s", err)
		}

		msgWrap.BannedTracks = append(msgWrap.BannedTracks, &msg)
	}

	return &msgWrap, nil
}

func (s *bannedTrackService) GetSingle(ctx context.Context, m *p.SingleTrackQuery) (*p.BannedTrack, error) {
	l := s.logger.WithContext(ctx)
	c := s.db.Conn

	res, err := c.Query(`
		SELECT video_id,
		       status,
		       reason,
		       added_by,
		       timestamp
		FROM banned_tracks
		WHERE video_id = ?
	`, m.GetVideoId())

	defer res.Close()

	if err != nil {
		l.Errorf("failed to get banned track - %s", err)

		// Track does not exist in DB - is not banned.
		return &p.BannedTrack{
			VideoId:   m.GetVideoId(),
			Status:    false,
			Reason:    "",
			AddedBy:   "",
			Timestamp: 0,
		}, nil
	}

	msg := p.BannedTrack{
		VideoId: m.GetVideoId(),
		Status:  false,
	}

	for res.Next() {
		err = res.Scan(
			&msg.VideoId,
			&msg.Status,
			&msg.Reason,
			&msg.AddedBy,
			&msg.Timestamp,
		)

		if err != nil {
			l.Errorf("failed to populate banned track to struct - %s", err)
			return nil, errors.Wrap(err, "failed to populate banned track")
		}
	}

	return &msg, nil
}

func (s *bannedTrackService) AddBan(ctx context.Context, m *p.AddBannedTrack) (*p.BannedTrack, error) {
	l := s.logger.WithContext(ctx)
	c := s.db.Conn
	n := time.Now().Unix()

	exists, err := s.GetSingle(ctx, &p.SingleTrackQuery{VideoId: m.GetVideoId()})
	if err != nil {
		l.Errorf("unable to check for banned track - %s", err)
	}
	if exists.Status == true {
		return exists, nil
	}

	res, err := c.Query(`
			INSERT INTO banned_tracks (video_id, status, reason, added_by, timestamp)
			VALUES (?, ?, ?, ?, ?)
		`,
		m.GetVideoId(),
		true,
		m.GetReason(),
		m.GetAddedBy(),
		n,
	)

	defer res.Close()

	if err != nil {
		l.Errorf("failed to add ban - %s", err)
		return nil, errors.Wrap(err, "failed to insert ban")
	}


	msg := p.BannedTrack{
		VideoId:   m.GetVideoId(),
		Status:    true,
		Reason:    m.GetReason(),
		AddedBy:   m.GetAddedBy(),
		Timestamp: n,
	}

	return &msg, nil
}

func (s *bannedTrackService) RemoveBan(ctx context.Context, m *p.SingleTrackQuery) (*p.RemoveBannedTrack, error) {
	l := s.logger.WithContext(ctx)
	c := s.db.Conn

	msg := p.RemoveBannedTrack{
		Removed: false,
	}

	res, err := c.Query(`
		DELETE FROM banned_tracks
		WHERE video_id = ?
	`, m.GetVideoId())

	defer res.Close()

	if err != nil {
		l.Errorf("failed to delete banned track - %s", err)

		return &msg, err
	}

	msg.Removed = true

	return &msg, nil
}
