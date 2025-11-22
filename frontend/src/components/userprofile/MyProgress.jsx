import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiInbox } from 'react-icons/fi';

const MyProgress = () => {
  const [savedPlans, setSavedPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedPlans = () => {
      const plans = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('floorPlanLayout-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            const parts = key.split('-');
            plans.push({
              key,
              societyId: parts[1],
              plotId: parts[2],
              projectName: data.projectName || `Plan for Plot ${parts[2]}`,
              dateSaved: data.dateSaved || new Date().toLocaleDateString(),
              constraints: data.constraints,
            });
          } catch (error) {
            console.error(error);
          }
        }
      }
      setSavedPlans(plans);
    };
    fetchSavedPlans();
  }, []);

  const handleViewPlan = (plan) => {
    navigate(`/generate-floor-plan/${plan.societyId}/${plan.plotId}`, {
      state: { plotDimensions: { x: plan.constraints.plotX, y: plan.constraints.plotY } }
    });
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-extrabold mb-8 text-gray-800 tracking-tight">My Progress</h2>

        {savedPlans.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <table className="w-full text-sm text-gray-700">
              <thead className="bg-[#ED7600] text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Floor Plan Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Plot Number</th>
                  <th className="px-6 py-4 text-left font-semibold">Date Saved</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedPlans.map((plan, index) => (
                  <tr
                    key={plan.key}
                    className={`transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="px-6 py-4 font-medium">{plan.projectName}</td>
                    <td className="px-6 py-4">{plan.plotId}</td>
                    <td className="px-6 py-4">{plan.dateSaved}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewPlan(plan)}
                        className="bg-[#ED7600] text-white px-5 py-2 rounded-lg hover:bg-[#d46000] transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-8 bg-white rounded-xl shadow-md border-2 border-dashed">
            <FiInbox className="mx-auto text-5xl text-gray-400" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-800">No Plans... Yet!</h3>
            <p className="mt-2 text-gray-500">Your saved floor plans will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProgress;