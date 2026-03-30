package impl

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"golang.org/x/exp/slices"
	"golang.org/x/sync/errgroup"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	clock "k8s.io/utils/clock/testing"
)

func TestGenerate(t *testing.T) {
	Clock = clock.NewFakeClock(time.Date(2024, 03, 22, 0, 00, 00, 0, time.Local))

	var dsn = os.Getenv("TEST_DSN")

	db, err := gorm.Open(mysql.Open(dsn))
	if err != nil {
		t.Skip(err)
	}

	repo := &CodeGenerationRuleRepo{db: db}

	result, err := repo.Generate(context.TODO(), uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc"), 2)
	if assert.NoError(t, err) {
		if assert.NoError(t, err) {
			j, err := json.MarshalIndent(result, "", "  ")
			if err != nil {
				t.Fatal(err)
			}
			t.Logf("generated codes: %s", j)
			assert.Len(t, result, 2)
		}
	}
}

func TestGenerateParallel(t *testing.T) {
	var dsn = os.Getenv("TEST_DSN_DEV")

	db, err := gorm.Open(mysql.Open(dsn))
	if err != nil {
		t.Skip(err)
	}

	repo := &CodeGenerationRuleRepo{db: db}

	codes, err := generateParallel(context.Background(), repo, uuid.MustParse("15d8b9f8-f87b-11ee-aeae-005056b4b3fc"), 10, 10, 10)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("generated %d codes", len(codes))

	t.Logf("first: %s, latest: %s", slices.Min(codes), slices.Max(codes))

	t.Error("disable cache")
}

// generateParallel 并发生成编码
func generateParallel(ctx context.Context, repo *CodeGenerationRuleRepo, id uuid.UUID, generator, times, count int) ([]string, error) {
	g, ctx := errgroup.WithContext(ctx)

	// channel of code
	codeCh := make(chan string)

	// generate codes parallel
	for x := 0; x < generator; x++ {
		g.Go(func() error {
			for y := 0; y < times; y++ {
				codes, err := repo.Generate(ctx, id, count)
				if err != nil {
					return err
				}
				for _, c := range codes {
					select {
					case codeCh <- c:
					case <-ctx.Done():
						return ctx.Err()
					}
				}
			}
			return nil
		})
	}

	go func() {
		g.Wait()
		close(codeCh)
	}()

	var result []string
	for c := range codeCh {
		result = append(result, c)
	}

	return result, nil
}
