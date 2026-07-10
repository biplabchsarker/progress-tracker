import type { ProjectCategory } from '../types/entities';

const CATEGORY_BADGE_CLASS: Record<ProjectCategory, string> = {
  CLIENT: 'bg-teal-950 text-teal-400 border-teal-800',
  INTERNAL: 'bg-purple-950 text-purple-400 border-purple-800',
};

export default function CategoryBadge({ category }: { category: ProjectCategory }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_BADGE_CLASS[category]}`}>{category}</span>;
}
