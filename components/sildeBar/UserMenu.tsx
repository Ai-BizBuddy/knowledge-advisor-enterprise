import Image from 'next/image';
import { APP_STRINGS } from '@/constants';

interface UserMenuProps {
    isOpen: boolean;
    onToggle: () => void;
    handleLogout?: () => void;
}

/**
 * User dropdown menu component
 */
export const UserMenu = ({ isOpen, onToggle, handleLogout }: UserMenuProps) => {
    return (
        <div className="relative">
            <button
                type="button"
                className="flex rounded-full bg-gray-800 text-sm focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                aria-expanded={isOpen}
                onClick={onToggle}
            >
                <span className="sr-only">Open user menu</span>
                <Image
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                    src="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                    alt="user photo"
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-14 z-50 my-4 list-none divide-y divide-gray-100 rounded-sm bg-white text-base shadow-sm dark:divide-gray-600 dark:bg-gray-700">
                    <div className="px-4 py-3" role="none">
                        <p className="text-sm text-gray-900 dark:text-white" role="none">
                            {APP_STRINGS.DEFAULT_USER_NAME}
                        </p>
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-300" role="none">
                            {APP_STRINGS.DEFAULT_USER_EMAIL}
                        </p>
                    </div>
                    <ul className="py-1" role="none">
                        <li>
                            <a
                                href="#"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                                role="menuitem"
                            >
                                {APP_STRINGS.ACTIONS.SETTINGS}
                            </a>
                        </li>
                        <li>
                            <a
                                onClick={handleLogout}
                                // href="#"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                                role="menuitem"
                            >
                                {APP_STRINGS.ACTIONS.SIGN_OUT}
                            </a>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};
