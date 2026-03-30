import { useEditorStore } from "../../stores/editorStore";

function EditorToolbar() {
  const { isSaving, isDirty, save } = useEditorStore();

  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
      <span className="text-sm text-[#8a7e6e]">
        {isSaving ? "保存中..." : isDirty ? "未保存の変更あり" : "保存済み"}
      </span>
      <button
        onClick={save}
        disabled={!isDirty || isSaving}
        className="rounded-md bg-swamp-700 px-3 py-1.5 text-sm text-white hover:bg-swamp-800 disabled:opacity-50"
        aria-label={isSaving ? "保存中" : isDirty ? "変更を保存" : "保存済み"}
      >
        保存
      </button>
    </div>
  );
}

export default EditorToolbar;
