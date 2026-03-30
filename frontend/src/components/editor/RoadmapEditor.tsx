import { useCallback, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEditorStore } from "../../stores/editorStore";
import RoadmapNode from "./RoadmapNode";
import NodeEditPanel from "./NodeEditPanel";
import MetaEditPanel from "./MetaEditPanel";
import EditorToolbar from "./EditorToolbar";
import { DEFAULT_NODE_COLOR } from "../../constants/depth";

function RoadmapEditor() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  } = useEditorStore();

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const nodeTypes = useMemo(() => ({ roadmapNode: RoadmapNode }), []);

  const handlePaneDoubleClick = useCallback(
    (_event: React.MouseEvent, position?: { x: number; y: number }) => {
      // Default position if not provided
      const x = position?.x ?? 250;
      const y = position?.y ?? 250;
      addNode(x, y);
    },
    [addNode],
  );

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode(node);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="relative h-[calc(100vh-120px)] w-full">
      <MetaEditPanel />
      <EditorToolbar />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDoubleClick={(e) => {
          const rect = (e.target as HTMLElement)
            .closest(".react-flow")
            ?.getBoundingClientRect();
          if (rect) {
            handlePaneDoubleClick(e, {
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }
        }}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { strokeWidth: 2, stroke: "rgba(45,90,50,0.5)" },
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(n) => (n.data?.color as string) || DEFAULT_NODE_COLOR}
          className="!bottom-4 !right-4"
        />
      </ReactFlow>

      <NodeEditPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}

export default RoadmapEditor;
