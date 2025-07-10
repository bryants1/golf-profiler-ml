// AlgorithmManager.js - Database-driven ML algorithm management with A/B testing

export class AlgorithmManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.loadedAlgorithms = new Map();
    this.userAssignments = new Map();
    this.performanceCache = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔧 Initializing AlgorithmManager...');

      // Load all active algorithms
      await this.loadActiveAlgorithms();

      // Load active A/B tests
      await this.loadActiveABTests();

      this.initialized = true;
      console.log('✅ AlgorithmManager initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing AlgorithmManager:', error);
      this.initialized = false;
    }
  }

  // Load all active algorithms from database
  async loadActiveAlgorithms() {
    console.log('📥 Loading active algorithms from database...');

    try {
      // Load scoring algorithms
      const { data: scoringAlgs, error: scoringError } = await this.supabase
        .from('scoring_algorithms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (scoringError) throw scoringError;

      // Load question selection algorithms
      const { data: questionAlgs, error: questionError } = await this.supabase
        .from('question_selection_algorithms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (questionError) throw questionError;

      // Load ML model configurations
      const { data: modelConfigs, error: modelError } = await this.supabase
        .from('ml_model_versions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (modelError) throw modelError;

      // Store in memory for fast access
      this.loadedAlgorithms.set('scoring', scoringAlgs[0] || null);
      this.loadedAlgorithms.set('question_selection', questionAlgs[0] || null);
      this.loadedAlgorithms.set('similarity_calculator',
        modelConfigs.find(m => m.model_type === 'similarity_calculator') || null);

      console.log('✅ Loaded algorithms:', {
        scoring: scoringAlgs[0]?.version || 'none',
        questionSelection: questionAlgs[0]?.version || 'none',
        similarityCalculator: modelConfigs.find(m => m.model_type === 'similarity_calculator')?.version || 'none'
      });

    } catch (error) {
      console.error('❌ Error loading algorithms:', error);
      // Load fallback algorithms
      this.loadFallbackAlgorithms();
    }
  }

  // Load active A/B tests
  async loadActiveABTests() {
    try {
      const { data: tests, error } = await this.supabase
        .from('ab_tests')
        .select('*')
        .eq('status', 'running')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      if (error) throw error;

      this.activeABTests = tests || [];
      console.log(`📊 Loaded ${this.activeABTests.length} active A/B tests`);

    } catch (error) {
      console.error('❌ Error loading A/B tests:', error);
      this.activeABTests = [];
    }
  }

  // Get algorithm for user (handles A/B testing)
  async getAlgorithmForUser(sessionId, algorithmType, userFingerprint = null) {
    try {
      // Check if user already has assignment
      const existingAssignment = await this.getUserAssignment(sessionId, algorithmType);
      if (existingAssignment) {
        return await this.getAlgorithmByVersion(algorithmType, existingAssignment.algorithm_version);
      }

      // Check for active A/B tests for this algorithm type
      const activeTest = this.activeABTests.find(test =>
        test.algorithm_type === algorithmType && test.status === 'running'
      );

      if (activeTest) {
        return await this.assignUserToABTest(sessionId, activeTest, userFingerprint);
      }

      // No A/B test, return default active algorithm
      return this.loadedAlgorithms.get(algorithmType);

    } catch (error) {
      console.error('❌ Error getting algorithm for user:', error);
      return this.loadedAlgorithms.get(algorithmType);
    }
  }

  // Assign user to A/B test
  async assignUserToABTest(sessionId, abTest, userFingerprint = null) {
    try {
      // Determine which version to assign (A or B)
      const random = Math.random();
      const assignToB = random < abTest.traffic_split;
      const assignedVersion = assignToB ? abTest.version_b : abTest.version_a;

      console.log(`🧪 A/B Test Assignment: ${sessionId} → ${assignedVersion} (test: ${abTest.test_name})`);

      // Store assignment in database
      const { error } = await this.supabase
        .from('user_algorithm_assignments')
        .insert({
          session_id: sessionId,
          user_fingerprint: userFingerprint,
          algorithm_type: abTest.algorithm_type,
          algorithm_version: assignedVersion,
          ab_test_id: abTest.id,
          assigned_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error storing A/B assignment:', error);
      }

      // Return the assigned algorithm
      return await this.getAlgorithmByVersion(abTest.algorithm_type, assignedVersion);

    } catch (error) {
      console.error('❌ Error in A/B test assignment:', error);
      return this.loadedAlgorithms.get(abTest.algorithm_type);
    }
  }

  // Get user's existing algorithm assignment
  async getUserAssignment(sessionId, algorithmType) {
    try {
      const { data, error } = await this.supabase
        .from('user_algorithm_assignments')
        .select('*')
        .eq('session_id', sessionId)
        .eq('algorithm_type', algorithmType)
        .order('assigned_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;

    } catch (error) {
      console.error('❌ Error getting user assignment:', error);
      return null;
    }
  }

  // Get specific algorithm version
  async getAlgorithmByVersion(algorithmType, version) {
    try {
      let tableName;
      switch (algorithmType) {
        case 'scoring':
          tableName = 'scoring_algorithms';
          break;
        case 'question_selection':
          tableName = 'question_selection_algorithms';
          break;
        case 'similarity_calculator':
          tableName = 'ml_model_versions';
          break;
        default:
          throw new Error(`Unknown algorithm type: ${algorithmType}`);
      }

      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('version', version)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error(`❌ Error getting ${algorithmType} algorithm version ${version}:`, error);
      return this.loadedAlgorithms.get(algorithmType);
    }
  }

  // Track algorithm performance
  async trackPerformance(algorithmType, algorithmVersion, metricName, metricValue, sampleSize = 1) {
    try {
      const { error } = await this.supabase
        .from('algorithm_performance')
        .insert({
          algorithm_type: algorithmType,
          algorithm_version: algorithmVersion,
          metric_name: metricName,
          metric_value: metricValue,
          measurement_date: new Date().toISOString().split('T')[0],
          sample_size: sampleSize,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error tracking performance:', error);
      } else {
        console.log(`📊 Tracked ${metricName}: ${metricValue} for ${algorithmType} ${algorithmVersion}`);
      }

    } catch (error) {
      console.error('❌ Error in trackPerformance:', error);
    }
  }

  // Update A/B test results
  async updateABTestResults(testId, results) {
    try {
      const { error } = await this.supabase
        .from('ab_tests')
        .update({
          results: results,
          status: results.winner ? 'completed' : 'running'
        })
        .eq('id', testId);

      if (error) throw error;
      console.log(`📊 Updated A/B test ${testId} results`);

    } catch (error) {
      console.error('❌ Error updating A/B test results:', error);
    }
  }

  // Create new algorithm version
  async createAlgorithmVersion(algorithmType, algorithmData) {
    try {
      let tableName;
      switch (algorithmType) {
        case 'scoring':
          tableName = 'scoring_algorithms';
          break;
        case 'question_selection':
          tableName = 'question_selection_algorithms';
          break;
        case 'similarity_calculator':
          tableName = 'ml_model_versions';
          break;
        default:
          throw new Error(`Unknown algorithm type: ${algorithmType}`);
      }

      const { data, error } = await this.supabase
        .from(tableName)
        .insert(algorithmData)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Created new ${algorithmType} algorithm version: ${data.version}`);
      return data;

    } catch (error) {
      console.error(`❌ Error creating ${algorithmType} algorithm:`, error);
      return null;
    }
  }

  // Activate algorithm version
  async activateAlgorithm(algorithmType, version) {
    try {
      let tableName;
      switch (algorithmType) {
        case 'scoring':
          tableName = 'scoring_algorithms';
          break;
        case 'question_selection':
          tableName = 'question_selection_algorithms';
          break;
        case 'similarity_calculator':
          tableName = 'ml_model_versions';
          break;
        default:
          throw new Error(`Unknown algorithm type: ${algorithmType}`);
      }

      // Deactivate all current versions
      await this.supabase
        .from(tableName)
        .update({ is_active: false })
        .neq('version', '');

      // Activate the specified version
      const { error } = await this.supabase
        .from(tableName)
        .update({ is_active: true })
        .eq('version', version);

      if (error) throw error;

      // Reload algorithms
      await this.loadActiveAlgorithms();

      console.log(`✅ Activated ${algorithmType} algorithm version: ${version}`);
      return true;

    } catch (error) {
      console.error(`❌ Error activating ${algorithmType} algorithm:`, error);
      return false;
    }
  }

  // Create A/B test
  async createABTest(testConfig) {
    try {
      const { data, error } = await this.supabase
        .from('ab_tests')
        .insert({
          test_name: testConfig.testName,
          description: testConfig.description,
          algorithm_type: testConfig.algorithmType,
          version_a: testConfig.versionA,
          version_b: testConfig.versionB,
          traffic_split: testConfig.trafficSplit || 0.5,
          start_date: testConfig.startDate || new Date().toISOString(),
          end_date: testConfig.endDate,
          success_metrics: testConfig.successMetrics,
          status: 'running'
        })
        .select()
        .single();

      if (error) throw error;

      // Reload active tests
      await this.loadActiveABTests();

      console.log(`🧪 Created A/B test: ${data.test_name}`);
      return data;

    } catch (error) {
      console.error('❌ Error creating A/B test:', error);
      return null;
    }
  }

  // Get A/B test analytics
  async getABTestAnalytics(testId) {
    try {
      // Get test details
      const { data: test, error: testError } = await this.supabase
        .from('ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError) throw testError;

      // Get user assignments for this test
      const { data: assignments, error: assignmentError } = await this.supabase
        .from('user_algorithm_assignments')
        .select('*')
        .eq('ab_test_id', testId);

      if (assignmentError) throw assignmentError;

      // Get performance metrics for both versions
      const { data: performance, error: perfError } = await this.supabase
        .from('algorithm_performance')
        .select('*')
        .in('algorithm_version', [test.version_a, test.version_b])
        .eq('algorithm_type', test.algorithm_type);

      if (perfError) throw perfError;

      // Calculate analytics
      const analytics = this.calculateABTestAnalytics(test, assignments, performance);

      return analytics;

    } catch (error) {
      console.error('❌ Error getting A/B test analytics:', error);
      return null;
    }
  }

  // Calculate A/B test analytics
  calculateABTestAnalytics(test, assignments, performance) {
    const versionAAssignments = assignments.filter(a => a.algorithm_version === test.version_a);
    const versionBAssignments = assignments.filter(a => a.algorithm_version === test.version_b);

    const versionAPerf = performance.filter(p => p.algorithm_version === test.version_a);
    const versionBPerf = performance.filter(p => p.algorithm_version === test.version_b);

    const analytics = {
      testName: test.test_name,
      startDate: test.start_date,
      endDate: test.end_date,
      status: test.status,

      // Assignment stats
      totalAssignments: assignments.length,
      versionACount: versionAAssignments.length,
      versionBCount: versionBAssignments.length,
      actualSplit: versionBAssignments.length / assignments.length,
      expectedSplit: test.traffic_split,

      // Performance comparison
      versionAMetrics: this.aggregateMetrics(versionAPerf),
      versionBMetrics: this.aggregateMetrics(versionBPerf),

      // Statistical significance (simplified)
      sampleSizeAdequate: assignments.length >= 100,

      // Winner determination
      winner: this.determineWinner(versionAPerf, versionBPerf, test.success_metrics)
    };

    return analytics;
  }

  // Aggregate performance metrics
  aggregateMetrics(performanceData) {
    const metrics = {};

    performanceData.forEach(perf => {
      if (!metrics[perf.metric_name]) {
        metrics[perf.metric_name] = {
          values: [],
          average: 0,
          count: 0
        };
      }

      metrics[perf.metric_name].values.push(perf.metric_value);
      metrics[perf.metric_name].count += perf.sample_size || 1;
    });

    // Calculate averages
    Object.keys(metrics).forEach(metricName => {
      const metric = metrics[metricName];
      metric.average = metric.values.reduce((sum, val) => sum + val, 0) / metric.values.length;
    });

    return metrics;
  }

  // Determine A/B test winner
  determineWinner(versionAPerf, versionBPerf, successMetrics) {
    if (!successMetrics || versionAPerf.length === 0 || versionBPerf.length === 0) {
      return 'inconclusive';
    }

    // Simplified winner determination based on primary success metric
    const primaryMetric = Object.keys(successMetrics)[0];
    if (!primaryMetric) return 'inconclusive';

    const avgA = this.getAverageMetric(versionAPerf, primaryMetric);
    const avgB = this.getAverageMetric(versionBPerf, primaryMetric);

    if (avgA === null || avgB === null) return 'inconclusive';

    // Determine if higher is better based on metric name
    const higherIsBetter = primaryMetric.includes('accuracy') ||
                          primaryMetric.includes('satisfaction') ||
                          primaryMetric.includes('completion');

    if (higherIsBetter) {
      return avgB > avgA ? 'version_b' : avgA > avgB ? 'version_a' : 'inconclusive';
    } else {
      return avgA > avgB ? 'version_b' : avgB > avgA ? 'version_a' : 'inconclusive';
    }
  }

  // Get average metric value
  getAverageMetric(performanceData, metricName) {
    const metricValues = performanceData
      .filter(p => p.metric_name === metricName)
      .map(p => p.metric_value);

    if (metricValues.length === 0) return null;

    return metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length;
  }

  // Load fallback algorithms if database fails
  loadFallbackAlgorithms() {
    console.log('🔄 Loading fallback algorithms...');

    // Fallback scoring algorithm
    this.loadedAlgorithms.set('scoring', {
      version: 'fallback_v1.0.0',
      algorithm_name: 'weighted_average',
      dimension_weights: {
        skillLevel: 1.0,
        socialness: 1.0,
        traditionalism: 1.0,
        luxuryLevel: 1.0,
        competitiveness: 1.0,
        ageGeneration: 0.8,
        genderLean: 0.6,
        amenityImportance: 1.0,
        pace: 0.9
      },
      question_type_weights: {
        starter: 1.2,
        core: 1.5,
        skill_assessment: 1.8,
        social: 1.3,
        lifestyle: 1.0,
        knowledge: 1.1,
        personality: 1.4,
        preparation: 1.0
      },
      calculation_method: {
        method: 'weighted_average',
        scale_range: [0, 10],
        rounding: 1
      }
    });

    // Fallback question selection
    this.loadedAlgorithms.set('question_selection', {
      version: 'fallback_v1.0.0',
      algorithm_name: 'ml_enhanced',
      selection_logic: {
        min_questions: 5,
        max_questions: 7,
        diversity_weight: 0.3,
        accuracy_weight: 0.7,
        similarity_threshold: 0.6
      }
    });

    // Fallback similarity calculator
    this.loadedAlgorithms.set('similarity_calculator', {
      version: 'fallback_v1.0.0',
      model_type: 'similarity_calculator',
      config: {
        similarity_threshold: 0.6,
        max_similar_profiles: 10,
        dimension_weights: {
          skillLevel: 1.0,
          socialness: 1.0,
          traditionalism: 1.0,
          luxuryLevel: 1.0,
          competitiveness: 1.0
        }
      }
    });

    console.log('✅ Fallback algorithms loaded');
  }

  // Get current algorithm performance summary
  async getAlgorithmPerformanceSummary() {
    try {
      const { data, error } = await this.supabase
        .from('algorithm_performance')
        .select('*')
        .gte('measurement_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('measurement_date', { ascending: false });

      if (error) throw error;

      // Group by algorithm type and version
      const summary = {};
      data.forEach(perf => {
        const key = `${perf.algorithm_type}_${perf.algorithm_version}`;
        if (!summary[key]) {
          summary[key] = {
            algorithmType: perf.algorithm_type,
            version: perf.algorithm_version,
            metrics: {}
          };
        }

        if (!summary[key].metrics[perf.metric_name]) {
          summary[key].metrics[perf.metric_name] = [];
        }

        summary[key].metrics[perf.metric_name].push({
          value: perf.metric_value,
          date: perf.measurement_date,
          sampleSize: perf.sample_size
        });
      });

      return Object.values(summary);

    } catch (error) {
      console.error('❌ Error getting performance summary:', error);
      return [];
    }
  }
}
