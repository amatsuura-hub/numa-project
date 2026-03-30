package model

type Node struct {
	PK          string  `dynamodbav:"PK" json:"-"`
	SK          string  `dynamodbav:"SK" json:"-"`
	NodeID      string  `dynamodbav:"nodeId" json:"nodeId"`
	Label       string  `dynamodbav:"label" json:"label"`
	Description string  `dynamodbav:"description,omitempty" json:"description,omitempty"`
	PosX        float64 `dynamodbav:"posX" json:"posX"`
	PosY        float64 `dynamodbav:"posY" json:"posY"`
	Color       string  `dynamodbav:"color,omitempty" json:"color,omitempty"`
	URL         string  `dynamodbav:"url,omitempty" json:"url,omitempty"`
	Order       int     `dynamodbav:"order" json:"order"`
}
