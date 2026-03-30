package migrate

import (
	"errors"
	"log"

	m "github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type Config struct {
	SourceURL   string
	DatabaseURL string
}

func RunUp(cfg *Config) error {
	mm, err := m.New(cfg.SourceURL, cfg.DatabaseURL)
	if err != nil {
		log.Printf("failed to create migrate instance, err: %v", err)
		return err
	}

	if err = mm.Up(); err != nil {
		if errors.Is(err, m.ErrNoChange) {
			log.Println(err)
			return nil
		}

		log.Printf("failed to up migrate db, err: %v", err)
		return err
	}

	return nil
}

func RunDown(cfg *Config) error {
	log.Printf("no impl")
	return nil
}
