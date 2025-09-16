import React, { useState, useEffect } from 'react';

const App = () => {
  // Charge les données depuis localStorage et convertit les dates
  const [qualifications, setQualifications] = useState(() => {
    const saved = localStorage.getItem('qualifications');
    if (!saved) return [
      {
        id: 1,
        name: "v2.1.0",
        team: "Équipe A",
        description: "Mise à jour des composants de sécurité",
        startDate: new Date(2024, 8, 15), 
        endDate: new Date(2024, 8, 25),
        environment: "simulation légère",
        color: "#3B82F6",
        deployed: false
      },
      {
        id: 2,
        name: "v2.2.0",
        team: "Équipe B",
        description: "Optimisation des performances du système",
        startDate: new Date(2024, 8, 20),
        endDate: new Date(2024, 9, 5),
        environment: "simulation lourde",
        color: "#10B981",
        deployed: false
      },
      {
        id: 3,
        name: "v3.0.0",
        team: "Équipe C",
        description: "Migration vers la nouvelle architecture",
        startDate: new Date(2024, 9, 1),
        endDate: new Date(2024, 9, 15),
        environment: "préexpo",
        color: "#F59E0B",
        deployed: true
      },
      {
        id: 4,
        name: "v3.1.0",
        team: "Équipe A",
        description: "Correction de bugs critiques",
        startDate: new Date(2024, 9, 10),
        endDate: new Date(2024, 9, 20),
        environment: "préexpo",
        color: "#EF4444",
        deployed: false
      },
      {
        id: 5,
        name: "v3.2.0",
        team: "Équipe B",
        description: "Nouvelles fonctionnalités utilisateur",
        startDate: new Date(2024, 9, 18),
        endDate: new Date(2024, 9, 28),
        environment: "simulation légère",
        color: "#60A5FA",
        deployed: false
      }
    ];

    return JSON.parse(saved).map(qual => ({
      ...qual,
      startDate: new Date(qual.startDate),
      endDate: new Date(qual.endDate)
    }));
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem('selectedDate');
    return saved ? new Date(saved) : new Date();
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQualification, setEditingQualification] = useState(null);
  const [filterEnvironment, setFilterEnvironment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [qualificationToDelete, setQualificationToDelete] = useState(null);

  const environments = [
    { name: "simulation légère", color: "#3B82F6" },
    { name: "simulation lourde", color: "#10B981" },
    { name: "préexpo", color: "#F59E0B" }
  ];

  const teams = [...new Set(qualifications.map(q => q.team))];

  // Sauvegarde automatique des qualifications dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('qualifications', JSON.stringify(qualifications));
  }, [qualifications]);

  // Sauvegarde de la date sélectionnée dans localStorage
  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate.toISOString());
  }, [selectedDate]);

  // Génère une liste de jours ouvrés (lundi à vendredi) du mois
  const getWorkingDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const workingDays = [];
    const dayLabels = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi

      // Ne garder que lundi (1) à vendredi (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays.push(currentDate);
        dayLabels.push(currentDate);
      }
    }

    return { workingDays, dayLabels };
  };

  const renderQualificationBar = (qual, selectedDate) => {
    const { workingDays, dayLabels } = getWorkingDays(selectedDate);
    
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    // Adjust dates to be within the visible month
    const visibleStartDate = qual.startDate < monthStart ? monthStart : qual.startDate;
    const visibleEndDate = qual.endDate > monthEnd ? monthEnd : qual.endDate;
    
    // Calculate duration in working days only
    let durationDays = 0;
    let startOffsetDays = -1;
    let endOffsetDays = -1;

    for (let i = 0; i < workingDays.length; i++) {
      const wd = workingDays[i];
      if (wd >= visibleStartDate && wd <= visibleEndDate) {
        if (startOffsetDays === -1) startOffsetDays = i;
        endOffsetDays = i;
        durationDays++;
      }
    }

    if (durationDays === 0) return null;

    // Total number of working days in the month view
    const totalWorkingDays = workingDays.length;
    const left = (startOffsetDays / totalWorkingDays) * 100;
    const width = (durationDays / totalWorkingDays) * 100;

    return (
      <div
        className="absolute h-full cursor-pointer rounded-sm transition-all duration-200 hover:opacity-100"
        style={{
          backgroundColor: qual.color,
          left: `${left}%`,
          width: `${width}%`,
          border: qual.deployed ? '2px solid #F59E0B' : '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => {
          e.stopPropagation();
          setEditingQualification(qual);
        }}
        title={`${qual.name} (${qual.team})\n${qual.description || 'Aucune description'}\n${formatDate(qual.startDate)} - ${formatDate(qual.endDate)}`}
      >
        <div className="flex items-center justify-center h-full text-xs font-medium text-white truncate px-1">
          {qual.name} ({durationDays}j)
        </div>
      </div>
    );
  };

  const getQualificationsForEnvironment = (environmentName) => {
    return qualifications.filter(q => 
      q.environment === environmentName &&
      (filterEnvironment === "all" || q.environment === filterEnvironment) &&
      (filterTeam === "all" || q.team === filterTeam) &&
      (searchTerm === "" || 
        q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.team.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const exportData = (format) => {
    if (format === 'csv') {
      const headers = ['Nom', 'Équipe', 'Description', 'Début', 'Fin', 'Environnement', 'Déployé'];
      const csvContent = [
        headers.join(','),
        ...qualifications.map(q => 
          `${q.name},${q.team},"${q.description || ''}",${q.startDate.toISOString().split('T')[0]},${q.endDate.toISOString().split('T')[0]},${q.environment},${q.deployed}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qualifications.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleAddQualification = (newQualification) => {
    const qualification = {
      ...newQualification,
      id: Date.now(),
      color: environments.find(env => env.name === newQualification.environment)?.color || "#6B7280"
    };
    setQualifications([...qualifications, qualification]);
    setShowAddModal(false);
    setEditingQualification(null);
  };

  const handleEditQualification = (updatedQualification) => {
    setQualifications(qualifications.map(q => 
      q.id === updatedQualification.id ? { ...updatedQualification, color: environments.find(env => env.name === updatedQualification.environment)?.color || "#6B7280" } : q
    ));
    setEditingQualification(null);
  };

  const handleDeleteQualification = (id) => {
    setQualifications(prevQualifications => prevQualifications.filter(q => q.id !== id));
    setEditingQualification(null);
    setShowAddModal(false);
    setShowDeleteConfirm(false);
    setQualificationToDelete(null);
  };

  const today = new Date();
  const { workingDays, dayLabels } = getWorkingDays(selectedDate);

  // ✅ CORRECTION : Tableau des abréviations correctement ordonné selon getDay()
  const getDayAbbreviation = (date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Suivi des Qualifications Logicielles</h1>
              <p className="text-gray-600 mt-1">Visualisation interactive des versions en qualification</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => exportData('csv')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Exporter CSV
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ajouter une version
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par environnement</label>
              <select
                value={filterEnvironment}
                onChange={(e) => setFilterEnvironment(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              >
                <option value="all">Tous les environnements</option>
                {environments.map(env => (
                  <option key={env.name} value={env.name}>{env.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par équipe</label>
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              >
                <option value="all">Toutes les équipes</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mois courant</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  ←
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  →
                </button>
              </div>
            </div>
            
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-xs text-gray-600">Déployé</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex items-center p-4 bg-gray-50">
              <div className="w-64 flex-shrink-0">
                <h3 className="font-medium text-gray-900">Environnements</h3>
              </div>
              <div className="flex-1 min-w-0">
                {/* First row: Day abbreviations (Lun, Mar, etc.) — only for working days */}
                <div className="flex items-center justify-start space-x-1 mb-1">
                  {dayLabels.map((day, index) => (
                    <div 
                      key={`day-abbr-${index}`} 
                      className="w-12 h-4 flex items-center justify-center text-xs font-medium text-gray-500"
                    >
                      {getDayAbbreviation(day)}
                    </div>
                  ))}
                </div>
                
                {/* Second row: Day numbers — only for working days */}
                <div className="flex items-center justify-start space-x-1">
                  {workingDays.map((day, index) => (
                    <div 
                      key={index} 
                      className={`w-12 h-8 flex flex-col items-center justify-center text-xs font-medium border-r border-gray-100 ${
                        day.getTime() === today.getTime() ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                    >
                      <span className={`${day.getTime() === today.getTime() ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                        {day.getDate()}
                      </span>
                      {day.getTime() === today.getTime() && (
                        <div className="mt-1 w-1 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {environments.map(environment => {
              const envQualifications = getQualificationsForEnvironment(environment.name);
              const sortedQualifications = [...envQualifications].sort((a, b) => a.startDate - b.startDate);
              
              return (
                <div key={environment.name} className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: environment.color }}
                      ></div>
                      <span className="font-medium text-gray-900">{environment.name}</span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-start">
                      {/* Left column: Version names and dates - one row per qualification */}
                      <div className="w-64 flex-shrink-0 pr-4">
                        {sortedQualifications.length === 0 ? (
                          <div className="text-gray-400 text-sm italic">Aucune qualification</div>
                        ) : (
                          <div className="space-y-1">
                            {sortedQualifications.map((qual, index) => (
                              <div 
                                key={qual.id}
                                className="h-16 mb-1 flex flex-col cursor-pointer hover:bg-gray-50 rounded-md transition-colors border-l-4"
                                style={{ borderLeftColor: qual.color }}
                                onClick={() => setEditingQualification(qual)}
                              >
                                <div className="flex items-center justify-between w-full px-2 pt-1">
                                  <span className="text-sm font-medium" style={{ color: qual.color }}>
                                    {qual.name}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {qual.team}
                                  </span>
                                  {qual.deployed && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full ml-2">
                                      Déployé
                                    </span>
                                  )}
                                </div>
                                {qual.description && (
                                  <div className="flex items-start px-2 pb-1">
                                    <span className="text-xs text-gray-600 italic max-w-full break-words">
                                      {qual.description}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Right column: Timeline bars - one row per qualification, perfectly aligned */}
                      <div className="flex-1 min-w-0 relative">
                        {sortedQualifications.length === 0 ? (
                          <div className="text-gray-400 text-sm italic">Aucune qualification</div>
                        ) : (
                          <div className="space-y-1">
                            {sortedQualifications.map((qual, index) => (
                              <div key={qual.id} className="h-16 mb-1 relative">
                                {renderQualificationBar(qual, selectedDate)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Légende</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {environments.map(env => (
              <div key={env.name} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: env.color }}
                ></div>
                <span className="text-sm text-gray-700">{env.name}</span>
              </div>
            ))}
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-2 bg-yellow-400 border-2 border-yellow-600"></div>
              <span className="text-sm text-gray-700">Déployé</span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Comment lire cette visualisation :</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Chaque ligne représente un environnement de qualification</li>
              <li>• Les barres colorées montrent la durée des qualifications sur les jours ouvrés</li>
              <li>• Les noms des versions sont affichés à gauche avec leurs dates, équipes et descriptions</li>
              <li>• Les chevauchements sont affichés côte à côte pour une meilleure lisibilité</li>
              <li>• Les versions déployées ont un contour jaune</li>
              <li>• Cliquez sur une barre ou un nom pour modifier la qualification</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && qualificationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Confirmer la suppression</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir supprimer la version <strong>"{qualificationToDelete.name}"</strong> de l'équipe <strong>"{qualificationToDelete.team}"</strong> ?
              </p>
              {qualificationToDelete.description && (
                <p className="text-sm text-gray-600 mt-2">
                  <em>Description: "{qualificationToDelete.description}"</em>
                </p>
              )}
              <p className="text-sm text-red-600 mt-2">
                Cette action est irréversible.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setQualificationToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
              
              <button
                onClick={() => {
                  handleDeleteQualification(qualificationToDelete.id);
                  setShowDeleteConfirm(false);
                  setQualificationToDelete(null);
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingQualification) && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {editingQualification ? 'Modifier la version' : 'Ajouter une nouvelle version'}
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la version</label>
                <input
                  type="text"
                  defaultValue={editingQualification?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="version-name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Équipe</label>
                <input
                  type="text"
                  defaultValue={editingQualification?.team || ''}
                  placeholder="Ex: Équipe A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="team-name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnelle)</label>
                <textarea
                  rows="3"
                  defaultValue={editingQualification?.description || ''}
                  placeholder="Décrivez brièvement les changements apportés..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="description"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environnement</label>
                <select
                  defaultValue={editingQualification?.environment || environments[0].name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="environment"
                >
                  {environments.map(env => (
                    <option key={env.name} value={env.name}>{env.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    defaultValue={editingQualification ? editingQualification.startDate.toISOString().split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    id="start-date"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    defaultValue={editingQualification ? editingQualification.endDate.toISOString().split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    id="end-date"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="deployed"
                  defaultChecked={editingQualification?.deployed || false}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="deployed" className="ml-2 block text-sm text-gray-700">
                  Déployé en production
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingQualification(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
              
              <button
                onClick={() => {
                  const name = document.getElementById('version-name').value;
                  const team = document.getElementById('team-name').value;
                  const description = document.getElementById('description').value;
                  const environment = document.getElementById('environment').value;
                  const startDate = new Date(document.getElementById('start-date').value);
                  const endDate = new Date(document.getElementById('end-date').value);
                  const deployed = document.getElementById('deployed').checked;
                  
                  if (!name || !team || !startDate || !endDate || startDate > endDate) {
                    alert('Veuillez remplir correctement tous les champs et vérifier que la date de fin est après la date de début.');
                    return;
                  }
                  
                  if (editingQualification) {
                    handleEditQualification({
                      ...editingQualification,
                      name,
                      team,
                      description,
                      environment,
                      startDate,
                      endDate,
                      deployed
                    });
                  } else {
                    handleAddQualification({
                      name,
                      team,
                      description,
                      environment,
                      startDate,
                      endDate,
                      deployed
                    });
                  }
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {editingQualification ? 'Mettre à jour' : 'Ajouter'}
              </button>
              
              {editingQualification && (
                <button
                  onClick={() => {
                    setQualificationToDelete(editingQualification);
                    setShowDeleteConfirm(true);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;