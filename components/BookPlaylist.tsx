'use client';

import { useState } from 'react';
import Image from 'next/image';
import { EnrichedBook } from '@/types/book';

interface BookPlaylistProps {
  books: EnrichedBook[];
}

export default function BookPlaylist({ books }: BookPlaylistProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate total pages
  const totalPages = books.reduce((sum, book) => sum + (book.numberOfPages || 0), 0);
  const totalBooks = books.length;

  // Filter books based on search
  const filteredBooks = books. filter(book =>
    book. title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] via-[#121212] to-[#121212] text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#121212] pb-6">
        <div className="container mx-auto px-8 pt-16">
          <div className="flex items-end gap-6 mb-6">
            {/* Playlist Cover - First book or placeholder */}
            <div className="flex-shrink-0 w-[232px] h-[232px] shadow-2xl">
              {books[0]?.coverImageUrl ?  (
                <Image
                  src={books[0].coverImageUrl}
                  alt="Playlist cover"
                  width={232}
                  height={232}
                  className="w-full h-full object-cover shadow-2xl"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-6xl font-bold shadow-2xl">
                  📚
                </div>
              )}
            </div>

            {/* Playlist Info */}
            <div className="flex-1 pb-6">
              <p className="text-sm font-semibold mb-2">Public Playlist</p>
              <h1 className="text-7xl font-black mb-6">My Reading List</h1>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-xs">👤</span>
                </div>
                <span className="font-semibold">palomaa</span>
                <span>•</span>
                <span>{totalBooks} books, {totalPages. toLocaleString()} pages</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-[#121212] bg-opacity-40 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Play Button */}
              <button className="w-14 h-14 rounded-full bg-[#1ed760] flex items-center justify-center hover:scale-105 hover:bg-[#1fdf64] transition-all shadow-lg">
                <svg className="w-6 h-6 ml-1" viewBox="0 0 16 16" fill="black">
                  <path d="M3 1.713a.7.7 0 0 1 1.05-. 607l10.89 6.288a. 7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z" />
                </svg>
              </button>

              {/* Icon Buttons */}
              <button className="text-gray-400 hover: text-white transition">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </button>

              <button className="text-gray-400 hover: text-white transition">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 10c-1.1 0-2 .9-2 2s. 9 2 2 2 2-.9 2-2-. 9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-. 9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search in playlist"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target. value)}
                  className="bg-[#2a2a2a] text-white placeholder-gray-400 rounded-md px-8 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <svg className="w-5 h-5 absolute left-2. 5 top-2.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <button className="text-gray-400 hover:text-white text-sm font-medium">
                Custom order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="container mx-auto px-8 py-6">
        {/* Table Header */}
        <div className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800 mb-2">
          <div className="text-center">#</div>
          <div>Title</div>
          <div>Author</div>
          <div className="flex items-center justify-end">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
              <path d="M8 3.5a. 5.5 0 0 1 . 5.5v4a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-. 5z"/>
            </svg>
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-1">
          {filteredBooks.map((book, index) => (
            <div
              key={book.bookId}
              className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 rounded hover:bg-[#2a2a2a] group transition"
            >
              {/* Index */}
              <div className="text-gray-400 text-sm flex items-center justify-center group-hover:hidden">
                {index + 1}
              </div>
              <div className="hidden group-hover:flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A. 7.7 0 0 1 3 14.288V1.713z" />
                </svg>
              </div>

              {/* Title & Cover */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 bg-gray-800 relative">
                  {book.coverImageUrl ? (
                    <Image
                      src={book. coverImageUrl}
                      alt={book.title}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs">
                      📖
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-white truncate">{book.title}</div>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center text-gray-400 text-sm truncate">
                {book.author}
              </div>

              {/* Pages */}
              <div className="flex items-center justify-end text-gray-400 text-sm">
                {book.numberOfPages ?  `${book.numberOfPages} pages` : '-'}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredBooks. length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No books found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}