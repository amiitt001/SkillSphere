'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/hooks';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Calendar, Trash2, ArrowRight, BookOpen, Tag } from 'lucide-react';

interface HistoryItem {
  id: string;
  title: string;
  createdAt: any;
  academicStream: string;
  skills: string[];
  interests: string[];
  recommendations: string[];
}

function HistoryContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'history', user.uid, 'entries'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const items: HistoryItem[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let parsedContent = { academicStream: '', skills: [], interests: [], recommendations: [] };
        
        if (data.content) {
          try {
            const parsed = JSON.parse(data.content);
            parsedContent = {
              academicStream: parsed.academicStream || '',
              skills: parsed.skills || [],
              interests: parsed.interests || [],
              recommendations: (parsed.recommendations || []).map((r: any) => r.title),
            };
          } catch (e) {
            console.error("Failed to parse history entry content:", e);
          }
        }

        items.push({
          id: doc.id,
          title: data.title || 'Untitled Session',
          createdAt: data.createdAt,
          academicStream: parsedContent.academicStream,
          skills: parsedContent.skills,
          interests: parsedContent.interests,
          recommendations: parsedContent.recommendations,
        });
      });

      setHistoryItems(items);
    } catch (err: any) {
      console.error("Error loading history:", err);
      setError('Unable to load your career search history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this session from your history?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'history', user.uid, 'entries', id));
      setHistoryItems((prev) => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error deleting history document:", err);
      alert('Failed to delete history entry. Please try again.');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown Date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 lg:py-12">
      <div className="mb-10 animate-fade-in text-center md:text-left">
        <div className="section-label mb-2">My History</div>
        <h1 className="text-4xl font-display font-bold text-primary leading-tight">
          Career Diagnostics <span className="text-teal">Catalog</span>
        </h1>
        <p className="text-secondary mt-3 max-w-2xl">
          Review your past AI Career diagnostic searches, matched profiles, generated roadmaps, and skills reports.
        </p>
      </div>

      {error && (
        <div className="glass p-6 border-rose/30 text-rose text-center mb-8">
          {error}
        </div>
      )}

      {historyItems.length === 0 ? (
        <div className="glass p-12 text-center border-white/5 rounded-2xl animate-fade-up">
          <div className="text-4xl mb-4">🧭</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Past Sessions Found</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">
            Get started by inputting your academic stream and interests on the career advisor dashboard.
          </p>
          <Link href="/dashboard" className="btn-primary py-2.5 px-6 inline-flex no-underline">
            Go to Advisor
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {historyItems.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/results?session=${item.id}`}
              className="glass p-6 md:p-8 border-white/5 relative overflow-hidden group no-underline hover:border-teal/30 hover:shadow-glow-teal/5 transition-all block animate-fade-up"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-zinc-800 group-hover:bg-teal transition-all"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-teal transition-colors flex items-center gap-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(item.createdAt)}
                    </span>
                    {item.academicStream && (
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} /> {item.academicStream}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-2 rounded-lg bg-zinc-900/50 hover:bg-rose/10 border border-zinc-800 hover:border-rose/20 text-zinc-500 hover:text-rose transition-colors"
                    title="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="btn-ghost py-1.5 px-4 text-xs font-semibold flex items-center gap-1 group-hover:bg-white group-hover:text-black">
                    View Maps <ArrowRight size={13} />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-4 border-t border-zinc-900">
                {/* Skills used */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase tracking-wider flex items-center gap-1">
                    <Tag size={10} /> Profile Skills
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.skills.map((skill, index) => (
                      <span key={index} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                    {item.skills.length === 0 && (
                      <span className="text-xs text-zinc-600 italic">No skills listed</span>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase tracking-wider flex items-center gap-1">
                    🚀 Career Recommendations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.recommendations.map((rec, index) => (
                      <span key={index} className="text-[10px] bg-teal/5 border border-teal/10 text-teal px-2 py-0.5 rounded font-medium">
                        {rec}
                      </span>
                    ))}
                    {item.recommendations.length === 0 && (
                      <span className="text-xs text-zinc-600 italic">No paths mapped yet</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
