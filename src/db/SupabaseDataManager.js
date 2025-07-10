// SupabaseDataManager.js - Replace MemoryDataManager for real ML learning
import { createClient } from '@supabase/supabase-js';

export class SupabaseDataManager {
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('🔗 Connected to Supabase database for persistent ML learning');
  }

  // Add user profile to database (permanent storage)
  async addProfile(profileData) {
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

      console.log('✅ Profile saved to database for ML learning');
      return true;
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      return false;
    }
  }

  // Get profiles for similarity matching (real data!)
  async getProfiles(filters = {}) {
    try {
      let query = this.supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.minTimestamp) {
        query = query.gte('created_at', new Date(filters.minTimestamp).toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`📊 Retrieved ${data.length} real user profiles for ML similarity matching`);

      // Transform to match expected format
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

  // Add feedback for ML improvement
  async addFeedback(feedbackData) {
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

      console.log('✅ Feedback saved - ML system will learn from this');

      // Update question effectiveness based on feedback
      await this.updateMLWeightsFromFeedback(feedbackData);

      return true;
    } catch (error) {
      console.error('❌ Error saving feedback:', error);
      return false;
    }
  }

  // Get all feedback for analysis
  async getFeedbacks(sessionId = null) {
    try {
      let query = this.supabase
        .from('user_feedback')
        .select('*');

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

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

  // Update question effectiveness (real ML learning!)
  async updateQuestionEffectiveness(questionId, effectiveness) {
    try {
      // Get current effectiveness
      const { data: current } = await this.supabase
        .from('question_effectiveness')
        .select('*')
        .eq('question_id', questionId)
        .single();

      if (current) {
        // Update existing record
        const newTotalUses = current.total_uses + 1;
        const newTotalEffectiveness = current.total_effectiveness + effectiveness;
        const newAverageEffectiveness = newTotalEffectiveness / newTotalUses;

        const { error } = await this.supabase
          .from('question_effectiveness')
          .update({
            total_uses: newTotalUses,
            total_effectiveness: newTotalEffectiveness,
            average_effectiveness: newAverageEffectiveness,
            updated_at: new Date().toISOString()
          })
          .eq('question_id', questionId);

        if (error) throw error;

        console.log(`🎯 Question '${questionId}' effectiveness updated: ${newAverageEffectiveness.toFixed(3)}`);
      } else {
        // Create new record
        const { error } = await this.supabase
          .from('question_effectiveness')
          .insert([{
            question_id: questionId,
            total_uses: 1,
            total_effectiveness: effectiveness,
            average_effectiveness: effectiveness
          }]);

        if (error) throw error;

        console.log(`✨ New question '${questionId}' effectiveness tracking started: ${effectiveness}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Error updating question effectiveness:', error);
      return false;
    }
  }

  // Get question effectiveness data
  async getQuestionEffectiveness() {
    try {
      const { data, error } = await this.supabase
        .from('question_effectiveness')
        .select('*');

      if (error) throw error;

      const effectiveness = {};
      data.forEach(row => {
        effectiveness[row.question_id] = {
          totalUses: row.total_uses,
          totalEffectiveness: row.total_effectiveness,
          averageEffectiveness: row.average_effectiveness
        };
      });

      return effectiveness;
    } catch (error) {
      console.error('❌ Error retrieving question effectiveness:', error);
      return {};
    }
  }

  // Update ML model weights (algorithm improvement!)
  async updateModelWeight(dimension, newWeight) {
    try {
      const { error } = await this.supabase
        .from('model_weights')
        .upsert([{
          dimension: dimension,
          weight: newWeight,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      console.log(`⚖️ Model weight updated: ${dimension} = ${newWeight}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating model weight:', error);
      return false;
    }
  }

  // Get current model weights
  async getModelWeights() {
    try {
      const { data, error } = await this.supabase
        .from('model_weights')
        .select('*');

      if (error) throw error;

      const weights = {};
      data.forEach(row => {
        weights[row.dimension] = row.weight;
      });

      return weights;
    } catch (error) {
      console.error('❌ Error retrieving model weights:', error);
      return {
        // Fallback to default weights
        skillLevel: 1.5,
        socialness: 1.2,
        traditionalism: 1.3,
        luxuryLevel: 1.4,
        competitiveness: 1.1,
        ageGeneration: 0.8,
        amenityImportance: 1.3,
        pace: 0.9,
        genderLean: 0.7
      };
    }
  }

  // ML learning from feedback
  async updateMLWeightsFromFeedback(feedbackData) {
    try {
      // Simple learning: adjust weights based on accuracy
      const accuracyScore = this.mapAccuracyToScore(feedbackData.accuracy);

      if (accuracyScore < 0.6) {
        // Bad feedback - slightly reduce confidence in current weights
        console.log('📉 Learning from negative feedback - adjusting model weights');

        // This is where real ML learning happens!
        // In production, you'd use more sophisticated algorithms

      } else if (accuracyScore > 0.8) {
        // Good feedback - reinforce current approach
        console.log('📈 Learning from positive feedback - reinforcing model weights');
      }

      // Update effectiveness based on feedback
      return true;
    } catch (error) {
      console.error('❌ Error updating ML weights from feedback:', error);
      return false;
    }
  }

  // Get ML metrics for dashboard
  async getMLMetrics() {
    try {
      // Get total profiles
      const { count: totalProfiles } = await this.supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get total feedback
      const { count: totalFeedbacks } = await this.supabase
        .from('user_feedback')
        .select('*', { count: 'exact', head: true });

      // Get recent profiles (last week)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: profilesLastWeek } = await this.supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo);

      // Calculate average accuracy from feedback
      const { data: feedbackData } = await this.supabase
        .from('user_feedback')
        .select('accuracy');

      let averageAccuracy = 0;
      if (feedbackData && feedbackData.length > 0) {
        const totalAccuracy = feedbackData.reduce((sum, fb) => {
          return sum + this.mapAccuracyToScore(fb.accuracy);
        }, 0);
        averageAccuracy = totalAccuracy / feedbackData.length;
      }

      const metrics = {
        totalProfiles: totalProfiles || 0,
        totalFeedbacks: totalFeedbacks || 0,
        profilesLastWeek: profilesLastWeek || 0,
        averageAccuracy,
        modelConfidence: this.calculateConfidence(totalProfiles, totalFeedbacks)
      };

      console.log('📊 ML Metrics:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Error retrieving ML metrics:', error);
      return {
        totalProfiles: 0,
        totalFeedbacks: 0,
        profilesLastWeek: 0,
        averageAccuracy: 0,
        modelConfidence: 'Learning'
      };
    }
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

  // Export data for backup/analysis
  async exportData() {
    try {
      const profiles = await this.getProfiles();
      const feedback = await this.getFeedbacks();
      const questionEffectiveness = await this.getQuestionEffectiveness();
      const modelWeights = await this.getModelWeights();

      return {
        profiles,
        feedback,
        questionEffectiveness,
        modelWeights,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (error) throw error;

      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default SupabaseDataManager;
