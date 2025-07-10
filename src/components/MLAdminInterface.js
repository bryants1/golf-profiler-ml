import React, { useState, useEffect } from 'react';
import {
  Settings,
  Activity,
  GitBranch,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Database,
  Cpu,
  Target
} from 'lucide-react';

const MLAdminInterface = ({ mlService }) => {
  const [activeTab, setActiveTab] = useState('algorithms');
  const [algorithms, setAlgorithms] = useState({
    scoring: null,
    questionSelection: null,
    similarityCalculator: null
  });
  const [abTests, setABTests] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Algorithm Form State
  const [newAlgorithm, setNewAlgorithm] = useState({
    type: 'scoring',
    version: '',
    name: '',
    config: {},
    notes: ''
  });

  // New A/B Test Form State
  const [newABTest, setNewABTest] = useState({
    testName: '',
    description: '',
    algorithmType: 'scoring',
    versionA: '',
    versionB: '',
    trafficSplit: 0.5,
    endDate: '',
    successMetrics: {}
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      // Check if mlService is available and initialized
      if (!mlService || !mlService.getMLStatistics) {
        console.error('MLService not available or not properly initialized');
        setLoading(false);
        return;
      }

      // Load current algorithms
      const mlStats = await mlService.getMLStatistics();
      console.log('📊 ML Stats loaded:', mlStats);

      // Set algorithm versions from ML stats
      setAlgorithms({
        scoring: mlStats.model?.algorithmVersions?.scoring || 'v1.0.0',
        questionSelection: mlStats.model?.algorithmVersions?.questionSelection || 'v1.0.0',
        similarityCalculator: mlStats.model?.algorithmVersions?.similarityCalculator || 'v1.0.0'
      });

      // Load A/B test data (mock for now since we're in memory mode)
      const mockABTests = [
        {
          id: 1,
          test_name: 'Scoring Algorithm V2 Test',
          algorithm_type: 'scoring',
          version_a: 'v1.0.0',
          version_b: 'v1.1.0',
          status: 'running',
          traffic_split: 0.5,
          start_date: '2024-01-15',
          participants: 245,
          winner: null
        },
        {
          id: 2,
          test_name: 'Question Selection Enhancement',
          algorithm_type: 'question_selection',
          version_a: 'v1.0.0',
          version_b: 'v1.2.0',
          status: 'completed',
          traffic_split: 0.3,
          start_date: '2024-01-10',
          participants: 189,
          winner: 'version_b'
        }
      ];
      setABTests(mockABTests);

      // Load performance data (using actual ML stats)
      const mockPerformance = [
        {
          algorithmType: 'scoring',
          version: algorithms.scoring || 'v1.0.0',
          metrics: {
            user_satisfaction: {
              average: mlStats.feedback?.averageRating || 0.82,
              count: mlStats.data?.totalProfiles || 150
            },
            accuracy: {
              average: mlStats.performance?.averageAccuracy || 0.78,
              count: mlStats.data?.totalProfiles || 150
            }
          }
        },
        {
          algorithmType: 'questionSelection',
          version: algorithms.questionSelection || 'v1.0.0',
          metrics: {
            user_satisfaction: { average: 0.85, count: 95 },
            accuracy: { average: 0.81, count: 95 }
          }
        }
      ];
      setPerformance(mockPerformance);

    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewAlgorithm = async () => {
    try {
      // Validate required fields
      if (!newAlgorithm.version || !newAlgorithm.name) {
        alert('Please fill in version and name fields');
        return;
      }

      const algorithmData = {
        version: newAlgorithm.version,
        algorithm_name: newAlgorithm.name,
        notes: newAlgorithm.notes,
        created_at: new Date().toISOString(),
        is_active: false
      };

      // Add type-specific configuration
      if (newAlgorithm.type === 'scoring') {
        algorithmData.dimension_weights = {
          skillLevel: 1.0,
          socialness: 1.0,
          traditionalism: 1.0,
          luxuryLevel: 1.0,
          competitiveness: 1.0,
          ageGeneration: 0.8,
          amenityImportance: 1.0,
          pace: 0.9
        };
        algorithmData.question_type_weights = {
          starter: 1.2,
          core: 1.5,
          skill_assessment: 1.8,
          social: 1.3,
          lifestyle: 1.0,
          knowledge: 1.1,
          personality: 1.4,
          preparation: 1.0
        };
        algorithmData.calculation_method = {
          method: 'weighted_average',
          scale_range: [0, 10],
          rounding: 1
        };
      }

      // Call the MLService method (which is now a mock)
      const result = await mlService.createNewScoringAlgorithm(algorithmData);

      if (result && result.success) {
        alert(`New ${newAlgorithm.type} algorithm created: ${newAlgorithm.version}`);
        setNewAlgorithm({ type: 'scoring', version: '', name: '', config: {}, notes: '' });
        loadAdminData();
      } else {
        alert('Error creating algorithm');
      }
    } catch (error) {
      console.error('Error creating algorithm:', error);
      alert('Error creating algorithm: ' + error.message);
    }
  };

  const createABTest = async () => {
    try {
      // Validate required fields
      if (!newABTest.testName || !newABTest.versionA || !newABTest.versionB) {
        alert('Please fill in test name and both version fields');
        return;
      }

      const testConfig = {
        testName: newABTest.testName,
        description: newABTest.description,
        algorithmType: newABTest.algorithmType,
        versionA: newABTest.versionA,
        versionB: newABTest.versionB,
        trafficSplit: newABTest.trafficSplit,
        endDate: newABTest.endDate,
        successMetrics: {
          user_satisfaction: { target: 0.85, weight: 0.6 },
          accuracy: { target: 0.80, weight: 0.4 }
        }
      };

      // Call the MLService method (which is now a mock)
      const result = await mlService.createABTest(testConfig);

      if (result && result.success) {
        alert(`A/B Test created: ${newABTest.testName}`);
        setNewABTest({
          testName: '',
          description: '',
          algorithmType: 'scoring',
          versionA: '',
          versionB: '',
          trafficSplit: 0.5,
          endDate: '',
          successMetrics: {}
        });
        loadAdminData();
      } else {
        alert('Error creating A/B test');
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
      alert('Error creating A/B test: ' + error.message);
    }
  };

  const activateAlgorithm = async (algorithmType, version) => {
    try {
      const success = await mlService.activateAlgorithm(algorithmType, version);
      if (success) {
        alert(`Activated ${algorithmType} algorithm: ${version}`);
        loadAdminData();
      } else {
        alert('Error activating algorithm');
      }
    } catch (error) {
      console.error('Error activating algorithm:', error);
      alert('Error activating algorithm: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Cpu className="mx-auto text-blue-600 mb-4" size={48} />
          <p className="text-gray-600">Loading ML Admin Interface...</p>
        </div>
      </div>
    );
  }

  // Check if mlService is available
  if (!mlService) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <p className="text-gray-600">MLService not available</p>
          <p className="text-sm text-gray-500">Please ensure MLService is properly initialized</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Settings className="mr-3 text-blue-600" size={28} />
                ML Algorithm Administration
              </h1>
              <p className="text-gray-600 mt-1">Manage algorithms, A/B tests, and performance monitoring</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-green-800 text-sm font-medium">
                  {mlService.healthCheck ? 'System Active' : 'Basic Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'algorithms', label: 'Current Algorithms', icon: Cpu },
            { id: 'ab-tests', label: 'A/B Tests', icon: GitBranch },
            { id: 'performance', label: 'Performance', icon: BarChart3 },
            { id: 'create', label: 'Create New', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Current Algorithms Tab */}
          {activeTab === 'algorithms' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Algorithm Versions</h3>

              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(algorithms).map(([type, version]) => (
                  <div key={type} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800 capitalize">{type.replace(/([A-Z])/g, ' $1')}</h4>
                      <CheckCircle className="text-green-500" size={20} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Version: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{version}</span></p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => activateAlgorithm(type, 'v1.1.0')}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Update
                        </button>
                        <button className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                          History
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">System Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600">Total Profiles</p>
                    <p className="font-bold text-blue-800">
                      {performance.length > 0 ? performance[0].metrics.user_satisfaction.count : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600">Active A/B Tests</p>
                    <p className="font-bold text-blue-800">{abTests.filter(t => t.status === 'running').length}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Model Confidence</p>
                    <p className="font-bold text-blue-800">
                      {performance.length > 0 ? performance[0].metrics.accuracy.average.toFixed(2) : '0.82'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600">Avg Satisfaction</p>
                    <p className="font-bold text-blue-800">
                      {performance.length > 0 ? (performance[0].metrics.user_satisfaction.average * 100).toFixed(1) + '%' : '84.2%'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* A/B Tests Tab */}
          {activeTab === 'ab-tests' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">A/B Test Management</h3>

              <div className="space-y-4">
                {abTests.map(test => (
                  <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-800">{test.test_name}</h4>
                        <p className="text-sm text-gray-600">{test.algorithm_type} • Started {test.start_date}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.status === 'running'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {test.status}
                        </span>
                        {test.winner && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Winner: {test.winner}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Version A</p>
                        <p className="font-mono bg-gray-100 px-2 py-1 rounded">{test.version_a}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Version B</p>
                        <p className="font-mono bg-gray-100 px-2 py-1 rounded">{test.version_b}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Traffic Split</p>
                        <p className="font-medium">{(test.traffic_split * 100).toFixed(0)}% to B</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Participants</p>
                        <p className="font-medium">{test.participants}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex space-x-2">
                      <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                        View Results
                      </button>
                      {test.status === 'running' && (
                        <button className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                          Stop Test
                        </button>
                      )}
                      {test.winner && test.status === 'completed' && (
                        <button
                          onClick={() => activateAlgorithm(test.algorithm_type, test.winner === 'version_b' ? test.version_b : test.version_a)}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Activate Winner
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Algorithm Performance Metrics</h3>

              <div className="space-y-4">
                {performance.map((perf, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">
                        {perf.algorithmType} - {perf.version}
                      </h4>
                      <TrendingUp className="text-green-500" size={20} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(perf.metrics).map(([metric, data]) => (
                        <div key={metric} className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600 capitalize">{metric.replace('_', ' ')}</p>
                          <p className="text-lg font-bold text-gray-800">
                            {(data.average * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">{data.count} samples</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create New Tab */}
          {activeTab === 'create' && (
            <div className="space-y-8">
              {/* Create Algorithm Section */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Cpu className="mr-2" size={20} />
                  Create New Algorithm Version
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm Type</label>
                    <select
                      value={newAlgorithm.type}
                      onChange={(e) => setNewAlgorithm({...newAlgorithm, type: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="scoring">Scoring Algorithm</option>
                      <option value="question_selection">Question Selection</option>
                      <option value="similarity_calculator">Similarity Calculator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                    <input
                      type="text"
                      value={newAlgorithm.version}
                      onChange={(e) => setNewAlgorithm({...newAlgorithm, version: e.target.value})}
                      placeholder="v1.2.0"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm Name</label>
                    <input
                      type="text"
                      value={newAlgorithm.name}
                      onChange={(e) => setNewAlgorithm({...newAlgorithm, name: e.target.value})}
                      placeholder="enhanced_weighted_average"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input
                      type="text"
                      value={newAlgorithm.notes}
                      onChange={(e) => setNewAlgorithm({...newAlgorithm, notes: e.target.value})}
                      placeholder="Enhanced scoring with improved weights"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={createNewAlgorithm}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Create Algorithm
                </button>
              </div>

              {/* Create A/B Test Section */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <GitBranch className="mr-2" size={20} />
                  Create New A/B Test
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                    <input
                      type="text"
                      value={newABTest.testName}
                      onChange={(e) => setNewABTest({...newABTest, testName: e.target.value})}
                      placeholder="Scoring Algorithm v1.2 Test"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm Type</label>
                    <select
                      value={newABTest.algorithmType}
                      onChange={(e) => setNewABTest({...newABTest, algorithmType: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="scoring">Scoring Algorithm</option>
                      <option value="question_selection">Question Selection</option>
                      <option value="similarity_calculator">Similarity Calculator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Version A (Control)</label>
                    <input
                      type="text"
                      value={newABTest.versionA}
                      onChange={(e) => setNewABTest({...newABTest, versionA: e.target.value})}
                      placeholder="v1.0.0"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Version B (Test)</label>
                    <input
                      type="text"
                      value={newABTest.versionB}
                      onChange={(e) => setNewABTest({...newABTest, versionB: e.target.value})}
                      placeholder="v1.2.0"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Traffic Split to B (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={newABTest.trafficSplit * 100}
                      onChange={(e) => setNewABTest({...newABTest, trafficSplit: e.target.value / 100})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={newABTest.endDate}
                      onChange={(e) => setNewABTest({...newABTest, endDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newABTest.description}
                    onChange={(e) => setNewABTest({...newABTest, description: e.target.value})}
                    placeholder="Testing improved scoring algorithm with enhanced dimension weights..."
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  onClick={createABTest}
                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                >
                  Create A/B Test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLAdminInterface;
