// components/ComplianceManagement.jsx
import React, { useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

const ComplianceManagement = () => {
  // Initial compliance rules data
  const initialRules = [
    {
      id: 1,
      plotSize: "5 Marla",
      bedrooms: 2,
      bathrooms: 2,
      kitchen: 1,
      garage: 1,
      requirements: "Each bedroom must have attached bathroom"
    },
    {
      id: 2,
      plotSize: "7 Marla",
      bedrooms: 3,
      bathrooms: 3,
      kitchen: 1,
      garage: 1,
      requirements: "Each bedroom must have attached bathroom, kitchen must be adjacent to dining"
    },
    {
      id: 3,
      plotSize: "10 Marla",
      bedrooms: 4,
      bathrooms: 4,
      kitchen: 1,
      garage: 2,
      requirements: "Each bedroom must have attached bathroom, separate servant quarter allowed"
    }
  ];

  const [rules, setRules] = useState(initialRules);
  const [editingId, setEditingId] = useState(null);
  const [newRule, setNewRule] = useState({
    plotSize: "",
    bedrooms: "",
    bathrooms: "",
    kitchen: "",
    garage: "",
    requirements: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Room connections state
  const [roomConnections, setRoomConnections] = useState([]);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [selectedRuleForConnection, setSelectedRuleForConnection] = useState(null);
  const [newConnection, setNewConnection] = useState({
    room1: "",
    room1Number: "",
    room2: "",
    room2Number: ""
  });

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleSave = () => {
    setEditingId(null);
    // In a real app, you would save to backend here
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (id) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleInputChange = (id, field, value) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const handleNewRuleChange = (field, value) => {
    setNewRule({ ...newRule, [field]: value });
  };

  const handleAddRule = () => {
    const newId = rules.length > 0 ? Math.max(...rules.map(r => r.id)) + 1 : 1;
    setRules([...rules, { ...newRule, id: newId }]);
    setNewRule({
      plotSize: "",
      bedrooms: "",
      bathrooms: "",
      kitchen: "",
      garage: "",
      requirements: ""
    });
    setShowAddForm(false);
  };
// Room connection functions
  const getRoomTypesFromRule = (rule) => {
    const roomTypes = [];
    if (rule.bedrooms > 0) roomTypes.push("bedroom");
    if (rule.bathrooms > 0) roomTypes.push("bathroom");
    if (rule.kitchen > 0) roomTypes.push("kitchen");
    if (rule.garage > 0) roomTypes.push("garage");
    return roomTypes;
  };
  
  const getRoomNumbers = (roomType, rule) => {
    if (!rule) return [];
    let count = 0;
    
    switch(roomType) {
      case "bedroom":
        count = parseInt(rule.bedrooms) || 0;
        break;
      case "bathroom":
        count = parseInt(rule.bathrooms) || 0;
        break;
      case "kitchen":
        count = parseInt(rule.kitchen) || 0;
        break;
      case "garage":
        count = parseInt(rule.garage) || 0;
        break;
      default:
        count = 0;
    }
    
    return Array.from({ length: count }, (_, i) => i + 1);
  };

  const handleConnectionChange = (field, value) => {
    setNewConnection({ ...newConnection, [field]: value });
  };

  const handleAddConnection = () => {
    const connectionId = roomConnections.length + 1;
    const connection = {
      id: connectionId,
      ...newConnection,
      ruleId: selectedRuleForConnection
    };
    setRoomConnections([...roomConnections, connection]);
    setNewConnection({
      room1: "",
      room1Number: "",
      room2: "",
      room2Number: ""
    });
    setShowConnectionForm(false);
    setSelectedRuleForConnection(null);
  };

  const handleDeleteConnection = (connectionId) => {
    setRoomConnections(roomConnections.filter(conn => conn.id !== connectionId));
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e6e9f0] text-[#2F3D57]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#2F3D57]">
          Compliance Rules Management
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-[#2F3D57] text-white rounded-lg hover:bg-[#1E2A3B] flex items-center gap-2"
          >
            <FaPlus /> Add New Rule
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Compliance Rule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plot Size</label>
              <select
                value={newRule.plotSize}
                onChange={(e) => handleNewRuleChange("plotSize", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Plot Size</option>
                <option value="5 Marla">5 Marla</option>
                <option value="7 Marla">7 Marla</option>
                <option value="10 Marla">10 Marla</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bedrooms</label>
              <input
                type="number"
                value={newRule.bedrooms}
                onChange={(e) => handleNewRuleChange("bedrooms", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bathrooms</label>
              <input
                type="number"
                value={newRule.bathrooms}
                onChange={(e) => handleNewRuleChange("bathrooms", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kitchen</label>
              <input
                type="number"
                value={newRule.kitchen}
                onChange={(e) => handleNewRuleChange("kitchen", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Garage</label>
              <input
                type="number"
                value={newRule.garage}
                onChange={(e) => handleNewRuleChange("garage", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Special Requirements</label>
              <textarea
                value={newRule.requirements}
                onChange={(e) => handleNewRuleChange("requirements", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows="3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRule}
              className="px-4 py-2 bg-[#2F3D57] text-white rounded-lg hover:bg-[#1E2A3B]"
              disabled={!newRule.plotSize}
            >
              Save Rule
            </button>
          </div>
        </div>
      )}

      {showConnectionForm && selectedRuleForConnection && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Add Room Connection for {rules.find(r => r.id === selectedRuleForConnection)?.plotSize} Plot
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Room Type</label>
              <select
                value={newConnection.room1}
                onChange={(e) => handleConnectionChange("room1", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Room Type</option>
                {getRoomTypesFromRule(rules.find(r => r.id === selectedRuleForConnection)).map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">First Room Number</label>
              <select
                value={newConnection.room1Number}
                onChange={(e) => handleConnectionChange("room1Number", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                disabled={!newConnection.room1}
              >
                <option value="">Select Room Number</option>
                {newConnection.room1 && getRoomNumbers(newConnection.room1, rules.find(r => r.id === selectedRuleForConnection)).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Second Room Type</label>
              <select
                value={newConnection.room2}
                onChange={(e) => handleConnectionChange("room2", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Room Type</option>
                {getRoomTypesFromRule(rules.find(r => r.id === selectedRuleForConnection)).map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Second Room Number</label>
              <select
                value={newConnection.room2Number}
                onChange={(e) => handleConnectionChange("room2Number", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                disabled={!newConnection.room2}
              >
                <option value="">Select Room Number</option>
                {newConnection.room2 && getRoomNumbers(newConnection.room2, rules.find(r => r.id === selectedRuleForConnection)).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowConnectionForm(false);
                setSelectedRuleForConnection(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddConnection}
              className="px-4 py-2 bg-[#ED7600] text-white rounded-lg hover:bg-[#D56900]"
              disabled={!newConnection.room1 || !newConnection.room2 || !newConnection.room1Number || !newConnection.room2Number}
            >
              Add Connection
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">`
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#2F3D57] text-white">
              <tr>
                <th className="px-6 py-4 text-left">Plot Size</th>
                <th className="px-6 py-4 text-left">Bedrooms</th>
                <th className="px-6 py-4 text-left">Bathrooms</th>
                <th className="px-6 py-4 text-left">Kitchen</th>
                <th className="px-6 py-4 text-left">Garage</th>
                <th className="px-6 py-4 text-left">Requirements</th>
                <th className="px-6 py-4 text-left">Room Connections</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.length > 0 ? (
                rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">
                      {editingId === rule.id ? (
                        <select
                          value={rule.plotSize}
                          onChange={(e) => handleInputChange(rule.id, "plotSize", e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        >
                          <option value="5 Marla">5 Marla</option>
                          <option value="7 Marla">7 Marla</option>
                          <option value="10 Marla">10 Marla</option>
                        </select>
                      ) : (
                        rule.plotSize
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === rule.id ? (
                        <input
                          type="number"
                          value={rule.bedrooms}
                          onChange={(e) => handleInputChange(rule.id, "bedrooms", e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      ) : (
                        rule.bedrooms
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === rule.id ? (
                        <input
                          type="number"
                          value={rule.bathrooms}
                          onChange={(e) => handleInputChange(rule.id, "bathrooms", e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      ) : (
                        rule.bathrooms
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === rule.id ? (
                        <input
                          type="number"
                          value={rule.kitchen}
                          onChange={(e) => handleInputChange(rule.id, "kitchen", e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      ) : (
                        rule.kitchen
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === rule.id ? (
                        <input
                          type="number"
                          value={rule.garage}
                          onChange={(e) => handleInputChange(rule.id, "garage", e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      ) : (
                        rule.garage
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === rule.id ? (
                        <textarea
                          value={rule.requirements}
                          onChange={(e) => handleInputChange(rule.id, "requirements", e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                          rows="2"
                        />
                      ) : (
                        rule.requirements
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {roomConnections
                          .filter(connection => connection.ruleId === rule.id)
                          .map(connection => (
                            <div key={connection.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                              <span>
                                <span className="font-medium">{connection.room1} {connection.room1Number}</span>
                                <span className="mx-1 text-gray-400">↔</span>
                                <span className="font-medium">{connection.room2} {connection.room2Number}</span>
                              </span>
                              <button
                                onClick={() => handleDeleteConnection(connection.id)}
                                className="text-red-600 hover:text-red-800 ml-2"
                                title="Delete Connection"
                              >
                                <FaTrash size={10} />
                              </button>
                            </div>
                          ))
                        }
                        {roomConnections.filter(connection => connection.ruleId === rule.id).length === 0 && (
                          <span className="text-gray-400 text-xs">No connections</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === rule.id ? (
                          <>
                            <button
                              onClick={() => handleSave(rule.id)}
                              className="p-2 text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <FaSave />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-2 text-gray-600 hover:text-gray-800"
                              title="Cancel"
                            >
                              <FaTimes />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRuleForConnection(rule.id);
                                setShowConnectionForm(true);
                              }}
                              className="p-2 text-orange-600 hover:text-orange-800"
                              title="Add Room Connection"
                            >
                              <FaPlus />
                            </button>
                            <button
                              onClick={() => handleEdit(rule.id)}
                              className="p-2 text-blue-600 hover:text-blue-800"
                              title="Edit Rule"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(rule.id)}
                              className="p-2 text-red-600 hover:text-red-800"
                              title="Delete Rule"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No compliance rules found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceManagement;
