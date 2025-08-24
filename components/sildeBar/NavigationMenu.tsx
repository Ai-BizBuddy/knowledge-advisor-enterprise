import Link from 'next/link';
import type { NavigationMenuItem } from './types';

interface NavigationMenuProps {
  items: NavigationMenuItem[];
  onItemClick: (index: number) => void;
}

/**
 * Navigation menu component for sidebar
 */
export const NavigationMenu = ({ items, onItemClick }: NavigationMenuProps) => {
  return (
    <ul className='space-y-2 font-medium'>
      {items.map((item, index) => (
        <li key={item.name}>
          <Link
            href={item.url}
            aria-current={item.active ? 'page' : undefined}
            onClick={() => !item.active && onItemClick(index)}
            className={`group flex items-center rounded-lg p-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 ${
              item.active ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
          >
            {item.icon}
            <span className='ms-3'>{item.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};
