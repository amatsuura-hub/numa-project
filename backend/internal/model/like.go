package model

type Like struct {
	PK        string `dynamodbav:"PK" json:"-"`
	SK        string `dynamodbav:"SK" json:"-"`
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
}
