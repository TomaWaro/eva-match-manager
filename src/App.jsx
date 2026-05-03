import { useState, useEffect } from 'react';
import PlayerList from './components/PlayerList';
import MatchMaker from './components/MatchMaker';
import MatchHistory from './components/MatchHistory';
import { Gamepad2, Users, History, Download, Upload } from 'lucide-react';

function App() {
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('eva-players');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentMatch, setCurrentMatch] = useState(() => {
    const saved = localStorage.getItem('eva-match');
    return saved ? JSON.parse(saved) : null;
  });

  const [matchHistory, setMatchHistory] = useState(() => {
    const saved = localStorage.getItem('eva-history');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState('match'); // 'match', 'players', or 'history'

  useEffect(() => {
    localStorage.setItem('eva-players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('eva-match', JSON.stringify(currentMatch));
  }, [currentMatch]);

  useEffect(() => {
    localStorage.setItem('eva-history', JSON.stringify(matchHistory));
  }, [matchHistory]);

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

  return (
    <div className="eva-container">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="glow-text text-primary flex items-center gap-4">
            <Gamepad2 size={40} />
            EVA Match Manager
          </h1>
          <div className="flex items-center gap-6 mt-2">
            <p className="text-secondary font-bold">4V4 EDITION</p>
            <div className="flex gap-2">
              <button onClick={exportData} className="eva-button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', border: '1px solid var(--primary)' }}>
                <Download size={14} /> Exporter
              </button>
              <label className="eva-button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', border: '1px solid var(--primary)', cursor: 'pointer' }}>
                <Upload size={14} /> Importer
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
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
