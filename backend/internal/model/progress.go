package model

// Progress tracks a user's progress on a roadmap.
// PK: USER#<userId>, SK: PROGRESS#<roadmapId>
type Progress struct {
	PK             string   `dynamodbav:"PK" json:"-"`
	SK             string   `dynamodbav:"SK" json:"-"`
	RoadmapID      string   `dynamodbav:"roadmapId" json:"roadmapId"`
	CompletedNodes []string `dynamodbav:"completedNodes,stringset,omitempty" json:"completedNodes"`
	TotalNodes     int      `dynamodbav:"totalNodes" json:"totalNodes"`
	NumaLevel      int      `dynamodbav:"numaLevel" json:"numaLevel"`
	StartedAt      string   `dynamodbav:"startedAt" json:"startedAt"`
	UpdatedAt      string   `dynamodbav:"updatedAt" json:"updatedAt"`
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
