interface NewPostsToastProps {
  count: number;
  onReveal: () => void;
}

export function NewPostsToast({ count, onReveal }: NewPostsToastProps) {
  if (count <= 0) return null;
  return (
    <div className="sticky bottom-2 z-20 flex justify-center">
      <button
        aria-live="polite"
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
        onClick={onReveal}
      >
        New posts ({count})
      </button>
    </div>
  );
}

export default NewPostsToast;


