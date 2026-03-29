import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/roadmap", () => ({
  roadmapApi: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    batchUpdateNodes: vi.fn(),
    createEdge: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

import { roadmapApi } from "../api/roadmap";

describe("editorStore", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const { useEditorStore } = await import("./editorStore");
    useEditorStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with empty state", async () => {
    const { useEditorStore } = await import("./editorStore");
    const state = useEditorStore.getState();
    expect(state.roadmapId).toBeNull();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.isDirty).toBe(false);
  });

  it("loads roadmap from API", async () => {
    vi.mocked(roadmapApi.get).mockResolvedValue({
      data: {
        meta: {
          roadmapId: "r1",
          title: "Test",
          description: "",
          userId: "u1",
          category: "",
          tags: [],
          isPublic: false,
          likeCount: 0,
          createdAt: "",
          updatedAt: "",
        },
        nodes: [
          {
            nodeId: "n1",
            label: "Step 1",
            posX: 0,
            posY: 0,
            order: 1,
          },
        ],
        edges: [],
        isLiked: false,
        isBookmarked: false,
      },
    });

    const { useEditorStore } = await import("./editorStore");
    await useEditorStore.getState().loadRoadmap("r1");

    const state = useEditorStore.getState();
    expect(state.roadmapId).toBe("r1");
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].data.label).toBe("Step 1");
    expect(state.isDirty).toBe(false);
  });

  it("creates a roadmap", async () => {
    vi.mocked(roadmapApi.create).mockResolvedValue({
      data: {
        roadmapId: "new-r1",
        title: "New",
        description: "",
        userId: "u1",
        category: "",
        tags: [],
        isPublic: false,
        likeCount: 0,
        createdAt: "",
        updatedAt: "",
      },
    });

    const { useEditorStore } = await import("./editorStore");
    const id = await useEditorStore.getState().createRoadmap({
      title: "New",
      description: "",
      category: "",
      tags: [],
      isPublic: false,
    });

    expect(id).toBe("new-r1");
    expect(useEditorStore.getState().roadmapId).toBe("new-r1");
  });

  it("adds a node", async () => {
    const { useEditorStore } = await import("./editorStore");
    useEditorStore.setState({ roadmapId: "r1" });

    useEditorStore.getState().addNode(100, 200);

    const state = useEditorStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].position).toEqual({ x: 100, y: 200 });
    expect(state.isDirty).toBe(true);
  });

  it("deletes a node and connected edges", async () => {
    const { useEditorStore } = await import("./editorStore");
    useEditorStore.setState({
      roadmapId: "r1",
      nodes: [
        { id: "n1", position: { x: 0, y: 0 }, data: { label: "A" }, type: "roadmapNode" },
        { id: "n2", position: { x: 100, y: 0 }, data: { label: "B" }, type: "roadmapNode" },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", type: "smoothstep" },
      ],
    });

    useEditorStore.getState().deleteNode("n1");

    const state = useEditorStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe("n2");
    expect(state.edges).toHaveLength(0);
  });

  it("updates node data", async () => {
    const { useEditorStore } = await import("./editorStore");
    useEditorStore.setState({
      roadmapId: "r1",
      nodes: [
        { id: "n1", position: { x: 0, y: 0 }, data: { label: "Old" }, type: "roadmapNode" },
      ],
    });

    useEditorStore.getState().updateNodeData("n1", { label: "New" });

    expect(useEditorStore.getState().nodes[0].data.label).toBe("New");
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it("resets state", async () => {
    const { useEditorStore } = await import("./editorStore");
    useEditorStore.setState({
      roadmapId: "r1",
      nodes: [{ id: "n1", position: { x: 0, y: 0 }, data: {}, type: "roadmapNode" }],
      isDirty: true,
    });

    useEditorStore.getState().reset();

    const state = useEditorStore.getState();
    expect(state.roadmapId).toBeNull();
    expect(state.nodes).toEqual([]);
    expect(state.isDirty).toBe(false);
  });
});
