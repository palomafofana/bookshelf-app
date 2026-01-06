'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { EnrichedBook } from '@/types/book';
import { supabase } from '@/lib/supabase';

interface SharedBook extends EnrichedBook {
  yourReview?: string;
  theirReview?: string;
  yourRating?: number;
  theirRating?: number;
}

export default function SharedBooksPage() {
  const params = useParams();
  const router = useRouter();
  const friendUsername = params.username as string;
  const { user, profile, loading:  authLoading } = useAuth();
  
  const [sharedBooks, setSharedBooks] = useState<SharedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth');
      } else if (friendUsername) {
        loadSharedBooks();
      }
    }
  }, [user, friendUsername, authLoading]);

  const loadSharedBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Looking for username:', friendUsername);

      // Get friend's profile
      const { data: friend, error: friendError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', friendUsername)
        .single();

      console.log('Friend query result:', { friend, friendError });

      if (friendError) {
        console.error('Friend error:', friendError);
        if (friendError.code === 'PGRST116') {
          setError(`User "${friendUsername}" not found`);
        } else {
          setError(`Error finding user:  ${friendError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!friend) {
        setError(`User "${friendUsername}" not found`);
        setLoading(false);
        return;
      }

      setFriendProfile(friend);

      // Get your books
      const { data: yourBooks, error: yourError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user! .id);

      console.log('Your books:', yourBooks?. length);

      if (yourError) {
        console.error('Your books error:', yourError);
        throw yourError;
      }

      // Get friend's books
      const { data:  theirBooks, error: theirError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', friend.id);

      console.log('Their books:', theirBooks?.length);

      if (theirError) {
        console.error('Their books error:', theirError);
        throw theirError;
      }

      // Find books in common (by title and author)
      const commonBooks:  SharedBook[] = [];
      
      yourBooks?.forEach(yourBook => {
        const matchingBook = theirBooks?.find(
          theirBook => 
            yourBook.title. toLowerCase().trim() === theirBook.title.toLowerCase().trim() &&
            yourBook.author.toLowerCase().trim() === theirBook.author.toLowerCase().trim()
        );

        if (matchingBook) {
          commonBooks.push({
            ...yourBook,
            yourReview: yourBook.my_review,
            theirReview: matchingBook.my_review,
            yourRating:  yourBook.my_rating,
            theirRating: matchingBook.my_rating,
            bookId: yourBook.goodreads_book_id,
            title: yourBook.title,
            author: yourBook.author,
            coverImageUrl: yourBook.cover_image_url || matchingBook.cover_image_url,
            numberOfPages: yourBook.number_of_pages,
            isbn: yourBook.isbn,
            isbn13: yourBook.isbn13,
            myRating: yourBook.my_rating,
            dateRead: yourBook.date_read,
            dateAdded: yourBook.date_added,
            exclusiveShelf: yourBook.exclusive_shelf,
            publisher: yourBook.publisher,
            binding: yourBook.binding,
            yearPublished: yourBook.year_published,
            originalPublicationYear: yourBook.original_publication_year,
            averageRating: yourBook.average_rating,
            myReview: yourBook.my_review,
            spoiler: yourBook.spoiler,
            privateNotes: yourBook.private_notes,
            readCount: yourBook.read_count,
            ownedCopies: yourBook.owned_copies,
            authorLastFirst: yourBook.author_last_first,
            additionalAuthors: yourBook.additional_authors,
            bookshelves: [],
          });
        }
      });

      console.log('Common books found:', commonBooks.length);
      setSharedBooks(commonBooks);
    } catch (error:  any) {
      console.error('Error loading shared books:', error);
      setError(`Error loading shared books: ${error. message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading shared books...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">{error}</h2>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-green-500 hover:bg-green-400 px-6 py-3 rounded-full font-semibold transition"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-md border-b border-gray-800 px-8 py-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-52 h-52 bg-gradient-to-br from-pink-900 to-purple-900 flex items-center justify-center shadow-2xl">
            <svg className="w-24 h-24" viewBox="0 0 24 24" fill="white">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-2">SHARED LIBRARY</p>
            <h1 className="text-6xl font-bold mb-4">
              {profile?.username} × {friendProfile?.username}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{sharedBooks.length} books in common</span>
            </div>
          </div>
        </div>
      </div>

      {/* Books List */}
      <div className="container mx-auto px-8 py-6">
        {sharedBooks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl mb-2">No books in common yet</p>
            <p>Keep reading and check back later! </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sharedBooks.map((book, index) => (
              <div
                key={`${book.bookId}-${index}`}
                className="bg-[#181818] rounded-lg p-6 hover:bg-[#282828] transition"
              >
                <div className="flex gap-6">
                  {/* Book Cover */}
                  <div className="w-32 h-48 flex-shrink-0 bg-gray-800 relative">
                    {book.coverImageUrl ?  (
                      <Image
                        src={book.coverImageUrl}
                        alt={book. title}
                        width={128}
                        height={192}
                        className="w-full h-full object-cover rounded"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs rounded">
                        No Cover
                      </div>
                    )}
                  </div>

                  {/* Book Info & Reviews */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{book.title}</h3>
                    <p className="text-gray-400 mb-4">{book.author}</p>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Your Review */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{profile?.username}</h4>
                          {book.yourRating ?  renderStars(book.yourRating) : null}
                        </div>
                        {book.yourReview ?  (
                          <p className="text-sm text-gray-300 bg-[#121212] p-4 rounded">
                            {book.yourReview}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No review yet</p>
                        )}
                      </div>

                      {/* Their Review */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{friendProfile?.username}</h4>
                          {book.theirRating ? renderStars(book.theirRating) : null}
                        </div>
                        {book.theirReview ? (
                          <p className="text-sm text-gray-300 bg-[#121212] p-4 rounded">
                            {book.theirReview}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No review yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}