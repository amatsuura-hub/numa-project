import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RoadmapEditor from "./RoadmapEditor";
import { DEFAULT_NODE_COLOR } from "../../constants/depth";

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reactflow">{children}</div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  applyNodeChanges: vi.fn((changes, nodes) => nodes),
  applyEdgeChanges: vi.fn((changes, edges) => edges),
  addEdge: vi.fn((edge, edges) => [...edges, edge]),
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn(() => ({
    nodes: [
      {
        id: "n1",
        position: { x: 0, y: 0 },
        data: { label: "Step 1", description: "", color: DEFAULT_NODE_COLOR, url: "" },
        type: "roadmapNode",
      },
    ],
    edges: [],
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    addNode: vi.fn(),
    meta: { title: "Test Roadmap" },
    isSaving: false,
    isDirty: false,
  })),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

describe("RoadmapEditor", () => {
  it("renders ReactFlow with controls", () => {
    render(<RoadmapEditor />);
    expect(screen.getByTestId("reactflow")).toBeInTheDocument();
    expect(screen.getByTestId("controls")).toBeInTheDocument();
  });

  it("renders toolbar and meta panel", () => {
    render(<RoadmapEditor />);
    expect(screen.getByText("保存済み")).toBeInTheDocument();
  });
});
