// SupabaseDataManager.js - With comprehensive debugging
import { createClient } from '@supabase/supabase-js';

export class SupabaseDataManager {
  constructor() {
    // COMPREHENSIVE DEBUGGING - See what's actually available
    console.log('🔍 DEBUGGING ENVIRONMENT VARIABLES:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- All env keys:', Object.keys(process.env));
    console.log('- SUPABASE_URL (direct):', process.env.REACT_APP_SUPABASE_URL);
    console.log('- SUPABASE_KEY (direct):', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    console.log('- Env vars with SUPABASE:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    console.log('- Window object exists:', typeof window !== 'undefined');

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ SUPABASE CREDENTIALS MISSING!');
      console.log('URL exists:', !!supabaseUrl);
      console.log('Key exists:', !!supabaseKey);

      // Initialize fallback mode instead of crashing
      this.initializeFallbackMode();
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase client created successfully');
      this.isConnected = true;
    } catch (error) {
      console.error('❌ Error creating Supabase client:', error);
      this.initializeFallbackMode();
    }
  }

  initializeFallbackMode() {
    console.log('⚠️ Using FALLBACK MODE - no persistent storage');
    this.isConnected = false;

    // Create a mock Supabase client that doesn't crash
    this.supabase = {
      from: (table) => ({
        insert: async (data) => {
          console.log(`📝 FALLBACK: Would insert into ${table}:`, data);
          return { data: null, error: null };
        },
        select: async (columns) => {
          console.log(`📊 FALLBACK: Would select ${columns} from ${table}`);
          return { data: [], error: null };
        },
        update: async (data) => {
          console.log(`🔄 FALLBACK: Would update ${table}:`, data);
          return { data: null, error: null };
        },
        eq: function(column, value) {
          console.log(`🔍 FALLBACK: Would filter ${column} = ${value}`);
          return this;
        },
        single: function() {
          console.log(`🎯 FALLBACK: Would get single record`);
          return this;
        },
        order: function() { return this; },
        limit: function() { return this; },
        gte: function() { return this; }
      })
    };
  }

  // Override all methods to work with fallback
  async addProfile(profileData) {
    if (!this.isConnected) {
      console.log('📝 FALLBACK: Profile would be saved:', profileData.sessionId);
      return true;
    }

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert([{
          session_id: profileData.sessionId,
          scores: profileData.scores,
          answers: profileData.answers,
          recommendations: profileData.profile,
          total_questions: profileData.totalQuestions,
          question_sequence: profileData.questionSequence
        }]);

      if (error) throw error;
      console.log('✅ Profile saved to database');
      return true;
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      return false;
    }
  }

  async getProfiles(filters = {}) {
    if (!this.isConnected) {
      console.log('📊 FALLBACK: Would return empty profiles array');
      return [];
    }

    try {
      let query = this.supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.limit) query = query.limit(filters.limit);
      if (filters.minTimestamp) {
        query = query.gte('created_at', new Date(filters.minTimestamp).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log(`📊 Retrieved ${data.length} profiles from database`);

      return data.map(profile => ({
        id: profile.id,
        sessionId: profile.session_id,
        scores: profile.scores,
        answers: profile.answers,
        profile: profile.recommendations,
        totalQuestions: profile.total_questions,
        questionSequence: profile.question_sequence,
        timestamp: new Date(profile.created_at).getTime()
      }));
    } catch (error) {
      console.error('❌ Error retrieving profiles:', error);
      return [];
    }
  }

  async addFeedback(feedbackData) {
    if (!this.isConnected) {
      console.log('📝 FALLBACK: Feedback would be saved:', feedbackData.accuracy);
      return true;
    }

    try {
      const { data, error } = await this.supabase
        .from('user_feedback')
        .insert([{
          session_id: feedbackData.sessionId,
          accuracy: feedbackData.accuracy,
          helpful: feedbackData.helpful,
          detailed_comments: feedbackData.detailedComments,
          response_time: feedbackData.responseTime
        }]);

      if (error) throw error;
      console.log('✅ Feedback saved');
      return true;
    } catch (error) {
      console.error('❌ Error saving feedback:', error);
      return false;
    }
  }

  async getFeedbacks(sessionId = null) {
    if (!this.isConnected) return [];

    try {
      let query = this.supabase.from('user_feedback').select('*');
      if (sessionId) query = query.eq('session_id', sessionId);

      const { data, error } = await query;
      if (error) throw error;

      return data.map(feedback => ({
        id: feedback.id,
        sessionId: feedback.session_id,
        accuracy: feedback.accuracy,
        helpful: feedback.helpful,
        detailedComments: feedback.detailed_comments,
        responseTime: feedback.response_time,
        timestamp: new Date(feedback.created_at).getTime()
      }));
    } catch (error) {
      console.error('❌ Error retrieving feedback:', error);
      return [];
    }
  }

  async updateQuestionEffectiveness(questionId, effectiveness) {
    if (!this.isConnected) {
      console.log(`🎯 FALLBACK: Would update question ${questionId} effectiveness: ${effectiveness}`);
      return true;
    }

    // Implementation for connected mode...
    return true;
  }

  async getQuestionEffectiveness() {
    if (!this.isConnected) return {};

    // Implementation for connected mode...
    return {};
  }

  async getMLMetrics() {
    if (!this.isConnected) {
      return {
        totalProfiles: 0,
        totalFeedbacks: 0,
        profilesLastWeek: 0,
        averageAccuracy: 0,
        modelConfidence: 'Fallback Mode'
      };
    }

    // Implementation for connected mode...
    return {
      totalProfiles: 0,
      totalFeedbacks: 0,
      profilesLastWeek: 0,
      averageAccuracy: 0,
      modelConfidence: 'Learning'
    };
  }

  // Helper methods
  mapAccuracyToScore(accuracy) {
    const mapping = {
      'very_accurate': 1.0,
      'mostly_accurate': 0.8,
      'somewhat_accurate': 0.5,
      'not_accurate': 0.2
    };
    return mapping[accuracy] || 0.5;
  }

  calculateConfidence(profileCount, feedbackCount) {
    if (profileCount >= 100 && feedbackCount >= 50) return 'Very High';
    if (profileCount >= 50 && feedbackCount >= 20) return 'High';
    if (profileCount >= 20 && feedbackCount >= 10) return 'Medium';
    if (profileCount >= 5) return 'Learning';
    return 'Initializing';
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default SupabaseDataManager;
