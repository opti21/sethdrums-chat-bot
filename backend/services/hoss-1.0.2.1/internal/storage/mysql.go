package storage

import (
	"database/sql"
	"fmt"

	"github.com/bouffdaddy/hoss/internal/config"
	_ "github.com/go-sql-driver/mysql"
	"github.com/pkg/errors"
)

type MySQL struct {
	Conn *sql.DB
}

func NewMySQLConnection(cfg *config.Config) (*MySQL, error) {
	m := &MySQL{}
	c, err := m.connect(cfg)
	if err != nil {
		return nil, errors.Wrap(err, "failed to connect to MySQL Server")
	}

	return c, nil
}

func (m *MySQL) connect(config *config.Config) (*MySQL, error) {
	mysqlConnection := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s",
		config.User,
		config.Pass,
		config.Host,
		config.Port,
		config.Base,
	)

	db, err := sql.Open("mysql", mysqlConnection)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to open DB socket")
	}

	m.Conn = db

	return m, nil
}
