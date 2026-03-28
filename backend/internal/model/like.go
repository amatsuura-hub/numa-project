package model

type Like struct {
	PK        string `dynamodbav:"PK"`
	SK        string `dynamodbav:"SK"`
	CreatedAt string `dynamodbav:"createdAt"`
}
