package model

type Node struct {
	PK          string  `dynamodbav:"PK"`
	SK          string  `dynamodbav:"SK"`
	NodeID      string  `dynamodbav:"nodeId"`
	Label       string  `dynamodbav:"label"`
	Description string  `dynamodbav:"description,omitempty"`
	PosX        float64 `dynamodbav:"posX"`
	PosY        float64 `dynamodbav:"posY"`
	Color       string  `dynamodbav:"color,omitempty"`
	URL         string  `dynamodbav:"url,omitempty"`
	Order       int     `dynamodbav:"order"`
}
