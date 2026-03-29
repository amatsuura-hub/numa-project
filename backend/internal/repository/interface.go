package repository

import (
	"context"

	"github.com/numa-project/backend/internal/model"
)

// Repository defines the interface for data access.
type Repository interface {
	// User
	GetUser(ctx context.Context, userID string) (*model.User, error)
	PutUser(ctx context.Context, user *model.User) error
	UpdateUser(ctx context.Context, userID string, displayName, bio, xHandle string) (*model.User, error)

	// Roadmap
	PutRoadmap(ctx context.Context, meta *model.RoadmapMeta) error
	GetRoadmapMeta(ctx context.Context, roadmapID string) (*model.RoadmapMeta, error)
	GetRoadmapDetail(ctx context.Context, roadmapID string) (*model.RoadmapDetail, error)
	UpdateRoadmapMeta(ctx context.Context, meta *model.RoadmapMeta) error
	DeleteRoadmap(ctx context.Context, roadmapID string) error
	GetMyRoadmaps(ctx context.Context, userID string, limit int32, cursor string) ([]model.RoadmapMeta, string, error)
	ExploreRoadmaps(ctx context.Context, category string, limit int32, cursor string) ([]model.RoadmapMeta, string, error)

	// Node
	PutNode(ctx context.Context, node *model.Node) error
	DeleteNode(ctx context.Context, roadmapID, nodeID string) error
	BatchPutNodes(ctx context.Context, nodes []model.Node) error

	// Edge
	PutEdge(ctx context.Context, edge *model.Edge) error
	DeleteEdge(ctx context.Context, roadmapID, edgeID string) error

	// Like
	IsLiked(ctx context.Context, roadmapID, userID string) (bool, error)
	LikeRoadmap(ctx context.Context, roadmapID, userID string) error
	UnlikeRoadmap(ctx context.Context, roadmapID, userID string) error

	// Bookmark
	IsBookmarked(ctx context.Context, userID, roadmapID string) (bool, error)
	BookmarkRoadmap(ctx context.Context, userID, roadmapID string) error
	UnbookmarkRoadmap(ctx context.Context, userID, roadmapID string) error
	GetMyBookmarks(ctx context.Context, userID string, limit int32, cursor string) ([]model.Bookmark, string, error)

	// Progress
	GetProgress(ctx context.Context, userID, roadmapID string) (*model.Progress, error)
	PutProgress(ctx context.Context, p *model.Progress) error
	GetMyProgress(ctx context.Context, userID string) ([]model.Progress, error)
	CompleteNode(ctx context.Context, userID, roadmapID, nodeID string, totalNodes int) (*model.Progress, error)
	UncompleteNode(ctx context.Context, userID, roadmapID, nodeID string, totalNodes int) (*model.Progress, error)
}
