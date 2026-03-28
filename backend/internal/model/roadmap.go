package model

type RoadmapMeta struct {
	PK          string   `dynamodbav:"PK"`
	SK          string   `dynamodbav:"SK"`
	RoadmapID   string   `dynamodbav:"roadmapId"`
	Title       string   `dynamodbav:"title"`
	Description string   `dynamodbav:"description"`
	UserID      string   `dynamodbav:"userId"`
	Category    string   `dynamodbav:"category"`
	Tags        []string `dynamodbav:"tags"`
	IsPublic    bool     `dynamodbav:"isPublic"`
	LikeCount   int      `dynamodbav:"likeCount"`
	CreatedAt   string   `dynamodbav:"createdAt"`
	UpdatedAt   string   `dynamodbav:"updatedAt"`
	GSI1PK      string   `dynamodbav:"GSI1PK,omitempty"`
	GSI1SK      string   `dynamodbav:"GSI1SK,omitempty"`
	GSI2PK      string   `dynamodbav:"GSI2PK,omitempty"`
	GSI2SK      string   `dynamodbav:"GSI2SK,omitempty"`
}

type RoadmapDetail struct {
	Meta  RoadmapMeta `json:"meta"`
	Nodes []Node      `json:"nodes"`
	Edges []Edge      `json:"edges"`
}
