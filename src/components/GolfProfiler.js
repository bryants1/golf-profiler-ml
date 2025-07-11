import React, { useState, useEffect } from 'react';
import { ChevronRight, RotateCcw, MapPin, Star, Users, Clock, Brain, TrendingUp, Edit3, Settings, BarChart3, Lightbulb, Target, Zap, Award, Sparkles, ChevronDown, Circle, Shield, User, Trophy, Building, Compass } from 'lucide-react';

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

  // Question bank with professional icons
  const questionBank = [
    {
      id: 'golf_movie',
      type: 'starter',
      priority: 10,
      question: "Choose Your Preferred Golf Entertainment",
      options: [
        {
          text: "Happy Gilmore",
          icon: <Circle className="w-8 h-8 text-blue-600" />,
          description: "Comedy and entertainment",
          scores: { skillLevel: 2, socialness: 8, traditionalism: 1, competitiveness: 3, ageGeneration: 6 }
        },
        {
          text: "Tin Cup",
          icon: <Trophy className="w-8 h-8 text-amber-600" />,
          description: "Competitive drama",
          scores: { skillLevel: 7, socialness: 5, traditionalism: 4, competitiveness: 8, ageGeneration: 4 }
        },
        {
          text: "The Legend of Bagger Vance",
          icon: <Compass className="w-8 h-8 text-emerald-600" />,
          description: "Philosophy and tradition",
          scores: { skillLevel: 6, socialness: 4, traditionalism: 9, competitiveness: 4, ageGeneration: 3 }
        },
        {
          text: "Caddyshack",
          icon: <Users className="w-8 h-8 text-orange-600" />,
          description: "Social and comedic",
          scores: { skillLevel: 5, socialness: 9, traditionalism: 2, competitiveness: 3, ageGeneration: 2 }
        }
      ]
    },
    {
      id: 'dream_course',
      type: 'core',
      priority: 9,
      question: "Select Your Ideal Golf Environment",
      options: [
        {
          text: "Coastal Championship Course",
          icon: <MapPin className="w-8 h-8 text-blue-600" />,
          description: "Premium oceanside setting",
          scores: { luxuryLevel: 8, traditionalism: 6, courseStyle: 'coastal', amenityImportance: 7 }
        },
        {
          text: "Classic Parkland Design",
          icon: <Building className="w-8 h-8 text-green-600" />,
          description: "Traditional tree-lined fairways",
          scores: { traditionalism: 9, skillLevel: 6, courseStyle: 'parkland', luxuryLevel: 6 }
        },
        {
          text: "Links-Style Championship",
          icon: <Target className="w-8 h-8 text-gray-600" />,
          description: "Challenging windy conditions",
          scores: { skillLevel: 8, traditionalism: 10, competitiveness: 7, courseStyle: 'links' }
        },
        {
          text: "Casual Municipal Course",
          icon: <Users className="w-8 h-8 text-purple-600" />,
          description: "Relaxed accessible golf",
          scores: { socialness: 8, luxuryLevel: 2, traditionalism: 1, competitiveness: 2 }
        }
      ]
    },
    {
      id: 'playing_partner',
      type: 'social',
      priority: 8,
      question: "Choose Your Ideal Playing Partner",
      options: [
        {
          text: "Entertainment Celebrity",
          icon: <Star className="w-8 h-8 text-purple-600" />,
          description: "Fun and engaging personality",
          scores: { socialness: 9, competitiveness: 2, traditionalism: 3, ageGeneration: 3 }
        },
        {
          text: "Professional Golfer",
          icon: <Trophy className="w-8 h-8 text-amber-600" />,
          description: "Elite skill and knowledge",
          scores: { competitiveness: 10, skillLevel: 8, traditionalism: 7, socialness: 3 }
        },
        {
          text: "Business Leader",
          icon: <Building className="w-8 h-8 text-blue-600" />,
          description: "Strategic and accomplished",
          scores: { socialness: 7, traditionalism: 6, competitiveness: 5, ageGeneration: 5 }
        },
        {
          text: "Close Friend",
          icon: <Users className="w-8 h-8 text-green-600" />,
          description: "Comfortable and familiar",
          scores: { socialness: 10, competitiveness: 3, traditionalism: 2, luxuryLevel: 3 }
        }
      ]
    },
    {
      id: 'pressure_shot',
      type: 'skill_assessment',
      priority: 4,
      question: "Approach for 210-Yard Water Carry",
      options: [
        {
          text: "3-Wood Attack",
          icon: <Zap className="w-8 h-8 text-red-600" />,
          description: "Aggressive play",
          scores: { skillLevel: 8, competitiveness: 9, traditionalism: 5 }
        },
        {
          text: "Hybrid Precision",
          icon: <Target className="w-8 h-8 text-blue-600" />,
          description: "Strategic accuracy",
          scores: { skillLevel: 6, competitiveness: 6, traditionalism: 7 }
        },
        {
          text: "Wedge Layup",
          icon: <Shield className="w-8 h-8 text-green-600" />,
          description: "Conservative safety",
          scores: { skillLevel: 4, competitiveness: 3, traditionalism: 8 }
        },
        {
          text: "Course Management",
          icon: <Compass className="w-8 h-8 text-orange-600" />,
          description: "Alternative routing",
          scores: { skillLevel: 2, socialness: 8, competitiveness: 1 }
        }
      ]
    },
    {
      id: 'golf_attire',
      type: 'lifestyle',
      priority: 8,
      question: "Professional Golf Attire Preference",
      options: [
        {
          text: "Traditional Club Standards",
          icon: <User className="w-8 h-8 text-blue-600" />,
          description: "Polo shirt and dress pants",
          scores: { traditionalism: 8, luxuryLevel: 6, competitiveness: 6, genderLean: 1 }
        },
        {
          text: "Modern Athletic Wear",
          icon: <Zap className="w-8 h-8 text-green-600" />,
          description: "Performance-focused apparel",
          scores: { pace: 8, ageGeneration: 7, traditionalism: 3, competitiveness: 5 }
        },
        {
          text: "Comfortable Casual",
          icon: <Users className="w-8 h-8 text-purple-600" />,
          description: "Relaxed and practical",
          scores: { socialness: 7, traditionalism: 2, luxuryLevel: 3, competitiveness: 3 }
        },
        {
          text: "Premium Designer",
          icon: <Star className="w-8 h-8 text-amber-600" />,
          description: "High-end golf fashion",
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Professional Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-8 py-12">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="bg-white/10 rounded-lg p-3 mr-4">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">Golf Profile Assessment</h1>
                      <p className="text-gray-300 text-lg mt-1">Professional Analysis Report</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                      <Brain className="text-blue-300 mr-2" size={16} />
                      <span className="text-sm">AI-Enhanced Analysis</span>
                    </div>
                    <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                      <Target className="text-green-300 mr-2" size={16} />
                      <span className="text-sm">
                        {Math.round((mlStats?.model?.confidence || 0.91) * 100)}% Confidence
                      </span>
                    </div>
                    <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                      <BarChart3 className="text-purple-300 mr-2" size={16} />
                      <span className="text-sm">{Object.keys(answers).length} Data Points</span>
                    </div>
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="bg-white/10 rounded-lg p-4">
                    <Circle className="w-12 h-12 text-white mx-auto mb-2" />
                    <div className="text-sm text-gray-300">Session</div>
                    <div className="text-xs text-gray-400">#{sessionId.slice(-6)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Profile Section */}
            <div className="px-8 py-8">
              <div className="grid lg:grid-cols-3 gap-8 mb-8">
                {/* Player Profile */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-600 rounded-lg p-2 mr-3">
                      <User className="text-white" size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Player Profile</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{profile.skillLevel?.label}</div>
                      <div className="text-blue-600 font-medium">{profile.personality?.primary}</div>
                    </div>
                    {profile.mlInsights?.personalityPatterns && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center text-sm">
                          <Brain size={14} className="text-purple-600 mr-2" />
                          <span className="text-gray-700">Enhanced personality analysis applied</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analytics */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-600 rounded-lg p-2 mr-3">
                      <BarChart3 className="text-white" size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Player Analytics</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Age Range</span>
                      <span className="font-semibold text-gray-900">{profile.demographics?.estimatedAge}</span>
                    </div>
                    {similarityInsights && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Similar Profiles</span>
                          <span className="font-semibold text-gray-900">{similarityInsights.similarUsers}</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Skill Percentile</span>
                            <span className="font-semibold text-green-700">{similarityInsights.userPercentiles?.skillLevel}th</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-600 rounded-lg p-2 mr-3">
                      <Target className="text-white" size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Analysis Quality</h3>
                  </div>
                  <div className="space-y-3">
                    {recommendationInsights && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Confidence</span>
                          <span className="font-semibold text-gray-900">{recommendationInsights.confidence}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Personalization</span>
                          <span className="font-semibold text-gray-900">{recommendationInsights.personalizationLevel}</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-sm text-gray-700">
                            Based on {mlStats?.data?.totalProfiles || 0} profiles
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="bg-gray-700 rounded-lg p-2 mr-3">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl">Personalized Recommendations</h3>
                    <p className="text-gray-600 text-sm mt-1">Tailored suggestions based on your profile analysis</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center mb-2">
                        <Circle className="text-gray-600 mr-2" size={16} />
                        <h4 className="font-semibold text-gray-800">Course Style</h4>
                      </div>
                      <p className="text-gray-700 font-medium">
                        {typeof profile.recommendations?.courseStyle === 'string'
                          ? profile.recommendations.courseStyle
                          : 'Classic parkland'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center mb-2">
                        <Building className="text-gray-600 mr-2" size={16} />
                        <h4 className="font-semibold text-gray-800">Budget Range</h4>
                      </div>
                      <p className="text-gray-700 font-medium">
                        {profile.recommendations?.budgetLevel || 'Mid-range ($50-100)'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center mb-2">
                        <Star className="text-gray-600 mr-2" size={16} />
                        <h4 className="font-semibold text-gray-800">Essential Amenities</h4>
                      </div>
                      <p className="text-gray-700">
                        {Array.isArray(profile.recommendations?.amenities)
                          ? profile.recommendations.amenities.join(', ')
                          : 'Practice facilities, Pro shop'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center mb-2">
                        <MapPin className="text-gray-600 mr-2" size={16} />
                        <h4 className="font-semibold text-gray-800">Accommodation</h4>
                      </div>
                      <p className="text-gray-700">
                        {profile.recommendations?.lodging || 'Comfortable, convenient location'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={restart}
                  className="flex-1 min-w-48 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center font-medium shadow-sm"
                >
                  <RotateCcw className="mr-2" size={18} />
                  New Assessment
                </button>

                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="flex-1 min-w-48 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center font-medium shadow-sm"
                >
                  <Lightbulb className="mr-2" size={18} />
                  {showInsights ? 'Hide' : 'Show'} Insights
                </button>

                <button
                  onClick={() => setShowMLStats(!showMLStats)}
                  className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center font-medium shadow-sm"
                >
                  <BarChart3 className="mr-2" size={18} />
                  Analytics
                </button>
              </div>

              {/* Enhanced Insights Panel */}
              {showInsights && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                  <h3 className="font-bold text-blue-900 text-xl mb-6 flex items-center">
                    <Lightbulb className="mr-3 text-blue-600" size={24} />
                    Advanced Analytics & Insights
                  </h3>

                  <div className="grid md:grid-cols-2 gap-8">
                    {similarityInsights && (
                      <div className="bg-white rounded-lg p-6 border border-blue-200">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <Users className="mr-2 text-blue-600" size={18} />
                          Similarity Analysis
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Similar Profiles</span>
                            <span className="font-semibold text-blue-700">{similarityInsights.similarUsers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Average Match</span>
                            <span className="font-semibold text-blue-700">{(similarityInsights.averageSimilarity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Best Match</span>
                            <span className="font-semibold text-blue-700">{(similarityInsights.topMatches[0]?.similarity * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {recommendationInsights && (
                      <div className="bg-white rounded-lg p-6 border border-blue-200">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <Target className="mr-2 text-purple-600" size={18} />
                          Recommendation Quality
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Confidence Level</span>
                            <span className="font-semibold text-purple-700">{recommendationInsights.confidence}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Personalization</span>
                            <span className="font-semibold text-purple-700">{recommendationInsights.personalizationLevel}</span>
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
          <Brain className="mx-auto text-blue-600 mb-4 animate-pulse" size={48} />
          <p className="text-gray-600 text-lg font-medium">Initializing Assessment</p>
          <p className="text-gray-500 text-sm mt-2">Preparing AI-enhanced analysis system...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Professional Quiz Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-8 py-12">
            <div className="text-center">
              <div className="flex justify-center items-center mb-6">
                <div className="bg-white/10 rounded-lg p-3 mr-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Golf Profile Assessment</h1>
                  <p className="text-gray-300 text-lg mt-1">Professional Analysis System</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 ml-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center mb-8">
                <div className="flex space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        i < Object.keys(answers).length
                          ? 'w-12 bg-blue-400'
                          : i === Object.keys(answers).length
                          ? 'w-12 bg-blue-300 animate-pulse'
                          : 'w-8 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-300 mb-6">
                Question {Object.keys(answers).length + 1} of 5
              </div>

              <div className="flex items-center justify-center space-x-6">
                <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                  <Brain size={14} className="mr-2 text-blue-300" />
                  <span className="text-xs">AI-Enhanced</span>
                </div>
                {mlStats?.model?.confidence !== undefined && (
                  <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                    <Target size={14} className="mr-2 text-green-300" />
                    <span className="text-xs">
                      {Math.round(mlStats.model.confidence * 100)}% Accuracy
                    </span>
                  </div>
                )}
                {mlStats?.data?.totalProfiles > 0 && (
                  <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                    <Users size={14} className="mr-2 text-purple-300" />
                    <span className="text-xs">
                      {mlStats.data.totalProfiles} Profiles
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="px-8 py-12">
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
                {currentQ.question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className="group relative bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 text-lg mb-2 transition-colors duration-200">
                          {option.text}
                        </h3>
                        <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-200">
                          {option.description}
                        </p>
                      </div>
                      <ChevronRight className="flex-shrink-0 text-gray-300 group-hover:text-blue-500 transition-all duration-200 transform group-hover:translate-x-1" size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center border-t border-gray-200 pt-8">
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 mb-4">
                <span className="flex items-center">
                  <BarChart3 size={14} className="mr-2" />
                  Progress: {Object.keys(answers).length}/5
                </span>
                <span className="flex items-center">
                  <Target size={14} className="mr-2" />
                  Confidence: {Math.round((mlStats?.model?.confidence || 0.91) * 100)}%
                </span>
              </div>
              {Object.keys(answers).length > 0 && (
                <button
                  onClick={restart}
                  className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors duration-200"
                >
                  Reset Assessment
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
