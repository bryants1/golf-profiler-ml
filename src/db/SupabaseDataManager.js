// SupabaseDataManager.js - With debugging and fallback
import { createClient } from '@supabase/supabase-js';

export class SupabaseDataManager {
  constructor() {
    console.log('🚀 SupabaseDataManager constructor called!');
    console.log('🔍 DEBUGGING ENVIRONMENT VARIABLES:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- All env keys count:', Object.keys(process.env).length);
    console.log('- All env keys:', Object.keys(process.env));
    console.log('- REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL || 'MISSING');
    console.log('- REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? `SET (${process.env.REACT_APP_SUPABASE_ANON_KEY.length} chars)` : 'MISSING');
    console.log('- Env vars with SUPABASE:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    console.log('- Env vars with REACT_APP:', Object.keys(process.env).filter(k => k.includes('REACT_APP')));
    console.log('- Raw URL check:', JSON.stringify(process.env.REACT_APP_SUPABASE_URL));
    console.log('- Raw KEY check:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'EXISTS' : 'NULL/UNDEFINED');

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rzzuweonzvaavazhevdg.supabase.co';
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enV3ZW9uenZhYXZhemhldmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNTAxNDEsImV4cCI6MjA2NzcyNjE0MX0.TcEvZxJTQML9Nx-SXNzjFvFN5aJiV1Kftc3UeOpg-hg';

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ SUPABASE CREDENTIALS MISSING!');
      console.log('URL exists:', !!supabaseUrl);
      console.log('Key exists:', !!supabaseKey);

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

    this.supabase = {
      from: (table) => ({
        insert: async (data) => {
          console.log(`📝 FALLBACK: Would insert into ${table}`);
          return { data: null, error: null };
        },
        select: async (columns) => {
          console.log(`📊 FALLBACK: Would select from ${table}`);
          return { data: [], error: null };
        },
        update: async (data) => {
          console.log(`🔄 FALLBACK: Would update ${table}`);
          return { data: null, error: null };
        },
        eq: function(column, value) { return this; },
        single: function() { return this; },
        order: function() { return this; },
        limit: function() { return this; },
        gte: function() { return this; }
      })
    };
  }

  async addProfile(profileData) {
    if (!this.isConnected) {
      console.log('📝 FALLBACK: Profile would be saved:', profileData?.sessionId);
      return true;
    }

    try {
      const { error } = await this.supabase
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
      console.log('✅ Profile saved to Supabase database');
      return true;
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      return false;
    }
  }

  async getProfiles(filters = {}) {
    if (!this.isConnected) {
      console.log('📊 FALLBACK: Returning empty profiles array');
      return []; // Always return array
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

      console.log(`📊 Retrieved ${data?.length || 0} profiles from Supabase`);

      // CRITICAL: Always return an array
      if (!data) {
        console.warn('⚠️ Supabase returned null data, using empty array');
        return [];
      }

      if (!Array.isArray(data)) {
        console.warn('⚠️ Supabase returned non-array data, using empty array');
        return [];
      }

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
      return []; // ALWAYS return array on error
    }
  }

  async addFeedback(feedbackData) {
    if (!this.isConnected) {
      console.log('📝 FALLBACK: Feedback would be saved:', feedbackData?.accuracy);
      return true;
    }

    try {
      const { error } = await this.supabase
        .from('user_feedback')
        .insert([{
          session_id: feedbackData.sessionId,
          accuracy: feedbackData.accuracy,
          helpful: feedbackData.helpful,
          detailed_comments: feedbackData.detailedComments,
          response_time: feedbackData.responseTime
        }]);

      if (error) throw error;
      console.log('✅ Feedback saved to Supabase');
      return true;
    } catch (error) {
      console.error('❌ Error saving feedback:', error);
      return false;
    }
  }

  async getFeedbacks(sessionId = null) {
    if (!this.isConnected) return [];
    return [];
  }

  async updateQuestionEffectiveness(questionId, effectiveness) {
    if (!this.isConnected) {
      console.log(`🎯 FALLBACK: Would update question ${questionId} effectiveness: ${effectiveness}`);
      return true;
    }
    return true;
  }

  async getQuestionEffectiveness() {
    if (!this.isConnected) return {};
    return {};
  }

  async getMLMetrics() {
    return {
      totalProfiles: 0,
      totalFeedbacks: 0,
      profilesLastWeek: 0,
      averageAccuracy: 0,
      modelConfidence: this.isConnected ? 'Learning' : 'Fallback Mode'
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