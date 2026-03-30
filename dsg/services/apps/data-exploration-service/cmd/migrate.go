package main

import (
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/cmd/migrate"
	"github.com/spf13/cobra"
)

var (
	sourceUrl   string
	databaseUrl string
)

var (
	migrateCmd = &cobra.Command{
		Use:   "migrate",
		Short: "database migrate",
	}

	upCmd = &cobra.Command{
		Use:   "up",
		Short: "database migrate up",
		RunE:  runUp,
	}

	downCmd = &cobra.Command{
		Use:   "down",
		Short: "database migrate down",
		RunE:  runDown,
	}
)

func init() {
	migrateCmd.PersistentFlags().StringVarP(&sourceUrl, "source", "s", "file:///opt/migrations", "sql file path")
	migrateCmd.PersistentFlags().StringVarP(&databaseUrl, "database", "d", "mysql://", "database dsn")
	migrateCmd.AddCommand(upCmd, downCmd)
}

func runUp(_ *cobra.Command, _ []string) error {
	config := migrate.Config{
		SourceURL:   sourceUrl,
		DatabaseURL: databaseUrl,
	}

	return migrate.RunUp(&config)
}

func runDown(_ *cobra.Command, _ []string) error {
	config := migrate.Config{
		SourceURL:   sourceUrl,
		DatabaseURL: databaseUrl,
	}

	return migrate.RunDown(&config)
}
