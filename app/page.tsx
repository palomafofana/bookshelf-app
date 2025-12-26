'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import BookPlaylist from '@/components/BookPlaylist';
import { EnrichedBook } from '@/types/book';

export default function Home() {
  const [books, setBooks] = useState<EnrichedBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleBooksLoaded = (loadedBooks: EnrichedBook[]) => {
    setBooks(loadedBooks);
  };

  return (
    <main className="min-h-screen bg-[#121212]">
      {! isLoading && books.length === 0 && (
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-5xl font-bold text-center text-white mb-4">
            My Reading List
          </h1>
          <p className="text-center text-gray-400 mb-12">
            Upload your Goodreads library to create your reading playlist
          </p>
          <FileUploader onBooksLoaded={handleBooksLoaded} setIsLoading={setIsLoading} />
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading your books... </p>
          </div>
        </div>
      )}

      {books.length > 0 && !isLoading && (
        <BookPlaylist books={books} />
      )}
    </main>
  );
}