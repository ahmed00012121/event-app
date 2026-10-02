import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../../components/nav";
import Footer from "../../components/footer";
import RecommendCard from "../../components/RecommendCard";
import ChatbotWidget from "../../components/chatbotWidget";
import recommendService from "../../services/recommendService";

const Recommend = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchRecommendations = async () => {
      console.log("Starting recommendations fetch...");
      try {
        setLoading(true);
        setError(null);

        // Check authentication first
        const token = localStorage.getItem('token');
        console.log("Auth token exists:", !!token);
        if (!token) {
          console.log("No token found, redirecting to login...");
          navigate("/login-student");
          return;
        }

        // Fetch recommendations
        console.log("Calling recommendation service...");
        const data = await recommendService.getRecommendations();
        console.log("Recommendations received:", data);
        
        if (!mounted) return;

        // Handle empty data
        if (!data || data.length === 0) {
          console.log("No recommendations received");
          setRecommendations([]);
          return;
        }

        // Validate and set recommendations
        setRecommendations(data);
      } catch (err) {
        console.error("Recommendation fetch error:", err);
        if (mounted) {
          if (err.status === 401) {
            navigate("/login-student");
          } else {
            setError(
              err.userMessage || err.message || 'Could not load recommendations. Please try again.'
            );
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Derived visible recommendations after applying client-side filters
  const visibleRecommendations = recommendations.filter((ev) => {
    // search query matches title or description
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const inTitle = (ev.title || '').toLowerCase().includes(q);
      const inDesc = (ev.description || '').toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }

    // category filter
    if (categoryFilter !== 'all') {
      if ((ev.category || 'Uncategorized').toLowerCase() !== categoryFilter.toLowerCase()) return false;
    }

    // min score
    if (typeof ev.score === 'number') {
      if (ev.score < minScore) return false;
    }

    return true;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
      <Nav />
      
      <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '2.2rem',
            fontWeight: '700',
            color: '#2d3748', 
            marginBottom: '10px',
            marginTop: '20px'
          }}>
            🎯 Recommended for You
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#718096'
          }}>
            Personalized event recommendations based on your interests and attendance
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 40px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'white',
                borderRadius: '50%'
              }} />
            </div>
            <p style={{ color: '#4a5568', fontSize: '1.1rem' }}>
              Finding personalized recommendations...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '30px',
            background: '#fff5f5',
            color: '#c53030',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #feb2b2'
          }}>
            <h3 style={{ marginBottom: '10px' }}>⚠️ Error Loading Recommendations</h3>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#c53030',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Recommendations Grid */}
        {!loading && !error && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {/* Filters */}
            <div style={{ gridColumn: '1 / -1', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                placeholder="Search title or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
              />

              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <option value="all">All categories</option>
                {/* derive categories from recommendations */}
                {Array.from(new Set(recommendations.map(r => (r.category || 'Uncategorized')))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#4a5568' }}>Min score</label>
                <input type="number" min="0" max="5" step="0.1" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} style={{ width: 80, padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </div>
            </div>
            {visibleRecommendations.length > 0 ? (
              visibleRecommendations.map((event) => (
                <RecommendCard
                  key={event._id || event.id}
                  event={event}
                />
              ))
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 40px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📭</div>
                <h3 style={{ marginBottom: '10px', color: '#2d3748' }}>
                  No Recommendations Yet
                </h3>
                <p style={{ marginBottom: '20px', color: '#4a5568', maxWidth: '400px', margin: '0 auto 20px' }}>
                  We're learning your preferences. Register for some events to get personalized recommendations!
                </p>
                <button
                  onClick={() => navigate('/event-details')}
                  style={{
                    background: '#5b8def',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  Browse All Events
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats Section */}
        {!loading && recommendations.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '15px' }}>✨ Recommendation Stats</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  {recommendations.length}
                </div>
                <div style={{ opacity: 0.9 }}>Events Recommended</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  {Math.round(recommendations.reduce((sum, e) => sum + (e.score || 0), 0) / recommendations.length * 100)}%
                </div>
                <div style={{ opacity: 0.9 }}>Average Match</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ChatbotWidget />
      <Footer />

      {/* Loading spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Recommend;
