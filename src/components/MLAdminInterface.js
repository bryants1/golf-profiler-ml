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
  Target,
  Shield,
  Clock,
  Award,
  Brain,
  Monitor,
  Server,
  Code
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
            <Cpu className="mx-auto text-blue-600 mb-4 animate-pulse" size={48} />
            <p className="text-gray-700 font-medium text-lg">Loading ML Administration</p>
            <p className="text-gray-500 text-sm mt-2">Initializing system components...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if mlService is available
  if (!mlService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg border border-red-200">
            <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
            <p className="text-gray-700 font-medium text-lg">MLService Unavailable</p>
            <p className="text-gray-500 text-sm mt-2">Please ensure MLService is properly initialized</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Professional Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <div className="bg-white/10 rounded-lg p-2 mr-4">
                    <Settings className="w-6 h-6" />
                  </div>
                  ML Algorithm Administration
                </h1>
                <p className="text-gray-300 mt-2">Advanced machine learning system management and optimization</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center">
                  <Shield className="mr-2" size={16} />
                  <span className="text-sm font-medium">
                    {mlService.healthCheck ? 'System Active' : 'Basic Mode'}
                  </span>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <Server className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Navigation Tabs */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'algorithms', label: 'Current Algorithms', icon: Cpu, description: 'Active system algorithms' },
                { id: 'ab-tests', label: 'A/B Testing', icon: GitBranch, description: 'Performance experiments' },
                { id: 'performance', label: 'Performance Analytics', icon: BarChart3, description: 'System metrics' },
                { id: 'create', label: 'Create & Deploy', icon: Zap, description: 'New implementations' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-left border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-600 bg-white text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <tab.icon size={18} className="mr-3" />
                    <div>
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Current Algorithms Tab */}
            {activeTab === 'algorithms' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Active Algorithm Versions</h3>
                  <p className="text-gray-600">Currently deployed machine learning algorithms and their versions</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {Object.entries(algorithms).map(([type, version]) => (
                    <div key={type} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-blue-600 rounded-lg p-2 mr-3">
                            <Code className="text-white" size={18} />
                          </div>
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {type.replace(/([A-Z])/g, ' $1')}
                          </h4>
                        </div>
                        <div className="flex items-center text-green-600">
                          <CheckCircle size={18} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Active Version</p>
                          <p className="font-mono bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                            {version}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => activateAlgorithm(type, 'v1.1.0')}
                            className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
                          >
                            Update Version
                          </button>
                          <button className="text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition-colors font-medium">
                            View History
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* System Overview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                    <Monitor className="mr-2" size={20} />
                    System Overview & Statistics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="bg-blue-600 rounded-lg p-3 mb-2 inline-block">
                        <Users className="text-white" size={20} />
                      </div>
                      <p className="text-blue-600 text-sm font-medium">Total Profiles</p>
                      <p className="font-bold text-blue-900 text-lg">
                        {performance.length > 0 ? performance[0].metrics.user_satisfaction.count : 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-green-600 rounded-lg p-3 mb-2 inline-block">
                        <Activity className="text-white" size={20} />
                      </div>
                      <p className="text-green-600 text-sm font-medium">Active Tests</p>
                      <p className="font-bold text-green-900 text-lg">
                        {abTests.filter(t => t.status === 'running').length}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-purple-600 rounded-lg p-3 mb-2 inline-block">
                        <Target className="text-white" size={20} />
                      </div>
                      <p className="text-purple-600 text-sm font-medium">Model Accuracy</p>
                      <p className="font-bold text-purple-900 text-lg">
                        {performance.length > 0 ? (performance[0].metrics.accuracy.average * 100).toFixed(1) + '%' : '82.0%'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-orange-600 rounded-lg p-3 mb-2 inline-block">
                        <Award className="text-white" size={20} />
                      </div>
                      <p className="text-orange-600 text-sm font-medium">User Satisfaction</p>
                      <p className="font-bold text-orange-900 text-lg">
                        {performance.length > 0 ? (performance[0].metrics.user_satisfaction.average * 100).toFixed(1) + '%' : '84.2%'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* A/B Tests Tab */}
            {activeTab === 'ab-tests' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">A/B Test Management</h3>
                  <p className="text-gray-600">Active and completed algorithm performance experiments</p>
                </div>

                <div className="space-y-4">
                  {abTests.map(test => (
                    <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-purple-600 rounded-lg p-2 mr-4">
                            <GitBranch className="text-white" size={18} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{test.test_name}</h4>
                            <p className="text-sm text-gray-600">
                              {test.algorithm_type} • Started {test.start_date} • {test.participants} participants
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            test.status === 'running'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {test.status.toUpperCase()}
                          </span>
                          {test.winner && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                              Winner: {test.winner}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-gray-600 text-sm font-medium">Version A (Control)</p>
                          <p className="font-mono bg-white px-2 py-1 rounded text-sm mt-1">{test.version_a}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-gray-600 text-sm font-medium">Version B (Test)</p>
                          <p className="font-mono bg-white px-2 py-1 rounded text-sm mt-1">{test.version_b}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-gray-600 text-sm font-medium">Traffic Split</p>
                          <p className="font-semibold text-gray-900 mt-1">{(test.traffic_split * 100).toFixed(0)}% to B</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-gray-600 text-sm font-medium">Participants</p>
                          <p className="font-semibold text-gray-900 mt-1">{test.participants}</p>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium">
                          View Detailed Results
                        </button>
                        {test.status === 'running' && (
                          <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm font-medium">
                            Stop Test
                          </button>
                        )}
                        {test.winner && test.status === 'completed' && (
                          <button
                            onClick={() => activateAlgorithm(test.algorithm_type, test.winner === 'version_b' ? test.version_b : test.version_a)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Deploy Winner
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
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Algorithm Performance Metrics</h3>
                  <p className="text-gray-600">Detailed performance analytics for all deployed algorithms</p>
                </div>

                <div className="space-y-6">
                  {performance.map((perf, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="bg-green-600 rounded-lg p-2 mr-4">
                            <BarChart3 className="text-white" size={18} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {perf.algorithmType} Algorithm
                            </h4>
                            <p className="text-sm text-gray-600">Version {perf.version}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-green-600">
                          <TrendingUp size={20} className="mr-2" />
                          <span className="text-sm font-medium">Performing Well</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        {Object.entries(perf.metrics).map(([metric, data]) => (
                          <div key={metric} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                              <Target className="text-blue-600 mr-2" size={16} />
                              <h5 className="font-medium text-gray-800 capitalize">
                                {metric.replace('_', ' ')}
                              </h5>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {(data.average * 100).toFixed(1)}%
                            </div>
                            <p className="text-xs text-gray-500">
                              Based on {data.count} data points
                            </p>
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
              <div className="space-y-10">
                {/* Create Algorithm Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                    <div className="bg-blue-600 rounded-lg p-2 mr-3">
                      <Cpu className="text-white" size={20} />
                    </div>
                    Create New Algorithm Version
                  </h3>
                  <p className="text-gray-600 mb-6">Deploy a new algorithm version for testing and evaluation</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm Type</label>
                      <select
                        value={newAlgorithm.type}
                        onChange={(e) => setNewAlgorithm({...newAlgorithm, type: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="scoring">Scoring Algorithm</option>
                        <option value="question_selection">Question Selection</option>
                        <option value="similarity_calculator">Similarity Calculator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Version Number</label>
                      <input
                        type="text"
                        value={newAlgorithm.version}
                        onChange={(e) => setNewAlgorithm({...newAlgorithm, version: e.target.value})}
                        placeholder="v1.2.0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm Name</label>
                      <input
                        type="text"
                        value={newAlgorithm.name}
                        onChange={(e) => setNewAlgorithm({...newAlgorithm, name: e.target.value})}
                        placeholder="enhanced_weighted_average"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Implementation Notes</label>
                      <input
                        type="text"
                        value={newAlgorithm.notes}
                        onChange={(e) => setNewAlgorithm({...newAlgorithm, notes: e.target.value})}
                        placeholder="Enhanced scoring with improved dimension weights"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={createNewAlgorithm}
                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                  >
                    <Code className="mr-2" size={18} />
                    Deploy Algorithm
                  </button>
                </div>

                {/* Create A/B Test Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                    <div className="bg-purple-600 rounded-lg p-2 mr-3">
                      <GitBranch className="text-white" size={20} />
                    </div>
                    Create New A/B Test
                  </h3>
                  <p className="text-gray-600 mb-6">Set up a controlled experiment to compare algorithm performance</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Name</label>
                      <input
                        type="text"
                        value={newABTest.testName}
                        onChange={(e) => setNewABTest({...newABTest, testName: e.target.value})}
                        placeholder="Scoring Algorithm v1.2 Performance Test"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm Type</label>
                      <select
                        value={newABTest.algorithmType}
                        onChange={(e) => setNewABTest({...newABTest, algorithmType: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="scoring">Scoring Algorithm</option>
                        <option value="question_selection">Question Selection</option>
                        <option value="similarity_calculator">Similarity Calculator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Control Version (A)</label>
                      <input
                        type="text"
                        value={newABTest.versionA}
                        onChange={(e) => setNewABTest({...newABTest, versionA: e.target.value})}
                        placeholder="v1.0.0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Version (B)</label>
                      <input
                        type="text"
                        value={newABTest.versionB}
                        onChange={(e) => setNewABTest({...newABTest, versionB: e.target.value})}
                        placeholder="v1.2.0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Traffic Split to B (%)</label>
                      <input
                        type="number"
                        min="10"
                        max="90"
                        value={newABTest.trafficSplit * 100}
                        onChange={(e) => setNewABTest({...newABTest, trafficSplit: e.target.value / 100})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={newABTest.endDate}
                        onChange={(e) => setNewABTest({...newABTest, endDate: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Description</label>
                    <textarea
                      value={newABTest.description}
                      onChange={(e) => setNewABTest({...newABTest, description: e.target.value})}
                      placeholder="Testing improved scoring algorithm with enhanced dimension weights for better user personalization..."
                      rows="3"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <button
                    onClick={createABTest}
                    className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center"
                  >
                    <GitBranch className="mr-2" size={18} />
                    Launch A/B Test
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLAdminInterface;
