package model

type Edge struct {
	PK           string `dynamodbav:"PK"`
	SK           string `dynamodbav:"SK"`
	EdgeID       string `dynamodbav:"edgeId"`
	SourceNodeID string `dynamodbav:"sourceNodeId"`
	TargetNodeID string `dynamodbav:"targetNodeId"`
	Label        string `dynamodbav:"label,omitempty"`
}
