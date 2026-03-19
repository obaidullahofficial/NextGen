import React, { useState, useEffect } from 'react';

const ColorCustomizer = ({ onColorsChange, rooms = [], doors = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showRoomColors, setShowRoomColors] = useState(false);
  const [showDoorColors, setShowDoorColors] = useState(false);
  const [colors, setColors] = useState({
    walls: '#3C3534',
    windows: '#87CEEB',
    ground: '#90EE90',
    foundation: '#D3D3D3',
    doors: '#8B4513'
  });
  const [roomColors, setRoomColors] = useState({});
  const [doorColors, setDoorColors] = useState({});

  // Initialize room colors when rooms change
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      const initialRoomColors = {};
      rooms.forEach(room => {
        const roomIdString = String(room.id);
        if (room.id && !roomColors[roomIdString]) {
          initialRoomColors[roomIdString] = null; // null means use global color
        }
      });
      if (Object.keys(initialRoomColors).length > 0) {
        setRoomColors(prev => ({ ...prev, ...initialRoomColors }));
      }
    }
  }, [rooms]);
  
  // Initialize door colors when doors change
  useEffect(() => {
    if (doors && doors.length > 0) {
      const initialDoorColors = {};
      doors.forEach(door => {
        const doorIdString = String(door.id);
        if (door.id && !doorColors[doorIdString]) {
          initialDoorColors[doorIdString] = null; // null means use global color
        }
      });
      if (Object.keys(initialDoorColors).length > 0) {
        setDoorColors(prev => ({ ...prev, ...initialDoorColors }));
      }
    }
  }, [doors]);

  const handleColorChange = (element, color) => {
    const newColors = { ...colors, [element]: color };
    setColors(newColors);
    onColorsChange(newColors, roomColors, doorColors);
  };

  const handleRoomColorChange = (roomId, color) => {
    const roomIdString = String(roomId);
    const newRoomColors = { ...roomColors, [roomIdString]: color };
    setRoomColors(newRoomColors);
    onColorsChange(colors, newRoomColors, doorColors);
  };
  const handleDoorColorChange = (doorId, color) => {
    const doorIdString = String(doorId);
    const newDoorColors = { ...doorColors, [doorIdString]: color };
    setDoorColors(newDoorColors);
    onColorsChange(colors, roomColors, newDoorColors);
  };
  const resetRoomColor = (roomId) => {
    const roomIdString = String(roomId);
    const newRoomColors = { ...roomColors, [roomIdString]: null };
    setRoomColors(newRoomColors);
    onColorsChange(colors, newRoomColors, doorColors);
  };

  const resetDoorColor = (doorId) => {
    const doorIdString = String(doorId);
    const newDoorColors = { ...doorColors, [doorIdString]: null };
    setDoorColors(newDoorColors);
    onColorsChange(colors, roomColors, newDoorColors);
  };

  const resetAllRoomColors = () => {
    const clearedRoomColors = {};
    Object.keys(roomColors).forEach(roomId => {
      clearedRoomColors[roomId] = null;
    });
    setRoomColors(clearedRoomColors);
    onColorsChange(colors, clearedRoomColors, doorColors);
  };

  const resetAllDoorColors = () => {
    const clearedDoorColors = {};
    Object.keys(doorColors).forEach(doorId => {
      clearedDoorColors[doorId] = null;
    });
    setDoorColors(clearedDoorColors);
    onColorsChange(colors, roomColors, clearedDoorColors);
  };

  const resetColors = () => {
    const defaultColors = {
      walls: '#3C3534',
      windows: '#87CEEB',
      ground: '#90EE90',
      foundation: '#D3D3D3',
      doors: '#8B4513'
    };
    setColors(defaultColors);
    resetAllRoomColors();
    resetAllDoorColors();
    onColorsChange(defaultColors, {}, {});
  };

  const colorPresets = [
    {
      name: 'Default Dark',
      colors: { walls: '#3C3534', windows: '#87CEEB', ground: '#90EE90', foundation: '#D3D3D3', doors: '#8B4513' }
    },
    {
      name: 'Warm Beige',
      colors: { walls: '#F5DEB3', windows: '#4682B4', ground: '#98D8C8', foundation: '#C4A582', doors: '#8B6914' }
    },
    {
      name: 'Cool Gray',
      colors: { walls: '#E0E0E0', windows: '#5F9EA0', ground: '#8FBC8F', foundation: '#A9A9A9', doors: '#696969' }
    },
    {
      name: 'Elegant Cream',
      colors: { walls: '#FFF8DC', windows: '#6495ED', ground: '#7CFC00', foundation: '#DEB887', doors: '#D2691E' }
    },
    {
      name: 'Classic White',
      colors: { walls: '#FFFFFF', windows: '#ADD8E6', ground: '#32CD32', foundation: '#C0C0C0', doors: '#A0522D' }
    },
    {
      name: 'Soft Peach',
      colors: { walls: '#FFDAB9', windows: '#B0C4DE', ground: '#9ACD32', foundation: '#D2B48C', doors: '#CD853F' }
    }
  ];

  const getDoorDisplayName = (door) => {
    // Generate display name for door based on connected rooms
    if (door.connectedRooms && door.connectedRooms.length > 0) {
      return `Door (${door.connectedRooms.join(' â†” ')})`;
    }
    return `Door ${door.id}`;
  };

  const getRoomDisplayName = (room) => {
    return room.name || room.type || `Room ${room.id}`;
  };

  return (
    <div className="absolute top-4 left-4 z-10">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 font-semibold"
        title="Customize 3D Colors"
      >
        <span className="text-xl">ðŸŽ¨</span>
        <span>{isOpen ? 'Hide' : 'Customize Colors'}</span>
      </button>

      {/* Customization Panel */}
      {isOpen && (
        <div className="absolute top-16 left-0 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-5 w-80 max-h-125 overflow-y-auto">
          <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span className="text-2xl">ðŸŽ¨</span>
                <span>3D Color Customizer</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Personalize your floor plan appearance
              </p>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ðŸŒŸ Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {colorPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setColors(preset.colors);
                      resetAllRoomColors(); // Reset room colors when applying preset
                      resetAllDoorColors(); // Reset door colors when applying preset
                      onColorsChange(preset.colors, {}, {});
                    }}
                    className="px-3 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Color Controls */}
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ðŸŽ¯ Custom Colors
              </label>

              {/* Walls Color */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">ðŸ </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Walls</div>
                    <div className="text-xs text-slate-500">Interior walls color</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={colors.walls}
                  onChange={(e) => handleColorChange('walls', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-slate-300"
                  title="Choose wall color"
                />
              </div>

              {/* Windows Color */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">ðŸªŸ</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Windows</div>
                    <div className="text-xs text-slate-500">Window frames color</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={colors.windows}
                  onChange={(e) => handleColorChange('windows', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-slate-300"
                  title="Choose window color"
                />
              </div>

              {/* Ground Color */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">ðŸŒ¿</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Ground</div>
                    <div className="text-xs text-slate-500">Outdoor ground color</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={colors.ground}
                  onChange={(e) => handleColorChange('ground', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-slate-300"
                  title="Choose ground color"
                />
              </div>

              {/* Foundation Color */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">ðŸ—ï¸</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Foundation</div>
                    <div className="text-xs text-gray-500">Building base color</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={colors.foundation}
                  onChange={(e) => handleColorChange('foundation', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 hover:border-orange-500 transition-all"
                  title="Choose foundation color"
                />
              </div>

              {/* Doors Color */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">ðŸšª</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Doors</div>
                    <div className="text-xs text-gray-500">All doors color</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={colors.doors}
                  onChange={(e) => handleColorChange('doors', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 hover:border-orange-500 transition-all"
                  title="Choose doors color"
                />
              </div>
            </div>

            {/* Room-Specific Colors Section */}
            {rooms && rooms.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-gray-300">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">
                    ðŸ  Room-Specific Colors
                  </label>
                  <button
                    onClick={() => setShowRoomColors(!showRoomColors)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    {showRoomColors ? 'â–¼ Hide' : 'â–¶ Show'}
                  </button>
                </div>
                
                {showRoomColors && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {rooms.map((room) => {
                      const roomIdString = String(room.id);
                      return (
                        <div key={room.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-lg">ðŸšª</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-800 truncate">
                                {getRoomDisplayName(room)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {roomColors[roomIdString] ? 'Custom' : 'Using global'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <input
                              type="color"
                              value={roomColors[roomIdString] || colors.walls}
                              onChange={(e) => handleRoomColorChange(room.id, e.target.value)}
                              className="w-10 h-10 rounded cursor-pointer border border-gray-300 hover:border-orange-500 transition-all"
                              title={`Choose color for ${getRoomDisplayName(room)}`}
                            />
                            {roomColors[roomIdString] && (
                              <button
                                onClick={() => resetRoomColor(room.id)}
                                className="p-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Reset to global color"
                              >
                                âœ•
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {Object.values(roomColors).some(c => c !== null) && (
                      <button
                        onClick={resetAllRoomColors}
                        className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 py-1 rounded font-medium"
                      >
                        Reset All Room Colors
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Door-Specific Colors Section */}
            {doors && doors.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-gray-300">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">
                    ðŸšª Door-Specific Colors
                  </label>
                  <button
                    onClick={() => setShowDoorColors(!showDoorColors)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    {showDoorColors ? 'â–¼ Hide' : 'â–¶ Show'}
                  </button>
                </div>
                
                {showDoorColors && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {doors.map((door) => {
                      const doorIdString = String(door.id);
                      return (
                        <div key={door.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-lg">ðŸšª</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-800 truncate">
                                {getDoorDisplayName(door)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {doorColors[doorIdString] ? 'Custom' : 'Using global'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <input
                              type="color"
                              value={doorColors[doorIdString] || colors.doors}
                              onChange={(e) => handleDoorColorChange(door.id, e.target.value)}
                              className="w-10 h-10 rounded cursor-pointer border border-gray-300 hover:border-orange-500 transition-all"
                              title={`Choose color for ${getDoorDisplayName(door)}`}
                            />
                            {doorColors[doorIdString] && (
                              <button
                                onClick={() => resetDoorColor(door.id)}
                                className="p-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Reset to global color"
                              >
                                âœ•
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {Object.values(doorColors).some(c => c !== null) && (
                      <button
                        onClick={resetAllDoorColors}
                        className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 py-1 rounded font-medium"
                      >
                        Reset All Door Colors
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={resetColors}
              className="w-full bg-linear-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <span>ðŸ”„</span>
              <span>Reset to Default</span>
            </button>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-blue-800">
                <strong>ðŸ’¡ Tip:</strong> Changes apply instantly to your 3D view. 
                Experiment with different colors to find your perfect design!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorCustomizer;
