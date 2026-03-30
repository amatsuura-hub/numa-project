package model

type Bookmark struct {
	PK        string `dynamodbav:"PK" json:"-"`
	SK        string `dynamodbav:"SK" json:"-"`
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
	GSI3PK    string `dynamodbav:"GSI3PK,omitempty" json:"-"`
	GSI3SK    string `dynamodbav:"GSI3SK,omitempty" json:"-"`
}
