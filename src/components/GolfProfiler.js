import React, { useState, useEffect } from 'react';
import { ChevronRight, RotateCcw, MapPin, Star, Users, Clock, Brain, TrendingUp, Edit3, Settings, BarChart3, Lightbulb, Target, Zap, Award, Sparkles, ChevronDown } from 'lucide-react';

// Mock ML Service for demo
const mockMLService = {
  selectNextQuestion: (answers, scores, questionBank, currentCount) => {
    const unanswered = questionBank.filter(q => !answers[q.id]);
    return unanswered[Math.floor(Math.random() * unanswered.length)];
  },
  generateProfile: (answers, scores) => ({
    skillLevel: { label: getSkillLabel(scores.skillLevel) },
    personality: { primary: getPersonalityType(scores) },
    preferences: { core: getPreferences(scores) },
    recommendations: getRecommendations(scores),
    demographics: getDemographics(scores),
    mlEnhanced: true,
    mlInsights: { personalityPatterns: { insights: "Enhanced analysis based on response patterns" } }
  }),
  getMLStatistics: () => ({
    data: { totalProfiles: 1247 },
    feedback: { averageRating: 0.87, totalFeedback: 892 },
    model: { confidence: 0.91, algorithmVersions: { scoring: 'v2.1.0' } }
  }),
  collectFeedback: (sessionId, feedback) => Promise.resolve(true),
  getUserSimilarityInsights: () => ({
    similarUsers: 89,
    averageSimilarity: 0.84,
    topMatches: [{ similarity: 0.93 }],
    userPercentiles: { skillLevel: 72 }
  }),
  getRecommendationInsights: () => ({
    confidence: "High",
    personalizationLevel: "Advanced",
    improvementSuggestions: ["More specific amenity preferences", "Regional course style data"]
  })
};

// Helper functions
function getSkillLabel(skillScore) {
  if (skillScore <= 2) return "New to Golf";
  if (skillScore <= 4) return "Recreational Player";
  if (skillScore <= 6) return "Regular Golfer";
  if (skillScore <= 8) return "Serious Player";
  return "Advanced Golfer";
}

function getPersonalityType(scores) {
  if (scores.socialness >= 7 && scores.competitiveness <= 4) return "Social & Fun-Focused";
  if (scores.competitiveness >= 7 && scores.traditionalism >= 6) return "Competitive Traditionalist";
  if (scores.socialness >= 7 && scores.luxuryLevel >= 6) return "Social Luxury Seeker";
  if (scores.competitiveness <= 3 && scores.socialness <= 4) return "Peaceful Solo Player";
  if (scores.traditionalism >= 8) return "Golf Purist";
  return "Balanced Enthusiast";
}

function getPreferences(scores) {
  const prefs = [];
  if (scores.amenityImportance >= 6) prefs.push("Values practice facilities & amenities");
  if (scores.luxuryLevel >= 7) prefs.push("Prefers upscale experiences");
  if (scores.socialness >= 7) prefs.push("Enjoys group golf & social aspects");
  if (scores.competitiveness >= 7) prefs.push("Competitive & score-focused");
  if (scores.traditionalism >= 7) prefs.push("Appreciates golf history & tradition");
  return prefs;
}

function getRecommendations(scores) {
  return {
    courseStyle: scores.traditionalism >= 7 ? "Classic parkland" : "Resort-style",
    budgetLevel: scores.luxuryLevel >= 7 ? "Premium ($100+)" : scores.luxuryLevel >= 4 ? "Mid-range ($50-100)" : "Value ($25-50)",
    amenities: scores.amenityImportance >= 6 ? ["Driving range", "Practice greens", "Pro shop", "Dining"] : ["Basic facilities"],
    lodging: scores.luxuryLevel >= 7 ? "Resort or boutique hotel" : "Comfortable, convenient location"
  };
}

function getDemographics(scores) {
  const ageGuess = scores.ageGeneration <= 3 ? "25-40" : scores.ageGeneration <= 6 ? "35-55" : "45-65";
  return { estimatedAge: ageGuess, preferenceStyle: "Modern golfer preferences" };
}

const GolfProfiler = () => {
  // Core State
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [profile, setProfile] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionId] = useState(() => Date.now().toString());

  // UI State
  const [showFeedback, setShowFeedback] = useState(false);
  const [showMLStats, setShowMLStats] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAnswers, setEditingAnswers] = useState({});
  const [mlInsights, setMlInsights] = useState(null);
  const [similarityInsights, setSimilarityInsights] = useState(null);
  const [recommendationInsights, setRecommendationInsights] = useState(null);
  const [mlStats, setMlStats] = useState(null);

  const [scores, setScores] = useState({
    skillLevel: 0, socialness: 0, traditionalism: 0, luxuryLevel: 0,
    competitiveness: 0, ageGeneration: 0, genderLean: 0, amenityImportance: 0,
    courseStyle: {}, pace: 0
  });

  // Question bank
  const questionBank = [
    {
      id: 'golf_movie',
      type: 'starter',
      priority: 10,
      question: "Pick a Golf Movie to Watch Tonight",
      options: [
        {
          text: "Happy Gilmore",
          image: "🏌️‍♂️💥",
          scores: { skillLevel: 2, socialness: 8, traditionalism: 1, competitiveness: 3, ageGeneration: 6 }
        },
        {
          text: "Tin Cup",
          image: "🏆⛳",
          scores: { skillLevel: 7, socialness: 5, traditionalism: 4, competitiveness: 8, ageGeneration: 4 }
        },
        {
          text: "The Legend of Bagger Vance",
          image: "🧘‍♂️📿",
          scores: { skillLevel: 6, socialness: 4, traditionalism: 9, competitiveness: 4, ageGeneration: 3 }
        },
        {
          text: "Caddyshack",
          image: "😂🐿️",
          scores: { skillLevel: 5, socialness: 9, traditionalism: 2, competitiveness: 3, ageGeneration: 2 }
        }
      ]
    },
    {
      id: 'dream_course',
      type: 'core',
      priority: 9,
      question: "Your Dream Round Looks Like...",
      options: [
        {
          text: "Cliffside coastal course at sunset",
          image: "🌊🌅",
          scores: { luxuryLevel: 8, traditionalism: 6, courseStyle: 'coastal', amenityImportance: 7 }
        },
        {
          text: "Tree-lined classic parkland",
          image: "🌳🏞️",
          scores: { traditionalism: 9, skillLevel: 6, courseStyle: 'parkland', luxuryLevel: 6 }
        },
        {
          text: "Windy open links with brown turf",
          image: "🌬️⛳",
          scores: { skillLevel: 8, traditionalism: 10, competitiveness: 7, courseStyle: 'links' }
        },
        {
          text: "Laid-back 9-hole muni with no dress code",
          image: "👕🍺",
          scores: { socialness: 8, luxuryLevel: 2, traditionalism: 1, competitiveness: 2 }
        }
      ]
    },
    {
      id: 'playing_partner',
      type: 'social',
      priority: 8,
      question: "Pick a Playing Partner for 18 Holes",
      options: [
        {
          text: "Bill Murray",
          image: "😄🎭",
          scores: { socialness: 9, competitiveness: 2, traditionalism: 3, ageGeneration: 3 }
        },
        {
          text: "Tiger Woods",
          image: "🐅🏆",
          scores: { competitiveness: 10, skillLevel: 8, traditionalism: 7, socialness: 3 }
        },
        {
          text: "Barack Obama",
          image: "🎯💼",
          scores: { socialness: 7, traditionalism: 6, competitiveness: 5, ageGeneration: 5 }
        },
        {
          text: "Your best friend",
          image: "👥❤️",
          scores: { socialness: 10, competitiveness: 3, traditionalism: 2, luxuryLevel: 3 }
        }
      ]
    },
    {
      id: 'pressure_shot',
      type: 'skill_assessment',
      priority: 4,
      question: "You're 210 yards out over water. What's in your hand?",
      options: [
        {
          text: "3-wood - going for it",
          image: "🏌️‍♂️💨",
          scores: { skillLevel: 8, competitiveness: 9, traditionalism: 5 }
        },
        {
          text: "Hybrid - smart play",
          image: "🎯⛳",
          scores: { skillLevel: 6, competitiveness: 6, traditionalism: 7 }
        },
        {
          text: "Wedge - laying up safe",
          image: "🎯🛡️",
          scores: { skillLevel: 4, competitiveness: 3, traditionalism: 8 }
        },
        {
          text: "I'm already back in the cart",
          image: "🛺😅",
          scores: { skillLevel: 2, socialness: 8, competitiveness: 1 }
        }
      ]
    },
    {
      id: 'golf_attire',
      type: 'lifestyle',
      priority: 8,
      question: "What's Your Go-To Golf Outfit?",
      options: [
        {
          text: "Polo, khakis, and proper golf shoes",
          image: "👔⛳",
          scores: { traditionalism: 8, luxuryLevel: 6, competitiveness: 6, genderLean: 1 }
        },
        {
          text: "Athletic wear and spikeless sneakers",
          image: "👟🏃",
          scores: { pace: 8, ageGeneration: 7, traditionalism: 3, competitiveness: 5 }
        },
        {
          text: "Whatever's comfortable and clean",
          image: "👕😌",
          scores: { socialness: 7, traditionalism: 2, luxuryLevel: 3, competitiveness: 3 }
        },
        {
          text: "Designer golf gear and accessories",
          image: "💎👑",
          scores: { luxuryLevel: 9, traditionalism: 5, socialness: 4, amenityImportance: 7 }
        }
      ]
    }
  ];

  // Initialize
  useEffect(() => {
    if (selectedQuestions.length === 0) {
      const firstQuestion = mockMLService.selectNextQuestion({}, scores, questionBank, 0);
      setSelectedQuestions([firstQuestion]);
      const stats = mockMLService.getMLStatistics();
      setMlStats(stats);
    }
  }, [selectedQuestions.length]);

  const calculateWeightedScores = (allAnswers) => {
    const dimensionScores = {
      skillLevel: [], socialness: [], traditionalism: [], luxuryLevel: [],
      competitiveness: [], ageGeneration: [], genderLean: [], amenityImportance: [],
      pace: [], courseStyle: {}
    };

    const questionWeights = {
      'starter': 1.2, 'core': 1.5, 'skill_assessment': 1.8, 'social': 1.3,
      'lifestyle': 1.0, 'knowledge': 1.1, 'personality': 1.4, 'preparation': 1.0
    };

    Object.entries(allAnswers).forEach(([questionId, answerData]) => {
      const question = questionBank.find(q => q.id === questionId);
      const weight = questionWeights[question?.type] || 1.0;
      const rawScores = answerData.rawScores || {};

      Object.entries(rawScores).forEach(([dimension, value]) => {
        if (dimension === 'courseStyle') {
          dimensionScores.courseStyle[value] = (dimensionScores.courseStyle[value] || 0) + 1;
        } else if (dimensionScores[dimension]) {
          dimensionScores[dimension].push({ value, weight });
        }
      });
    });

    const finalScores = {
      skillLevel: 0, socialness: 0, traditionalism: 0, luxuryLevel: 0,
      competitiveness: 0, ageGeneration: 0, genderLean: 0, amenityImportance: 0,
      courseStyle: dimensionScores.courseStyle, pace: 0
    };

    Object.keys(finalScores).forEach(dimension => {
      if (dimension === 'courseStyle') return;
      const scores = dimensionScores[dimension];
      if (scores.length > 0) {
        const weightedSum = scores.reduce((sum, score) => sum + (score.value * score.weight), 0);
        const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0);
        const average = weightedSum / totalWeight;
        finalScores[dimension] = Math.round(Math.max(0, Math.min(10, average)) * 10) / 10;
      }
    });

    return finalScores;
  };

  const handleAnswer = async (optionIndex) => {
    const currentQ = selectedQuestions[currentQuestion];
    const selectedOption = currentQ.options[optionIndex];

    const newAnswers = {
      ...answers,
      [currentQ.id]: {
        questionText: currentQ.question,
        answer: selectedOption.text,
        optionIndex,
        rawScores: selectedOption.scores
      }
    };
    setAnswers(newAnswers);

    const newScores = calculateWeightedScores(newAnswers);
    setScores(newScores);

    const totalQuestions = Object.keys(newAnswers).length;
    const shouldContinue = totalQuestions < 5;

    if (shouldContinue) {
      const nextQuestion = mockMLService.selectNextQuestion(newAnswers, newScores, questionBank, totalQuestions);
      if (nextQuestion) {
        setSelectedQuestions([...selectedQuestions, nextQuestion]);
        setCurrentQuestion(currentQuestion + 1);
      } else {
        await generateProfile(newAnswers, newScores);
      }
    } else {
      await generateProfile(newAnswers, newScores);
    }
  };

  const generateProfile = async (finalAnswers, finalScores) => {
    try {
      const enhancedProfile = await mockMLService.generateProfile(finalAnswers, finalScores);
      setProfile(enhancedProfile);
      setIsComplete(true);
      setShowFeedback(true);

      const similarity = mockMLService.getUserSimilarityInsights(finalScores);
      setSimilarityInsights(similarity);
      const recInsights = mockMLService.getRecommendationInsights(finalScores, enhancedProfile.recommendations);
      setRecommendationInsights(recInsights);
    } catch (error) {
      console.error('Error generating profile:', error);
    }
  };

  const restart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setProfile(null);
    setSelectedQuestions([]);
    setIsComplete(false);
    setIsEditing(false);
    setShowFeedback(false);
    setShowMLStats(false);
    setShowInsights(false);
    setScores({
      skillLevel: 0, socialness: 0, traditionalism: 0, luxuryLevel: 0,
      competitiveness: 0, ageGeneration: 0, genderLean: 0, amenityImportance: 0,
      courseStyle: {}, pace: 0
    });

    setTimeout(() => {
      const firstQuestion = mockMLService.selectNextQuestion({}, {
        skillLevel: 0, socialness: 0, traditionalism: 0, luxuryLevel: 0,
        competitiveness: 0, ageGeneration: 0, genderLean: 0, amenityImportance: 0,
        courseStyle: {}, pace: 0
      }, questionBank, 0);
      setSelectedQuestions([firstQuestion]);
    }, 0);
  };

  if (isComplete && profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {/* Professional Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-3">
                    <Award className="mr-3 text-gold-400" size={32} />
                    <h1 className="text-3xl font-light">Your Professional Golf Profile</h1>
                  </div>
                  <p className="text-blue-200 text-lg">
                    Comprehensive analysis based on {Object.keys(answers).length} data points
                  </p>
                  <div className="flex items-center mt-4 space-x-6">
                    <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                      <Brain className="text-purple-300 mr-2" size={16} />
                      <span className="text-sm text-blue-100">AI-Enhanced Analysis</span>
                    </div>
                    <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                      <Sparkles className="text-yellow-300 mr-2" size={16} />
                      <span className="text-sm text-blue-100">
                        {Math.round((mlStats?.model?.confidence || 0.91) * 100)}% Confidence
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl mb-2">⛳</div>
                  <div className="text-sm text-blue-200">Session #{sessionId.slice(-6)}</div>
                </div>
              </div>
            </div>

            {/* Core Profile Cards */}
            <div className="p-8">
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Golfer Identity */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-emerald-500 rounded-lg p-2 mr-3">
                      <Star className="text-white" size={20} />
                    </div>
                    <h3 className="font-semibold text-emerald-900 text-lg">Golfer Identity</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-emerald-800">{profile.skillLevel?.label}</p>
                      <p className="text-emerald-600 font-medium">{profile.personality?.primary}</p>
                    </div>
                    {profile.mlInsights?.personalityPatterns && (
                      <div className="bg-white/60 rounded-lg p-3 border border-emerald-200/30">
                        <div className="flex items-center text-sm">
                          <Brain size={14} className="text-purple-600 mr-2" />
                          <span className="text-gray-700">Enhanced personality analysis</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Player Insights */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-500 rounded-lg p-2 mr-3">
                      <Users className="text-white" size={20} />
                    </div>
                    <h3 className="font-semibold text-blue-900 text-lg">Player Analytics</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Estimated Age</span>
                      <span className="font-semibold text-blue-900">{profile.demographics?.estimatedAge}</span>
                    </div>
                    {similarityInsights && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Similar Golfers</span>
                          <span className="font-semibold text-blue-900">{similarityInsights.similarUsers}</span>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 border border-blue-200/30">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Skill Percentile</span>
                            <span className="font-semibold text-blue-800">{similarityInsights.userPercentiles?.skillLevel}th</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ML Confidence */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-500 rounded-lg p-2 mr-3">
                      <Target className="text-white" size={20} />
                    </div>
                    <h3 className="font-semibold text-purple-900 text-lg">Analysis Quality</h3>
                  </div>
                  <div className="space-y-3">
                    {recommendationInsights && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-purple-700">Confidence</span>
                          <span className="font-semibold text-purple-900">{recommendationInsights.confidence}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-purple-700">Personalization</span>
                          <span className="font-semibold text-purple-900">{recommendationInsights.personalizationLevel}</span>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 border border-purple-200/30">
                          <div className="text-sm text-gray-700">
                            Based on {mlStats?.data?.totalProfiles || 0} golfer profiles
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Comprehensive Recommendations */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200/50 rounded-xl p-8 mb-8">
                <div className="flex items-center mb-6">
                  <div className="bg-slate-600 rounded-lg p-2 mr-3">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl">Personalized Recommendations</h3>
                    {profile.recommendations?.mlEnhanced && (
                      <p className="text-slate-600 text-sm">AI-enhanced suggestions based on similar golfers</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200/50">
                      <h4 className="font-semibold text-gray-800 mb-2">Preferred Course Style</h4>
                      <p className="text-gray-700 text-lg font-medium">
                        {typeof profile.recommendations?.courseStyle === 'string'
                          ? profile.recommendations.courseStyle
                          : 'Classic parkland'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200/50">
                      <h4 className="font-semibold text-gray-800 mb-2">Budget Range</h4>
                      <p className="text-gray-700 text-lg font-medium">
                        {profile.recommendations?.budgetLevel || 'Mid-range ($50-100)'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200/50">
                      <h4 className="font-semibold text-gray-800 mb-2">Essential Amenities</h4>
                      <p className="text-gray-700">
                        {Array.isArray(profile.recommendations?.amenities)
                          ? profile.recommendations.amenities.join(', ')
                          : 'Practice facilities, Pro shop'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200/50">
                      <h4 className="font-semibold text-gray-800 mb-2">Accommodation</h4>
                      <p className="text-gray-700">
                        {profile.recommendations?.lodging || 'Comfortable, convenient location'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={restart}
                  className="flex-1 min-w-48 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-8 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <RotateCcw className="mr-3" size={20} />
                  <span className="font-semibold">New Analysis</span>
                </button>

                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="flex-1 min-w-48 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-4 px-8 rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Lightbulb className="mr-3" size={20} />
                  <span className="font-semibold">{showInsights ? 'Hide' : 'Show'} Insights</span>
                </button>

                <button
                  onClick={() => setShowMLStats(!showMLStats)}
                  className="bg-gradient-to-r from-slate-600 to-gray-600 text-white py-4 px-8 rounded-xl hover:from-slate-700 hover:to-gray-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <BarChart3 className="mr-3" size={20} />
                  <span className="font-semibold">Analytics</span>
                </button>
              </div>

              {/* Enhanced Insights Panel */}
              {showInsights && (
                <div className="mt-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/50 rounded-xl p-8">
                  <h3 className="font-bold text-indigo-900 text-xl mb-6 flex items-center">
                    <Lightbulb className="mr-3 text-indigo-600" size={24} />
                    Advanced AI Insights & Analytics
                  </h3>

                  <div className="grid md:grid-cols-2 gap-8">
                    {similarityInsights && (
                      <div className="bg-white/70 rounded-lg p-6 border border-indigo-200/30">
                        <h4 className="font-semibold text-gray-800 mb-4">Similarity Analysis</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Similar Golfers Found</span>
                            <span className="font-bold text-indigo-700">{similarityInsights.similarUsers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Average Match Score</span>
                            <span className="font-bold text-indigo-700">{(similarityInsights.averageSimilarity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Best Match</span>
                            <span className="font-bold text-indigo-700">{(similarityInsights.topMatches[0]?.similarity * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {recommendationInsights && (
                      <div className="bg-white/70 rounded-lg p-6 border border-indigo-200/30">
                        <h4 className="font-semibold text-gray-800 mb-4">Recommendation Quality</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Confidence Level</span>
                            <span className="font-bold text-purple-700">{recommendationInsights.confidence}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Personalization</span>
                            <span className="font-bold text-purple-700">{recommendationInsights.personalizationLevel}</span>
                          </div>
                          {recommendationInsights.improvementSuggestions && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-2">Enhancement Opportunities:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {recommendationInsights.improvementSuggestions.slice(0, 2).map((suggestion, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-purple-500 mr-2">•</span>
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Interface
  const currentQ = selectedQuestions[currentQuestion];
  if (!currentQ) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Brain className="mx-auto text-indigo-600 mb-4 animate-pulse" size={48} />
        <p className="text-gray-600 text-lg">Initializing AI-enhanced analysis...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Professional Quiz Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-8">
            <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                <Award className="mr-3 text-gold-400" size={32} />
                <h1 className="text-3xl font-light">Professional Golf Profile Assessment</h1>
                <Brain className="ml-3 text-purple-300" size={28} />
              </div>
              <p className="text-blue-200 text-lg mb-6">
                AI-powered personality and preference analysis
              </p>

              {/* Enhanced Progress Indicator */}
              <div className="flex justify-center mb-6">
                <div className="flex space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        i < Object.keys(answers).length
                          ? 'w-8 bg-emerald-400 shadow-lg shadow-emerald-400/50'
                          : i === Object.keys(answers).length
                          ? 'w-8 bg-emerald-300 animate-pulse'
                          : 'w-6 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-sm text-blue-200">
                Question {Object.keys(answers).length + 1} of 5
              </div>

              <div className="flex items-center justify-center mt-4 space-x-6">
                <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                  <Brain size={14} className="mr-2 text-purple-300" />
                  <span className="text-xs text-blue-100">ML-Enhanced Selection</span>
                </div>
                {mlStats?.model?.confidence !== undefined && (
                  <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                    <Zap size={14} className="mr-2 text-yellow-300" />
                    <span className="text-xs text-blue-100">
                      {Math.round(mlStats.model.confidence * 100)}% Model Accuracy
                    </span>
                  </div>
                )}
                {mlStats?.data?.totalProfiles > 0 && (
                  <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                    <Users size={14} className="mr-2 text-emerald-300" />
                    <span className="text-xs text-blue-100">
                      Learning from {mlStats.data.totalProfiles} golfers
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="p-8">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                {currentQ.question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50"
                  >
                    <div className="text-5xl mb-4 text-center transition-transform duration-300 group-hover:scale-110">
                      {option.image}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-800 group-hover:text-indigo-700 text-lg transition-colors duration-300">
                        {option.text}
                      </p>
                    </div>
                    <ChevronRight className="absolute bottom-4 right-4 text-gray-300 group-hover:text-indigo-500 transition-all duration-300 transform group-hover:translate-x-1" size={20} />
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center border-t border-gray-200 pt-6">
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                <span className="flex items-center">
                  <Target size={14} className="mr-2" />
                  Questions answered: {Object.keys(answers).length}
                </span>
                <span className="flex items-center">
                  <Sparkles size={14} className="mr-2" />
                  AI confidence: {Math.round((mlStats?.model?.confidence || 0.91) * 100)}%
                </span>
              </div>
              {Object.keys(answers).length > 0 && (
                <button
                  onClick={restart}
                  className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline transition-colors duration-200"
                >
                  Start Over
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GolfProfiler;
