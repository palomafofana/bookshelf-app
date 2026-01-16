'use client';

import { useState } from 'react';
import Image from 'next/image';
import { EnrichedBook } from '@/types/book';

interface BookPlaylistProps {
  books:  EnrichedBook[];
  playlistTitle?:  string;
  username?:  string;
  profile?: any; 
  showShareModal?:  boolean;
  setShowShareModal?: (show: boolean) => void;
}

export default function BookPlaylist({ 
  books, 
  playlistTitle = 'My Reading List', 
  username = 'Reader',
  profile,
  showShareModal:  externalShowShareModal,
  setShowShareModal: externalSetShowShareModal 
}: BookPlaylistProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    pages: ''
  });
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<EnrichedBook | null>(null);
  const [newISBN, setNewISBN] = useState('');
  const [isChangingCover, setIsChangingCover] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const isFriendsPlaylist = !!profile?.isFriend;
  console.log('Friend playlist check:', { isFriendsPlaylist, profile, username });

  // Calculate total pages
  const totalPages = books.reduce((sum, book) => sum + (book.numberOfPages || 0), 0);
  const totalBooks = books.length;

  // Filter books based on search
  const filteredBooks = books. filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleOpenCoverModal = (book:  EnrichedBook) => {
    setSelectedBook(book);
    setNewISBN('');
    setPreviewCover(null);
    setShowCoverModal(true);
    setOpenMenuId(null);
  };

  const handleChangeCover = async () => {
    if (!selectedBook || !newISBN.trim() || !previewCover) return;

    setIsChangingCover(true);

    try {
      // Use the already-loaded preview cover URL
      const coverUrl = previewCover;

      // Update database
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase. auth.getUser();
      
      if (! user) {
        alert('You must be logged in to change covers');
        setIsChangingCover(false);
        return;
      }

      const { error } = await supabase
        . from('books')
        .update({ 
          cover_image_url: coverUrl,
          isbn: newISBN.trim()
        })
        .eq('user_id', user.id)
        .eq('goodreads_book_id', selectedBook. bookId);

      if (error) {
        console.error('Database error:', error);
        alert(`Error updating cover: ${error.message || 'Unknown error'}`);
        return;
      }

      // Close modal and refresh
      setShowCoverModal(false);
      setSelectedBook(null);
      setNewISBN('');
      setPreviewCover(null);
      alert('Cover updated successfully!');
      window.location.reload();

    } catch (error) {
      console.error('Error changing cover:', error);
      alert('Error changing cover. Please try again.');
    } finally {
      setIsChangingCover(false);
    }
  };

  const handlePreviewCover = async (isbn: string) => {
    if (!isbn.trim()) {
      setPreviewCover(null);
      return;
    }

    setLoadingPreview(true);

    try {
      const cleanISBN = isbn.trim().replace(/[^0-9X]/gi, ''); // Remove dashes and spaces
      
      // 1. Try Open Library API (with ISBN-13 format)
      try {
        const olResponse = await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`
        );
        const olData = await olResponse.json();
        const bookData = olData[`ISBN:${cleanISBN}`];
        
        if (bookData?. cover?.large) {
          setPreviewCover(bookData. cover.large);
          setLoadingPreview(false);
          return;
        }
      } catch (e) {
        console.log('Open Library API failed, trying direct cover.. .');
      }

      // 2. Try Open Library direct cover URL
      try {
        const directUrl = `https://covers.openlibrary.org/b/isbn/${cleanISBN}-L.jpg`;
        const directResponse = await fetch(directUrl);
        if (directResponse.ok) {
          const blob = await directResponse.blob();
          if (blob.size > 1000) {
            setPreviewCover(directUrl);
            setLoadingPreview(false);
            return;
          }
        }
      } catch (e) {
        console.log('Open Library direct cover failed, trying Google Books...');
      }

      // 3. Try Google Books API (with API key for better rate limits)
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
        const gbUrl = apiKey 
          ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}&key=${apiKey}`
          : `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`;
        
        const gbResponse = await fetch(gbUrl);
        const gbData = await gbResponse.json();
        
        if (gbData.items && gbData.items.length > 0) {
          const volumeInfo = gbData.items[0]. volumeInfo;
          
          if (volumeInfo.imageLinks) {
            const coverUrl = 
              volumeInfo.imageLinks.extraLarge ||
              volumeInfo.imageLinks.large ||
              volumeInfo.imageLinks.medium ||
              volumeInfo.imageLinks.thumbnail;
            
            if (coverUrl) {
              const highResUrl = coverUrl
                .replace('http://', 'https://')
                .replace('&zoom=1', '&zoom=3')
                .replace('&edge=curl', '');
              
              setPreviewCover(highResUrl);
              setLoadingPreview(false);
              return;
            }
          }
        }
      } catch (e) {
        console.log('Google Books failed, trying Amazon...');
      }

      // 4. Try Amazon cover
      try {
        const amazonUrl = `https://images-na.ssl-images-amazon.com/images/P/${cleanISBN}.jpg`;
        const amazonResponse = await fetch(amazonUrl);
        if (amazonResponse.ok) {
          const blob = await amazonResponse.blob();
          if (blob.size > 1000) {
            setPreviewCover(amazonUrl);
            setLoadingPreview(false);
            return;
          }
        }
      } catch (e) {
        console.log('Amazon failed');
      }

      setPreviewCover(null);
      
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewCover(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDeleteBook = async (book: EnrichedBook) => {
    if (!confirm(`Are you sure you want to delete "${book.title}"?  This action cannot be undone.`)) {
      return;
    }

    setOpenMenuId(null);

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase. auth.getUser();
      
      if (! user) {
        alert('You must be logged in to delete books');
        return;
      }

      const { error } = await supabase
        .from('books')
        .delete()
        .eq('user_id', user.id)
        .eq('goodreads_book_id', book.bookId);

      if (error) {
        console.error('Database error:', error);
        alert(`Error deleting book: ${error.message || 'Unknown error'}`);
        return;
      }

      alert('Book deleted successfully!');
      window.location.reload();

    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error deleting book. Please try again.');
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
      <div className={`grid ${isFriendsPlaylist ? 'grid-cols-[16px_4fr_2fr_1fr_56px_56px_40px]' : 'grid-cols-[16px_4fr_2fr_1fr_56px_40px]'} gap-4 pl-8 pr-4 py-2 text-sm text-gray-400 border-b border-gray-800 mb-2`}>
        <div className="text-center">#</div>
        <div>Title</div>
        <div className="flex items-center justify-start pl-2">Author</div>
        <div className="pl-2">Pages</div>
        {isFriendsPlaylist ? (
          <>
            <div className="text-center">Your rating</div>
            <div className="text-center">{`${username}'s rating`}</div>
          </>
        ) : (
          <div className="text-center">Rating</div>
        )}
      </div>

        {/* Table Rows */}
        <div className="space-y-1">
          {filteredBooks.map((book, index) => (
            <div
              key={book.bookId}
              className={`grid ${isFriendsPlaylist ? 'grid-cols-[16px_4fr_2fr_1fr_56px_56px_40px]' : 'grid-cols-[16px_4fr_2fr_1fr_56px_40px]'} gap-4 pl-8 pr-4 py-2 rounded hover:bg-[#2a2a2a] group transition relative`}
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
              <div className="flex items-center gap-3 min-w-0">
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
              <div className="flex items-center justify-start text-gray-400 text-sm truncate min-w-0 pl-2">
                {book.author}
              </div>

              {/* Pages */}
              <div className="flex items-center justify-start text-gray-400 text-sm pl-2">
                {book.numberOfPages ? `${book.numberOfPages} pages` : '-'}
              </div>

              {/* Rating */}
              {isFriendsPlaylist ? (
                <>
                  {/* Your rating (viewer) */}
                  <div className="flex items-center justify-center text-gray-400 text-sm">
                    {book.myRating ? `${book.myRating}☆` : '-'}
                  </div>

                  {/* Friend / playlist owner's rating */}
                  <div className="flex items-center justify-center text-gray-400 text-sm">
                    {book.friendRating ? `${book.friendRating}☆` : '-'}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center text-gray-400 text-sm">
                  {book.myRating ? `${book.myRating}☆` : '-'}
                </div>
              )}

              {/* Three Dots Menu */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setOpenMenuId(openMenuId === book.bookId ?  null : book.bookId)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3a3a3a] rounded transition"
                >
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {openMenuId === book.bookId && (
                  <div className="absolute right-8 top-full mt-1 bg-[#282828] rounded-md shadow-xl py-1 z-20 min-w-[200px]">
                    <button
                      onClick={() => handleOpenCoverModal(book)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#3a3a3a] transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Change Cover
                    </button>

                    <button
                      onClick={() => handleDeleteBook(book)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#3a3a3a] transition flex items-center gap-2 text-red-400 hover:text-red-300"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Delete Book
                    </button>
                  </div>
                )}
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

    {/* Change Cover Modal */}
    {showCoverModal && selectedBook && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-[#282828] rounded-lg p-8 w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Change Book Cover</h2>
          <p className="text-gray-400 mb-6">for "{selectedBook.title}"</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">New ISBN</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newISBN}
                  onChange={(e) => {
                    setNewISBN(e.target.value);
                    // Auto-preview after typing stops (debounced)
                    clearTimeout((window as any).isbnTimeout);
                    (window as any).isbnTimeout = setTimeout(() => {
                      handlePreviewCover(e.target.value);
                    }, 500);
                  }}
                  className="flex-1 bg-[#3a3a3a] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Paste ISBN here"
                  autoFocus
                />
                <button
                  onClick={() => handlePreviewCover(newISBN)}
                  disabled={loadingPreview || !newISBN.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition"
                >
                  {loadingPreview ? 'Loading...' : 'Preview'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Paste the ISBN of the book with the cover you want to use
              </p>
            </div>

            {/* Cover Preview Section */}
            <div className="flex gap-8 items-start">
              {/* Current Cover */}
              {selectedBook.coverImageUrl && (
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Current Cover</label>
                  <div className="w-32 h-48 bg-gray-800 relative">
                    <Image
                      src={selectedBook.coverImageUrl}
                      alt={selectedBook. title}
                      width={128}
                      height={192}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Arrow */}
              {previewCover && (
                <div className="flex items-center justify-center pt-12">
                  <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* New Cover Preview */}
              {previewCover && (
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">New Cover Preview</label>
                  <div className="w-32 h-48 bg-gray-800 relative border-2 border-green-500">
                    <Image
                      src={previewCover}
                      alt="Preview"
                      width={128}
                      height={192}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loadingPreview && (
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">New Cover Preview</label>
                  <div className="w-32 h-48 bg-gray-800 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                </div>
              )}

              {/* No Preview State */}
              {!previewCover && ! loadingPreview && newISBN.trim() && (
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">New Cover Preview</label>
                  <div className="w-32 h-48 bg-gray-800 flex items-center justify-center text-gray-500 text-sm text-center p-2">
                    No cover found
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => {
                setShowCoverModal(false);
                setSelectedBook(null);
                setNewISBN('');
                setPreviewCover(null);
              }}
              className="flex-1 bg-transparent border border-gray-600 hover:border-white rounded-full px-6 py-3 font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleChangeCover}
              disabled={isChangingCover || !newISBN.trim() || !previewCover}
              className="flex-1 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-full px-6 py-3 transition"
            >
              {isChangingCover ? 'Updating...' : 'Update Cover'}
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}