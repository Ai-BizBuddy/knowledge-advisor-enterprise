'use client';
import { KnowledgeBaseSelection } from '@/hooks/useKnowledgeBaseSelection';
import { useEffect, useRef, useState } from 'react';

interface Props {
  options: KnowledgeBaseSelection[];
  onChange: (selected: string) => void;
  onChangeAll: (selected: string[]) => void;
}

export default function KnowledgeSelect({
  options,
  onChange,
  onChangeAll,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];

    setSelected(newSelected);
    onChange(value);
  };

  const toggleAll = () => {
    const newSelected =
      selected.length === options.length ? [] : options.map((o) => o.id);
    setSelected(newSelected);
    onChangeAll(newSelected);
  };

  return (
    <div
      ref={dropdownRef}
      className='relative w-full sm:w-1/2 lg:w-full xl:w-1/3'
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className='w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
      >
        {selected.length === options.length
          ? 'ทั้งหมด'
          : `${selected.length} รายการ`}
      </button>

      {isOpen && (
        <div className='absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-600'>
          <label className='flex items-center px-4 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'>
            <input
              type='checkbox'
              checked={selected.length === options.length}
              onChange={toggleAll}
              className='mr-2'
            />
            เลือกทั้งหมด
          </label>

          <hr className='border-gray-200 dark:border-gray-700' />

          {/* default is not checked */}
          {options.map((option) => (
            <label
              key={option.id}
              className='flex items-center px-4 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
            >
              <input
                type='checkbox'
                checked={selected.includes(option.id)}
                // onClick={() => toggleSelect(option)}
                onChange={() => toggleSelect(option.id)}
                className='mr-2'
              />
              {option.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
