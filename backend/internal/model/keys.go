package model

// DynamoDB key prefixes and sort key constants.
const (
	PKPrefixRoadmap  = "ROADMAP#"
	PKPrefixUser     = "USER#"
	SKMeta           = "META"
	SKProfile        = "PROFILE"
	SKPrefixNode     = "NODE#"
	SKPrefixEdge     = "EDGE#"
	SKPrefixLike     = "LIKE#"
	SKPrefixBookmark = "BOOKMARK#"
	SKPrefixProgress = "PROGRESS#"
	GSI2Public       = "PUBLIC"
)

// DynamoDB batch and resource limits.
const (
	BatchWriteMaxItems  = 25
	MaxRoadmapsPerUser  = 50
	MaxNodesPerRoadmap  = 100
	MaxEdgesPerRoadmap  = 200
	MaxNodesPerBatch    = 100
	DefaultPageLimit    = 20
	MaxPageLimitDefault = 50
	MaxPageLimitExplore = 100
)
