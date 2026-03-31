package handler

import (
	"context"
	"fmt"

	"github.com/numa-project/backend/internal/model"
)

// mockRepo implements repository.Repository for testing.
type mockRepo struct {
	users     map[string]*model.User
	roadmaps  map[string]*model.RoadmapMeta
	details   map[string]*model.RoadmapDetail
	nodes     map[string]*model.Node
	edges     map[string]*model.Edge
	likes     map[string]bool
	bookmarks map[string]bool

	// Error injection
	err error

	// Track calls
	putRoadmapCalled        bool
	updateRoadmapMetaCalled bool
	deleteRoadmapCalled     bool
	putNodeCalled           bool
	deleteNodeCalled        bool
	batchPutNodesCalled     bool
	putEdgeCalled           bool
	deleteEdgeCalled        bool
	likeRoadmapCalled       bool
	unlikeRoadmapCalled     bool
	bookmarkCalled          bool
	unbookmarkCalled        bool
}

func newMockRepo() *mockRepo {
	return &mockRepo{
		users:     make(map[string]*model.User),
		roadmaps:  make(map[string]*model.RoadmapMeta),
		details:   make(map[string]*model.RoadmapDetail),
		nodes:     make(map[string]*model.Node),
		edges:     make(map[string]*model.Edge),
		likes:     make(map[string]bool),
		bookmarks: make(map[string]bool),
	}
}

func (m *mockRepo) GetUser(_ context.Context, userID string) (*model.User, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.users[userID], nil
}

func (m *mockRepo) PutUser(_ context.Context, user *model.User) error {
	if m.err != nil {
		return m.err
	}
	m.users[user.UserID] = user
	return nil
}

func (m *mockRepo) UpdateUser(_ context.Context, userID, displayName, bio, xHandle string) (*model.User, error) {
	if m.err != nil {
		return nil, m.err
	}
	u := m.users[userID]
	if u == nil {
		u = &model.User{UserID: userID}
	}
	u.DisplayName = displayName
	u.Bio = bio
	u.XHandle = xHandle
	m.users[userID] = u
	return u, nil
}

func (m *mockRepo) PutRoadmap(_ context.Context, meta *model.RoadmapMeta) error {
	m.putRoadmapCalled = true
	if m.err != nil {
		return m.err
	}
	m.roadmaps[meta.RoadmapID] = meta
	return nil
}

func (m *mockRepo) GetRoadmapMeta(_ context.Context, roadmapID string) (*model.RoadmapMeta, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.roadmaps[roadmapID], nil
}

func (m *mockRepo) GetRoadmapDetail(_ context.Context, roadmapID string) (*model.RoadmapDetail, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.details[roadmapID], nil
}

func (m *mockRepo) UpdateRoadmapMeta(_ context.Context, meta *model.RoadmapMeta) error {
	m.updateRoadmapMetaCalled = true
	if m.err != nil {
		return m.err
	}
	m.roadmaps[meta.RoadmapID] = meta
	return nil
}

func (m *mockRepo) DeleteRoadmap(_ context.Context, _ string) error {
	m.deleteRoadmapCalled = true
	return m.err
}

func (m *mockRepo) GetMyRoadmaps(_ context.Context, userID string, _ int32, _ string) ([]model.RoadmapMeta, string, error) {
	if m.err != nil {
		return nil, "", m.err
	}
	var result []model.RoadmapMeta
	for _, r := range m.roadmaps {
		if r.UserID == userID {
			result = append(result, *r)
		}
	}
	return result, "", nil
}

func (m *mockRepo) ExploreRoadmaps(_ context.Context, _ string, _ int32, _ string) ([]model.RoadmapMeta, string, error) {
	if m.err != nil {
		return nil, "", m.err
	}
	var result []model.RoadmapMeta
	for _, r := range m.roadmaps {
		if r.IsPublic {
			result = append(result, *r)
		}
	}
	return result, "", nil
}

func (m *mockRepo) CountNodes(_ context.Context, roadmapID string) (int, error) {
	if m.err != nil {
		return 0, m.err
	}
	if d, ok := m.details[roadmapID]; ok {
		return len(d.Nodes), nil
	}
	return 0, nil
}

func (m *mockRepo) PutNode(_ context.Context, node *model.Node) error {
	m.putNodeCalled = true
	if m.err != nil {
		return m.err
	}
	m.nodes[node.NodeID] = node
	return nil
}

func (m *mockRepo) UpdateNode(_ context.Context, node *model.Node) error {
	m.putNodeCalled = true
	if m.err != nil {
		return m.err
	}
	m.nodes[node.NodeID] = node
	return nil
}

func (m *mockRepo) DeleteNode(_ context.Context, _, _ string) error {
	m.deleteNodeCalled = true
	return m.err
}

func (m *mockRepo) BatchPutNodes(_ context.Context, nodes []model.Node) error {
	m.batchPutNodesCalled = true
	if m.err != nil {
		return m.err
	}
	for i := range nodes {
		m.nodes[nodes[i].NodeID] = &nodes[i]
	}
	return nil
}

func (m *mockRepo) PutEdge(_ context.Context, edge *model.Edge) error {
	m.putEdgeCalled = true
	if m.err != nil {
		return m.err
	}
	m.edges[edge.EdgeID] = edge
	return nil
}

func (m *mockRepo) DeleteEdge(_ context.Context, _, _ string) error {
	m.deleteEdgeCalled = true
	return m.err
}

func (m *mockRepo) IsLiked(_ context.Context, roadmapID, userID string) (bool, error) {
	if m.err != nil {
		return false, m.err
	}
	return m.likes[fmt.Sprintf("%s:%s", roadmapID, userID)], nil
}

func (m *mockRepo) LikeRoadmap(_ context.Context, _, _ string) error {
	m.likeRoadmapCalled = true
	return m.err
}

func (m *mockRepo) UnlikeRoadmap(_ context.Context, _, _ string) error {
	m.unlikeRoadmapCalled = true
	return m.err
}

func (m *mockRepo) IsBookmarked(_ context.Context, userID, roadmapID string) (bool, error) {
	if m.err != nil {
		return false, m.err
	}
	return m.bookmarks[fmt.Sprintf("%s:%s", userID, roadmapID)], nil
}

func (m *mockRepo) BookmarkRoadmap(_ context.Context, _, _ string) error {
	m.bookmarkCalled = true
	return m.err
}

func (m *mockRepo) UnbookmarkRoadmap(_ context.Context, _, _ string) error {
	m.unbookmarkCalled = true
	return m.err
}

func (m *mockRepo) GetMyBookmarks(_ context.Context, _ string, _ int32, _ string) ([]model.Bookmark, string, error) {
	if m.err != nil {
		return nil, "", m.err
	}
	return []model.Bookmark{}, "", nil
}

func (m *mockRepo) GetProgress(_ context.Context, _, _ string) (*model.Progress, error) {
	if m.err != nil {
		return nil, m.err
	}
	return nil, nil
}

func (m *mockRepo) PutProgress(_ context.Context, _ *model.Progress) error {
	return m.err
}

func (m *mockRepo) GetMyProgress(_ context.Context, _ string) ([]model.Progress, error) {
	if m.err != nil {
		return nil, m.err
	}
	return []model.Progress{}, nil
}

func (m *mockRepo) CompleteNode(_ context.Context, _, _, _ string, totalNodes int) (*model.Progress, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &model.Progress{
		CompletedNodes: []string{"node1"},
		TotalNodes:     totalNodes,
		NumaLevel:      1,
	}, nil
}

func (m *mockRepo) UncompleteNode(_ context.Context, _, _, _ string, totalNodes int) (*model.Progress, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &model.Progress{
		CompletedNodes: []string{},
		TotalNodes:     totalNodes,
		NumaLevel:      0,
	}, nil
}
