

export default function SearchBar() {
    return (
        <div className="flex items-center">
            <input
                type="text"
                placeholder="Search..."
                className="border border-gray-300 rounded-md py-2 px-4 mr-2"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
                Search
            </button>
        </div>
    );
}