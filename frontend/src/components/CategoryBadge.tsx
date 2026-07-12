import type { ProjectCategory } from '../types/entities';

const CATEGORY_BADGE_CLASS: Record<ProjectCategory, string> = {
  CLIENT: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800',
  INTERNAL: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
};

export default function CategoryBadge({ category }: { category: ProjectCategory }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_BADGE_CLASS[category]}`}>{category}</span>;
}
