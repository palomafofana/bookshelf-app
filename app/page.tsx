// app/page.tsx
'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import { EnrichedBook } from '@/types/book';

export default function Home() {
  const [books, setBooks] = useState<EnrichedBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleBooksLoaded = (loadedBooks: EnrichedBook[]) => {
    setBooks(loadedBooks);
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-amber-900 mb-4">
            My Reading Bookshelf
          </h1>
          <p className="text-lg text-amber-700">
            Import your Goodreads library and visualize your reading journey
          </p>
        </header>

        {books.length === 0 ? (
          <FileUploader 
            onBooksLoaded={handleBooksLoaded}
            setIsLoading={setIsLoading}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-center text-gray-600">
              Loaded {books.length} books!  📚
            </p>
            {/* We'll add the bookshelf visualization here next */}
          </div>
        )}

        {isLoading && (
          <div className="text-center mt-8">
            <p className="text-amber-700">Loading your books...</p>
          </div>
        )}
      </div>
    </main>
  );
}