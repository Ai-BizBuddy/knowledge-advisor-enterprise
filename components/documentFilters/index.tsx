export default function DocumentFilters({
  filter,
  setFilter,
  sort,
  setSort,
}: {
  filter: string;
  setFilter: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border px-3 py-2 dark:bg-gray-800 dark:text-white"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="size">Sort by Size</option>
        </select>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border px-3 py-2 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All</option>
          <option value="emails">Emails</option>
          <option value="meetings">Meetings</option>
          <option value="announcements">Announcements</option>
          <option value="tasks">Tasks</option>
        </select>
      </div>
    </div>
  );
}
