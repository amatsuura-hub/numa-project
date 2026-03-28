package model

type Bookmark struct {
	PK        string `dynamodbav:"PK"`
	SK        string `dynamodbav:"SK"`
	CreatedAt string `dynamodbav:"createdAt"`
	GSI3PK    string `dynamodbav:"GSI3PK,omitempty"`
	GSI3SK    string `dynamodbav:"GSI3SK,omitempty"`
}
