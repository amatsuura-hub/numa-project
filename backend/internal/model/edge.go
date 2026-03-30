package model

type Edge struct {
	PK           string `dynamodbav:"PK" json:"-"`
	SK           string `dynamodbav:"SK" json:"-"`
	EdgeID       string `dynamodbav:"edgeId" json:"edgeId"`
	SourceNodeID string `dynamodbav:"sourceNodeId" json:"sourceNodeId"`
	TargetNodeID string `dynamodbav:"targetNodeId" json:"targetNodeId"`
	Label        string `dynamodbav:"label,omitempty" json:"label,omitempty"`
}
