interface TabsBarProps {
  files: string[];
  current: string;
  onSelect: (name: string) => void;
}

export default function TabsBar({ files, current, onSelect }: TabsBarProps) {
  return (
    <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs flex-none">
      {files.map((name) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className={`px-3 py-1.5 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 transition ${
            name === current
              ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-300 font-semibold"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
