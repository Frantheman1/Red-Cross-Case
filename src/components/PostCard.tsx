import type { Post } from '../types';
import { formatTimestampForLocale } from '../lib/time';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const locale = navigator.language;
  const timeText = formatTimestampForLocale(post.createdAt, locale);
  return (
    <article className="card card-hover p-4">
      <div className="flex items-start gap-3">
        {post.author.avatarUrl ? (
          <img src={post.author.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate-1 max-w-[40%]">{post.author.name}</span>
            <span className="truncate-1 max-w-[40%] text-slate-600 dark:text-slate-400">@{post.author.handle}</span>
            <span className="text-slate-500">·</span>
            <time dateTime={post.createdAt} className="text-slate-600 dark:text-slate-400">
              {timeText}
            </time>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] leading-5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {post.platform}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{post.text}</p>
          {post.media && post.media.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {post.media.slice(0, 4).map((m, i) => (
                <img key={i} src={m.thumbUrl} alt="" className="h-28 w-full rounded-md object-cover" />
              ))}
            </div>
          )}
          {post.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.hashtags.map((h) => (
                <span key={h} className="chip">#{h}</span>
              ))}
            </div>
          )}
          <div className="mt-3">
            <a
              href={post.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-700 hover:text-brand-red dark:text-slate-300"
            >
              Open post
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default PostCard;


