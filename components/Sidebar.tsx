'use client';

import { useState, useEffect } from 'react';
import { Bookshelf } from '@/types/book';

interface SidebarProps {
  bookshelves: Bookshelf[];
  years: number[];
  onSelectShelf: (shelfName:  string) => void;
  onSelectYear: (year: number) => void;
  onSelectFiveStars: () => void;
  onSelectAllBooks: () => void;
  currentView: string;
}

export default function Sidebar({
  bookshelves,
  years,
  onSelectShelf,
  onSelectYear,
  onSelectFiveStars,
  onSelectAllBooks,
  currentView,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shelvesExpanded, setShelvesExpanded] = useState(true);
  const [yearsExpanded, setYearsExpanded] = useState(true);

  return (
    <aside
      className={`bg-black text-white transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top section */}
      <div className="p-4 flex items-center justify-between">
        {! isCollapsed && (
          <h2 className="text-xl font-bold">Your Library</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-[#282828] rounded-full transition"
        >
          {isCollapsed ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h13v-2H3v2zm0-5h10v-2H3v2zm0-7v2h13V6H3zm18 9. 59L17. 42 12 21 8.41 19.59 7l-5 5 5 5L21 15.59z" />
            </svg>
          )}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* All Books */}
        <button
          onClick={onSelectAllBooks}
          className={`w-full text-left px-4 py-3 rounded hover:bg-[#282828] transition flex items-center gap-3 ${
            currentView === 'all' ?  'bg-[#282828]' : ''
          }`}
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          {! isCollapsed && <span>All Books</span>}
        </button>

        {/* 5-Star Favorites */}
        <button
          onClick={onSelectFiveStars}
          className={`w-full text-left px-4 py-3 rounded hover:bg-[#282828] transition flex items-center gap-3 ${
            currentView === '5-stars' ? 'bg-[#282828]' : ''
          }`}
        >
          <svg className="w-5 h-5 flex-shrink-0 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-. 61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          {!isCollapsed && <span>5 Star Reads</span>}
        </button>

        <div className="h-px bg-gray-800 my-4" />

        {/* Shelves Section */}
        <div className="mb-4">
          <button
            onClick={() => setShelvesExpanded(!shelvesExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#282828] rounded transition"
          >
            {! isCollapsed && (
              <>
                <span className="text-sm font-semibold text-gray-400">Shelves</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    shelvesExpanded ? 'rotate-0' : '-rotate-90'
                  }`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7. 41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </>
            )}
            {isCollapsed && (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
            )}
          </button>

          {shelvesExpanded && (
            <div className="mt-1 space-y-1">
              {bookshelves.map((shelf) => (
                <button
                  key={shelf.id}
                  onClick={() => onSelectShelf(shelf.name)}
                  className={`w-full text-left px-4 py-2 rounded hover:bg-[#282828] transition text-sm flex items-center gap-3 ${
                    currentView === `shelf-${shelf.name}` ? 'bg-[#282828] text-green-500' : 'text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                  </svg>
                  {! isCollapsed && <span className="truncate">{shelf.name}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Years Section */}
        <div>
          <button
            onClick={() => setYearsExpanded(!yearsExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#282828] rounded transition"
          >
            {!isCollapsed && (
              <>
                <span className="text-sm font-semibold text-gray-400">Years</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    yearsExpanded ? 'rotate-0' :  '-rotate-90'
                  }`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </>
            )}
            {isCollapsed && (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              </svg>
            )}
          </button>

          {yearsExpanded && (
            <div className="mt-1 space-y-1">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => onSelectYear(year)}
                  className={`w-full text-left px-4 py-2 rounded hover:bg-[#282828] transition text-sm flex items-center gap-3 ${
                    currentView === `year-${year}` ? 'bg-[#282828] text-green-500' : 'text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                  </svg>
                  {!isCollapsed && <span>{year}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}