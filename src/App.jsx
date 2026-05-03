import { useState, useEffect } from 'react';
import PlayerList from './components/PlayerList';
import MatchMaker from './components/MatchMaker';
import MatchHistory from './components/MatchHistory';
import Login from './components/Login';
import { Gamepad2, Users, History, Download, Upload, LogOut } from 'lucide-react';

function App() {
  const [players, setPlayers] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('match');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('eva-auth') === 'true';
  });

  useEffect(() => {
    fetch('/api/state')
      .then(res => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then(data => {
        if (data.players) setPlayers(data.players);
        else {
          const savedPlayers = localStorage.getItem('eva-players');
          if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
        }
        
        if (data.currentMatch !== undefined) setCurrentMatch(data.currentMatch);
        else {
          const savedMatch = localStorage.getItem('eva-match');
          if (savedMatch) setCurrentMatch(JSON.parse(savedMatch));
        }
        
        if (data.matchHistory) setMatchHistory(data.matchHistory);
        else {
          const savedHistory = localStorage.getItem('eva-history');
          if (savedHistory) setMatchHistory(JSON.parse(savedHistory));
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn("API Error, falling back to localStorage", err);
        const savedPlayers = localStorage.getItem('eva-players');
        const savedMatch = localStorage.getItem('eva-match');
        const savedHistory = localStorage.getItem('eva-history');
        if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
        if (savedMatch) setCurrentMatch(JSON.parse(savedMatch));
        if (savedHistory) setMatchHistory(JSON.parse(savedHistory));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (loading) return;
    
    // Save locally always
    localStorage.setItem('eva-players', JSON.stringify(players));
    localStorage.setItem('eva-match', JSON.stringify(currentMatch));
    localStorage.setItem('eva-history', JSON.stringify(matchHistory));

    // Try saving to DB
    const data = { players, currentMatch, matchHistory };
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {}); // ignore error locally
  }, [players, currentMatch, matchHistory, loading]);

  const addPlayer = (name, level) => {
    const newPlayer = {
      id: Date.now().toString(),
      name,
      level: parseInt(level),
      matchesPlayed: 0
    };
    setPlayers([...players, newPlayer]);
  };

  const updatePlayer = (id, updates) => {
    setPlayers(players.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const finishMatch = () => {
    if (!currentMatch) return;
    
    const participatingIds = [
      ...currentMatch.team1.map(p => p.id),
      ...currentMatch.team2.map(p => p.id)
    ];

    setPlayers(players.map(p => {
      if (participatingIds.includes(p.id)) {
        return { ...p, matchesPlayed: p.matchesPlayed + 1 };
      }
      return p;
    }));

    const newMatchRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      team1: currentMatch.team1,
      team2: currentMatch.team2
    };
    
    setMatchHistory([newMatchRecord, ...matchHistory]);
    setCurrentMatch(null);
  };

  const exportData = () => {
    const data = { players, currentMatch, matchHistory };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eva-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.players) setPlayers(data.players);
        if (data.currentMatch !== undefined) setCurrentMatch(data.currentMatch);
        if (data.matchHistory) setMatchHistory(data.matchHistory);
        alert("Données importées avec succès !");
      } catch (err) {
        alert("Erreur lors de l'importation du fichier JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = null; // reset file input
  };

  const handleLogout = () => {
    sessionStorage.removeItem('eva-auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Login onLoginSuccess={() => {
        sessionStorage.setItem('eva-auth', 'true');
        setIsAuthenticated(true);
      }} />
    );
  }

  if (loading) {
    return (
      <div className="eva-container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <h2 className="glow-text text-primary text-2xl">Connexion au serveur...</h2>
      </div>
    );
  }

  return (
    <div className="eva-container">
      <header className="flex md-flex-col justify-between items-center md-items-start mb-8 md-gap-2">
        <div className="w-full">
          <h1 className="glow-text text-primary flex items-center gap-4">
            <Gamepad2 size={32} />
            EVA Match Manager
          </h1>
          <div className="flex md-wrap items-center gap-6 mt-2 mb-4">
            <p className="text-secondary font-bold">4V4 EDITION</p>
            <div className="flex md-wrap gap-2">
              <button onClick={exportData} className="eva-button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', border: '1px solid var(--primary)' }}>
                <Download size={14} /> Exporter
              </button>
              <label className="eva-button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', border: '1px solid var(--primary)', cursor: 'pointer' }}>
                <Upload size={14} /> Importer
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
              </label>
              <button onClick={handleLogout} className="eva-button secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                <LogOut size={14} /> Quitter
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex md-wrap gap-2 w-full">
          <button 
            className={`eva-button ${activeTab === 'players' ? 'secondary' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            <Users size={20} />
            Roster ({players.length})
          </button>
          <button 
            className={`eva-button ${activeTab === 'match' ? 'secondary' : ''}`}
            onClick={() => setActiveTab('match')}
          >
            <Gamepad2 size={20} />
            Match Area
          </button>
          <button 
            className={`eva-button ${activeTab === 'history' ? 'secondary' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={20} />
            Historique
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'players' && (
          <PlayerList 
            players={players} 
            onAdd={addPlayer} 
            onUpdate={updatePlayer}
            onDelete={deletePlayer}
          />
        )}
        {activeTab === 'match' && (
          <MatchMaker 
            players={players} 
            currentMatch={currentMatch}
            setCurrentMatch={setCurrentMatch}
            finishMatch={finishMatch}
            matchHistory={matchHistory}
          />
        )}
        {activeTab === 'history' && (
          <MatchHistory matchHistory={matchHistory} />
        )}
      </main>
    </div>
  );
}

export default App;
