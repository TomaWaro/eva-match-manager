import { useState } from 'react';
import { Play, Flag, Swords, Check, GripVertical } from 'lucide-react';

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

function MatchMaker({ players, currentMatch, setCurrentMatch, finishMatch, matchHistory }) {
  const MIN_PLAYERS = 8; // 4v4 format
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const handleDragStart = (e, player, teamKey) => {
    setDraggedItem({ player, teamKey });
    setTimeout(() => {
      if (e.target) e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    if (e.target) e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverId(null);
  };

  const handleDragOver = (e, targetPlayerId) => {
    e.preventDefault();
    if (draggedItem && draggedItem.player.id !== targetPlayerId) {
      setDragOverId(targetPlayerId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e, targetPlayer, targetTeamKey) => {
    e.preventDefault();
    setDragOverId(null);
    if (e.target) e.target.style.opacity = '1';

    if (!draggedItem || draggedItem.player.id === targetPlayer.id) return;

    const sourceTeamKey = draggedItem.teamKey;
    const newTeams = {
      team1: [...currentMatch.team1],
      team2: [...currentMatch.team2]
    };

    newTeams[sourceTeamKey] = newTeams[sourceTeamKey].map(p => 
      p.id === draggedItem.player.id ? targetPlayer : p
    );

    newTeams[targetTeamKey] = newTeams[targetTeamKey].map(p => 
      p.id === targetPlayer.id ? draggedItem.player : p
    );

    const newDiff = Math.abs(getTeamLevel(newTeams.team1) - getTeamLevel(newTeams.team2));

    setCurrentMatch({
      team1: newTeams.team1,
      team2: newTeams.team2,
      levelDiff: newDiff
    });
  };

  const generateMatch = () => {
    // 1. Calculate rotation stats for each player
    const playerStats = players.map(player => {
      let consecutive = 0;
      let sinceLast = 0;
      // Calculate priority score
      let priorityScore = player.matchesPlayed;

      // Simplified logic:
      // consecutive: how many of the last N matches did they play without a break?
      for (let i = 0; i < matchHistory.length; i++) {
        const match = matchHistory[i];
        const played = [...match.team1, ...match.team2].some(p => p.id === player.id);
        if (played) consecutive++;
        else break;
      }

      // sinceLast: how many of the last N matches did they miss?
      for (let i = 0; i < matchHistory.length; i++) {
        const match = matchHistory[i];
        const played = [...match.team1, ...match.team2].some(p => p.id === player.id);
        if (!played) sinceLast++;
        else break;
      }

      // RULE 1 (Priority): "Anti-banc" -> Priority to those who waited
      if (sinceLast >= 3) priorityScore -= 500; // Absolute priority
      else if (sinceLast === 2) priorityScore -= 50; // High priority
      
      // RULE 2: "Anti-enchaînement" -> Penalty to those who play too much
      if (consecutive >= 3) priorityScore += 500; // Forced rest
      else if (consecutive === 2) priorityScore += 50; // Soft rest recommendation

      // Small penalty if played the very last match to break ties in favor of bench
      if (consecutive > 0) priorityScore += 5;

      return { ...player, priorityScore, rotationStats: { consecutive, sinceLast } };
    });

    // 2. Sort by priority score and pick 8
    const shuffled = [...playerStats].sort(() => 0.5 - Math.random());
    const sorted = shuffled.sort((a, b) => a.priorityScore - b.priorityScore);
    const selectedPlayers = sorted.slice(0, 8);

    // 3. Find the best combination to balance levels
    const team1Combinations = getCombinations(selectedPlayers, 4);
    let bestTeam1 = null;
    let bestTeam2 = null;
    let minDifference = Infinity;

    team1Combinations.forEach(t1 => {
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
              <div className="table-responsive">
                <table style={{ background: 'rgba(0, 240, 255, 0.05)' }}>
                  <tbody>
                    {currentMatch.team1.map(player => (
                      <tr 
                        key={player.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, player, 'team1')}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, player.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, player, 'team1')}
                        className={`draggable-row ${dragOverId === player.id ? 'drag-over' : ''}`}
                      >
                        <td className="font-bold flex items-center gap-2">
                          <GripVertical size={16} className="opacity-50" />
                          {player.name}
                        </td>
                        <td className="text-right">Niv. {player.level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team 2 - RED */}
            <div className="eva-card" style={{ borderColor: 'rgba(255, 0, 85, 0.5)' }}>
              <h3 className="text-2xl text-center mb-6 text-secondary glow-text-secondary" style={{ fontFamily: 'var(--font-display)' }}>ÉQUIPE ROUGE</h3>
              <div className="mb-4 text-center opacity-70">
                Niveau Global : <span className="font-bold text-white">{getTeamLevel(currentMatch.team2)}</span>
              </div>
              <div className="table-responsive">
                <table style={{ background: 'rgba(255, 0, 85, 0.05)' }}>
                  <tbody>
                    {currentMatch.team2.map(player => (
                      <tr 
                        key={player.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, player, 'team2')}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, player.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, player, 'team2')}
                        className={`draggable-row ${dragOverId === player.id ? 'drag-over' : ''}`}
                      >
                        <td className="font-bold flex items-center gap-2">
                          <GripVertical size={16} className="opacity-50" />
                          {player.name}
                        </td>
                        <td className="text-right">Niv. {player.level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
