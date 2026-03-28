interface ShareButtonProps {
  title: string;
  roadmapId: string;
}

function ShareButton({ title, roadmapId }: ShareButtonProps) {
  const handleShare = () => {
    const url = `${window.location.origin}/roadmaps/${roadmapId}`;
    const text = `「${title}」- Numaで見つけたロードマップ`;
    const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
    >
      <span>𝕏</span>
      <span>共有</span>
    </button>
  );
}

export default ShareButton;
