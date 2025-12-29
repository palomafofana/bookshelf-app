'use client';

import { useState } from 'react';
import Image from 'next/image';
import { EnrichedBook } from '@/types/book';

interface BookPlaylistProps {
  books: EnrichedBook[];
  playlistTitle?:  string;
  username?:  string;
}

export default function BookPlaylist({ books, playlistTitle = 'My Reading List', username = 'Reader' }: BookPlaylistProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    pages: ''
  });
  const [isAddingBook, setIsAddingBook] = useState(false);

  // Calculate total pages
  const totalPages = books.reduce((sum, book) => sum + (book.numberOfPages || 0), 0);
  const totalBooks = books.length;

  // Filter books based on search
  const filteredBooks = books. filter(book =>
    book. title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.pages) return;

    setIsAddingBook(true);

    try {
      // Fetch cover from Open Library
      let coverUrl = '';
      if (newBook.isbn) {
        try {
          const response = await fetch(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${newBook.isbn}&format=json&jscmd=data`
          );
          const data = await response.json();
          const bookData = data[`ISBN:${newBook.isbn}`];
          if (bookData?. cover?. large) {
            coverUrl = bookData.cover.large;
          }
        } catch (error) {
          console.error('Error fetching cover:', error);
        }
      }

      // Create book object
      const bookToAdd = {
        bookId:  `manual-${Date.now()}`,
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn || '',
        coverImageUrl: coverUrl,
        dateAdded: new Date().toISOString().split('T')[0],
        exclusiveShelf: 'to-read',
        myRating: 0,
        numberOfPages: 0,
      };

      const { supabase } = await import('@/lib/supabase');
      const { data:  { user } } = await supabase.auth.getUser();
      
      if (! user) {
        alert('You must be logged in to add books');
        return;
      }

      const { error } = await supabase. from('books').insert({
        user_id: user.id,
        title: bookToAdd.title,
        author: bookToAdd.author,
        isbn: bookToAdd.isbn,
        cover_image_url:  bookToAdd.coverImageUrl,
        date_added: bookToAdd.dateAdded,
        exclusive_shelf: bookToAdd.exclusiveShelf,
        my_rating: bookToAdd.myRating,
        number_of_pages: bookToAdd.numberOfPages,
        goodreads_book_id: bookToAdd.bookId,
      });

      if (error) {
        console.error('Database error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert(`Error saving book:  ${error.message || 'Unknown error'}`);
        return;
      }

      // Close modal
      setShowAddBook(false);
      setNewBook({ title:  '', author: '', isbn: '', pages: '' });
      
      // Show success and refresh
      alert('Book added successfully!');
      window.location.reload();

    } catch (error) {
      console.error('Error adding book:', error);
      alert('Error adding book. Please try again.');
    } finally {
      setIsAddingBook(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] via-[#121212] to-[#121212] text-white">
      {/* Playlist Header */}
      <div className="bg-gradient-to-b from-[#282828] to-[#121212] px-8 pt-16 pb-6">
        <div className="flex items-end gap-6">
          {/* Playlist Cover - Stack of books */}
          <div className="w-56 h-56 bg-gradient-to-br from-purple-900 to-blue-900 shadow-2xl flex items-center justify-center relative flex-shrink-0">
            <svg className="w-32 h-32 text-white/90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3h15v-2H6. 012C5.55 19. 988 5 19.806 5 19s.55-.988 1.012-1H21V4c0-1.103-.897-2-2-2zm0 14H5V5c0-. 806.55-. 988 1-1h13v12z"/>
            </svg>
          </div>

          {/* Playlist Info */}
          <div className="flex-1 flex flex-col justify-end pb-2">
            <p className="text-sm font-semibold mb-2">PLAYLIST</p>
            <h1 className="text-7xl font-black mb-6 tracking-tight">
              {playlistTitle}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
              <span className="font-semibold">{username}</span>
              <span className="text-gray-400">• {filteredBooks.length} books</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gradient-to-b from-[#121212]/90 to-[#121212] px-8 py-6 flex items-center gap-4">
        {/* Play Button */}
        <button className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition flex items-center justify-center shadow-xl">
          <svg className="w-6 h-6 text-black ml-1" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A. 7.7 0 0 1 3 14.288V1.713z" />
          </svg>
        </button>

        {/* Add Book Button */}
        <button
          onClick={() => setShowAddBook(true)}
          className="px-6 py-2 border border-gray-400 text-gray-400 hover:border-white hover:text-white rounded-full font-semibold text-sm transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add Book
        </button>

        {/* Search Button */}
        <div className="relative ml-auto">
          <input
            type="text"
            placeholder="Search in playlist"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#2a2a2a] text-white placeholder-gray-400 rounded-md pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Table Section */}
      <div className="container mx-auto px-8 py-6">
        {/* Table Header */}
        <div className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800 mb-2">
          <div className="text-center">#</div>
          <div>Title</div>
          <div>Author</div>
          <div className="text-right pr-8">Pages</div>
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

    {/* Add Book Modal */}
    {showAddBook && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#282828] rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Add a Book</h2>
            <button
              onClick={() => {
                setShowAddBook(false);
                setNewBook({ title: '', author: '', isbn:  '', pages: '' });
              }}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Book Title *
              </label>
              <input
                type="text"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                placeholder="Enter book title"
                className="w-full px-4 py-3 bg-[#181818] text-white rounded border border-gray-700 focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* Author Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Author *
              </label>
              <input
                type="text"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                placeholder="Enter author name"
                className="w-full px-4 py-3 bg-[#181818] text-white rounded border border-gray-700 focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* Pages Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Pages *
              </label>
              <input
                type="number"
                value={newBook. pages}
                onChange={(e) => setNewBook({ ...newBook, pages: e.target.value })}
                placeholder="Enter number of pages"
                className="w-full px-4 py-3 bg-[#181818] text-white rounded border border-gray-700 focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* ISBN Input (for cover fetching) */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                ISBN (optional - helps find cover)
              </label>
              <input
                type="text"
                value={newBook. isbn}
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                placeholder="Enter ISBN"
                className="w-full px-4 py-3 bg-[#181818] text-white rounded border border-gray-700 focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddBook}
                disabled={! newBook.title || !newBook.author || !newBook.pages || isAddingBook}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition"
              >
                {isAddingBook ? 'Adding...' : 'Add Book'}
              </button>
              <button
                onClick={() => {
                  setShowAddBook(false);
                  setNewBook({ title: '', author: '', isbn: '', pages: '' });
                }}
                className="px-6 py-3 text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}