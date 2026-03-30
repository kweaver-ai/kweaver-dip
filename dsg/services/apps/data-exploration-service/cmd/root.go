package main

import "github.com/spf13/cobra"

var confPath string

var rootCmd = &cobra.Command{
	Use:     "data exploration",
	Short:   "data exploration",
	Version: Version,
}

func init() {
	rootCmd.PersistentFlags().StringVarP(&confPath, "conf", "c", "cmd/server/config", "config path, eg: -conf config")
	rootCmd.AddCommand(serverCmd)
}
