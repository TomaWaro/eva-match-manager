import { History, Calendar } from 'lucide-react';

function MatchHistory({ matchHistory }) {
  if (!matchHistory || matchHistory.length === 0) {
    return (
      <div className="eva-card text-center py-12">
        <History size={64} className="mx-auto mb-4 text-secondary opacity-50" />
        <h2 className="text-xl mb-2">Aucun historique</h2>
        <p className="opacity-70">
          Les prochains matchs terminés apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
        <History className="text-primary" />
        Historique des Matchs ({matchHistory.length})
      </h2>
      
      {matchHistory.map((match, index) => (
        <div key={match.id} className="eva-card p-6">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <span className="text-lg font-bold text-primary">Match #{matchHistory.length - index}</span>
            <span className="text-sm opacity-60 flex items-center gap-2">
              <Calendar size={16} />
              {new Date(match.date).toLocaleString('fr-FR', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
              })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Team Blue */}
            <div className="p-3 bg-black/20 rounded border border-cyan-900">
              <h4 className="text-primary mb-2 text-center" style={{ fontFamily: 'var(--font-display)' }}>ÉQUIPE BLEUE</h4>
              <ul className="text-sm opacity-80 text-center">
                {match.team1.map(p => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </div>
            
            {/* Team Red */}
            <div className="p-3 bg-black/20 rounded border border-pink-900">
              <h4 className="text-secondary mb-2 text-center" style={{ fontFamily: 'var(--font-display)' }}>ÉQUIPE ROUGE</h4>
              <ul className="text-sm opacity-80 text-center">
                {match.team2.map(p => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MatchHistory;
