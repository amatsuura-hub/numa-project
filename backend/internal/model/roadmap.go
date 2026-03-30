package model

type RoadmapMeta struct {
	PK          string   `dynamodbav:"PK" json:"-"`
	SK          string   `dynamodbav:"SK" json:"-"`
	RoadmapID   string   `dynamodbav:"roadmapId" json:"roadmapId"`
	Title       string   `dynamodbav:"title" json:"title"`
	Description string   `dynamodbav:"description" json:"description"`
	UserID      string   `dynamodbav:"userId" json:"userId"`
	Category    string   `dynamodbav:"category" json:"category"`
	Tags        []string `dynamodbav:"tags" json:"tags"`
	IsPublic    bool     `dynamodbav:"isPublic" json:"isPublic"`
	LikeCount   int      `dynamodbav:"likeCount" json:"likeCount"`
	CreatedAt   string   `dynamodbav:"createdAt" json:"createdAt"`
	UpdatedAt   string   `dynamodbav:"updatedAt" json:"updatedAt"`
	GSI1PK      string   `dynamodbav:"GSI1PK,omitempty" json:"-"`
	GSI1SK      string   `dynamodbav:"GSI1SK,omitempty" json:"-"`
	GSI2PK      string   `dynamodbav:"GSI2PK,omitempty" json:"-"`
	GSI2SK      string   `dynamodbav:"GSI2SK,omitempty" json:"-"`
}

type RoadmapDetail struct {
	Meta  RoadmapMeta `json:"meta"`
	Nodes []Node      `json:"nodes"`
	Edges []Edge      `json:"edges"`
}
