package model

// Progress tracks a user's progress on a roadmap.
// PK: USER#<userId>, SK: PROGRESS#<roadmapId>
type Progress struct {
	PK             string   `dynamodbav:"PK"`
	SK             string   `dynamodbav:"SK"`
	RoadmapID      string   `dynamodbav:"roadmapId"`
	CompletedNodes []string `dynamodbav:"completedNodes,stringset,omitempty"`
	TotalNodes     int      `dynamodbav:"totalNodes"`
	NumaLevel      int      `dynamodbav:"numaLevel"`
	StartedAt      string   `dynamodbav:"startedAt"`
	UpdatedAt      string   `dynamodbav:"updatedAt"`
}

// CalcNumaLevel returns the numa level (0-5) based on completed / total nodes.
func CalcNumaLevel(completed, total int) int {
	if total == 0 || completed == 0 {
		return 0
	}
	pct := completed * 100 / total
	switch {
	case pct >= 81:
		return 5
	case pct >= 61:
		return 4
	case pct >= 41:
		return 3
	case pct >= 21:
		return 2
	default:
		return 1
	}
}
