import { Play, Flag, Swords, Check } from 'lucide-react';

// Helper: Get all combinations of size k from an array
function getCombinations(array, k) {
  const results = [];
  function helper(start, combo) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return results;
}

// Helper: calculate total level of a team
const getTeamLevel = (team) => team.reduce((sum, p) => sum + p.level, 0);

function MatchMaker({ players, currentMatch, setCurrentMatch, finishMatch }) {
  const MIN_PLAYERS = 8; // 4v4 format

  const generateMatch = () => {
    // 1. Sort players by matches played (ascending). For ties, shuffle them randomly to ensure rotation.
    const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
    const sortedPlayers = shuffledPlayers.sort((a, b) => a.matchesPlayed - b.matchesPlayed);
    
    // 2. Select the top 8 players who have played the least
    const selectedPlayers = sortedPlayers.slice(0, 8);

    // 3. Find the best combination to balance levels
    const team1Combinations = getCombinations(selectedPlayers, 4);
    let bestTeam1 = null;
    let bestTeam2 = null;
    let minDifference = Infinity;

    team1Combinations.forEach(t1 => {
      // Team 2 is the remaining players
      const t1Ids = t1.map(p => p.id);
      const t2 = selectedPlayers.filter(p => !t1Ids.includes(p.id));

      const diff = Math.abs(getTeamLevel(t1) - getTeamLevel(t2));
      
      if (diff < minDifference) {
        minDifference = diff;
        bestTeam1 = t1;
        bestTeam2 = t2;
      }
    });

    setCurrentMatch({
      team1: bestTeam1,
      team2: bestTeam2,
      levelDiff: minDifference
    });
  };

  if (players.length < MIN_PLAYERS) {
    return (
      <div className="eva-card text-center py-12">
        <Swords size={64} className="mx-auto mb-4 text-secondary opacity-50" />
        <h2 className="text-xl mb-2">Pas assez de joueurs</h2>
        <p className="opacity-70">
          Vous avez {players.length} joueur(s) sur les {MIN_PLAYERS} nécessaires pour un match 4v4.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {!currentMatch ? (
        <div className="eva-card text-center py-12">
          <h2 className="text-2xl mb-4 glow-text">Prêt pour le combat ?</h2>
          <p className="mb-8 opacity-80">
            L'algorithme va sélectionner les {MIN_PLAYERS} joueurs ayant le moins joué et créer deux équipes équilibrées (4v4).
          </p>
          <button onClick={generateMatch} className="eva-button" style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}>
            <Play size={24} />
            Générer le Match
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="flex justify-between items-center bg-black/30 p-4 rounded-lg border border-gray-800">
            <div>
              <h3 className="text-xl font-bold glow-text-secondary flex items-center gap-2">
                <Flag className="text-secondary" /> BO3 EN COURS
              </h3>
              <p className="text-sm opacity-60 mt-1">Écart de niveau total : {currentMatch.levelDiff}</p>
            </div>
            <button onClick={finishMatch} className="eva-button secondary">
              <Check className="mr-2" /> Terminer le Match
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Team 1 - BLUE */}
            <div className="eva-card" style={{ borderColor: 'rgba(0, 240, 255, 0.5)' }}>
              <h3 className="text-2xl text-center mb-6 text-primary glow-text" style={{ fontFamily: 'var(--font-display)' }}>ÉQUIPE BLEUE</h3>
              <div className="mb-4 text-center opacity-70">
                Niveau Global : <span className="font-bold text-white">{getTeamLevel(currentMatch.team1)}</span>
              </div>
              <table style={{ background: 'rgba(0, 240, 255, 0.05)' }}>
                <tbody>
                  {currentMatch.team1.map(player => (
                    <tr key={player.id}>
                      <td className="font-bold">{player.name}</td>
                      <td className="text-right">Niv. {player.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Team 2 - RED */}
            <div className="eva-card" style={{ borderColor: 'rgba(255, 0, 85, 0.5)' }}>
              <h3 className="text-2xl text-center mb-6 text-secondary glow-text-secondary" style={{ fontFamily: 'var(--font-display)' }}>ÉQUIPE ROUGE</h3>
              <div className="mb-4 text-center opacity-70">
                Niveau Global : <span className="font-bold text-white">{getTeamLevel(currentMatch.team2)}</span>
              </div>
              <table style={{ background: 'rgba(255, 0, 85, 0.05)' }}>
                <tbody>
                  {currentMatch.team2.map(player => (
                    <tr key={player.id}>
                      <td className="font-bold">{player.name}</td>
                      <td className="text-right">Niv. {player.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="text-center mt-4 text-sm opacity-50">
            * Les matchs joués de ces joueurs seront incrémentés de 1 une fois le match terminé.
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchMaker;
