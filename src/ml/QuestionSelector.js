// QuestionSelector.js - ML-enhanced question selection algorithms
import { ML_CONFIG } from './MLConfig.js';

export class QuestionSelector {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.questionEffectiveness = this.loadQuestionEffectiveness();
    this.adaptiveWeights = this.initializeAdaptiveWeights();
  }

  // Load question effectiveness data from training
  loadQuestionEffectiveness() {
    return this.dataManager.getQuestionEffectiveness();
  }

  // Initialize adaptive weights for different question types
  initializeAdaptiveWeights() {
    return {
      uncertainty_reduction: 1.0,    // How much a question reduces uncertainty
      information_gain: 1.0,         // Information theory based scoring
      user_engagement: 1.0,          // How engaging the question is
      completion_rate: 1.0,          // How often users complete after this question
      accuracy_contribution: 1.0     // How much it contributes to accurate profiles
    };
  }

  // Main question selection method with ML enhancement
  selectNextQuestion(currentAnswers, currentScores, questionBank, questionNumber, userContext = {}) {
    if (questionNumber === 0) {
      return this.selectStarterQuestion(questionBank);
    }

    const answeredIds = Object.keys(currentAnswers);
    const unansweredQuestions = questionBank.filter(q => !answeredIds.includes(q.id));

    if (unansweredQuestions.length === 0) {
      return null;
    }

    // Calculate scores for each unanswered question
    const questionScores = unansweredQuestions.map(question => ({
      question,
      score: this.calculateQuestionScore(
        question,
        currentAnswers,
        currentScores,
        questionNumber,
        userContext
      )
    }));

    // Sort by score and return the best question
    questionScores.sort((a, b) => b.score - a.score);

    // Add some randomness to avoid always picking the same sequence
    const topQuestions = questionScores.slice(0, Math.min(3, questionScores.length));
    const randomIndex = this.weightedRandomSelection(topQuestions);

    return topQuestions[randomIndex].question;
  }

  // Calculate comprehensive score for a question
  calculateQuestionScore(question, currentAnswers, currentScores, questionNumber, userContext) {
    let score = question.priority || 0;

    // Add ML-enhanced scoring components
    score += this.calculateUncertaintyReductionScore(question, currentScores);
    score += this.calculateInformationGainScore(question, currentAnswers);
    score += this.calculateEffectivenessScore(question);
    score += this.calculateCompletionRateScore(question, questionNumber);
    score += this.calculateEngagementScore(question, userContext);
    score += this.calculateAdaptiveScore(question, currentScores, questionNumber);

    return score;
  }

  // Score based on how much uncertainty the question reduces
  calculateUncertaintyReductionScore(question, currentScores) {
    const uncertainties = this.calculateCurrentUncertainties(currentScores);
    let reductionScore = 0;

    question.options.forEach(option => {
      Object.keys(option.scores || {}).forEach(dimension => {
        if (uncertainties[dimension]) {
          // Higher score for questions that address uncertain dimensions
          reductionScore += uncertainties[dimension] * ML_CONFIG.QUESTION_WEIGHTS.UNCERTAINTY_WEIGHT;
        }
      });
    });

    return reductionScore;
  }

  // Information theory based scoring
  calculateInformationGainScore(question, currentAnswers) {
    // Calculate expected information gain
    const optionVariability = this.calculateOptionVariability(question);
    const dimensionCoverage = this.calculateDimensionCoverage(question, currentAnswers);

    return optionVariability * dimensionCoverage * 2;
  }

  // Score based on historical effectiveness
  calculateEffectivenessScore(question) {
    const effectiveness = this.questionEffectiveness[question.id];
    if (!effectiveness) return 0;

    return effectiveness.averageEffectiveness * ML_CONFIG.QUESTION_WEIGHTS.ML_EFFECTIVENESS_WEIGHT;
  }

  // Score based on completion rates after this question
  calculateCompletionRateScore(question, questionNumber) {
    const questionPaths = this.dataManager.getQuestionPaths();

    if (questionPaths.length === 0) return 0;

    // Calculate completion rate when this question appears at this position
    const relevantPaths = questionPaths.filter(path =>
      path.questionSequence.includes(question.id) &&
      path.questionSequence.indexOf(question.id) === questionNumber
    );

    if (relevantPaths.length === 0) return 0;

    const completionRate = relevantPaths.filter(path =>
      path.effectiveness >= 0.7
    ).length / relevantPaths.length;

    return completionRate * 3; // Boost questions that lead to completion
  }

  // Score based on user engagement patterns
  calculateEngagementScore(question, userContext) {
    let engagementScore = 0;

    // Boost visually appealing questions
    if (question.options.every(opt => opt.image)) {
      engagementScore += 1;
    }

    // Consider user's response time patterns (if available)
    if (userContext.averageResponseTime) {
      // Boost questions that typically get faster responses (more engaging)
      const expectedResponseTime = this.getExpectedResponseTime(question);
      if (expectedResponseTime < userContext.averageResponseTime) {
        engagementScore += 0.5;
      }
    }

    // Boost questions that are more "fun" vs analytical
    if (question.type === 'lifestyle' || question.type === 'social') {
      engagementScore += 0.3;
    }

    return engagementScore;
  }

  // Adaptive scoring based on learning patterns
  calculateAdaptiveScore(question, currentScores, questionNumber) {
    let adaptiveScore = 0;

    // Early questions should be broad
    if (questionNumber < 3 && question.type === 'core') {
      adaptiveScore += 2;
    }

    // Later questions should be more targeted
    if (questionNumber >= 3) {
      if (this.isTargetedQuestion(question, currentScores)) {
        adaptiveScore += 1.5;
      }
    }

    // Avoid redundant questions
    if (this.isRedundantQuestion(question, currentScores)) {
      adaptiveScore -= 2;
    }

    // Boost questions that help with final decision
    if (questionNumber >= ML_CONFIG.QUESTION_FLOW.MIN_QUESTIONS - 1) {
      if (this.isDecisionCriticalQuestion(question, currentScores)) {
        adaptiveScore += 2;
      }
    }

    return adaptiveScore;
  }

  // Calculate current uncertainties in user profile
  calculateCurrentUncertainties(currentScores) {
    const uncertainties = {};

    ML_CONFIG.SIMILARITY_DIMENSIONS.forEach(dimension => {
      const score = currentScores[dimension] || 0;
      // Higher uncertainty for scores near the middle (5) and for unset dimensions
      uncertainties[dimension] = score === 0 ? 10 : Math.abs(score - 5);
    });

    return uncertainties;
  }

  // Calculate how variable the question options are
  calculateOptionVariability(question) {
    if (!question.options || question.options.length < 2) return 0;

    const dimensionRanges = {};

    question.options.forEach(option => {
      Object.entries(option.scores || {}).forEach(([dimension, value]) => {
        if (!dimensionRanges[dimension]) {
          dimensionRanges[dimension] = { min: value, max: value };
        } else {
          dimensionRanges[dimension].min = Math.min(dimensionRanges[dimension].min, value);
          dimensionRanges[dimension].max = Math.max(dimensionRanges[dimension].max, value);
        }
      });
    });

    // Average range across all dimensions
    const ranges = Object.values(dimensionRanges).map(range => range.max - range.min);
    return ranges.length > 0 ? ranges.reduce((a, b) => a + b, 0) / ranges.length : 0;
  }

  // Calculate how well the question covers unexplored dimensions
  calculateDimensionCoverage(question, currentAnswers) {
    const exploredDimensions = new Set();

    Object.values(currentAnswers).forEach(answer => {
      // Would need to look up the original question to get dimensions
      // Simplified here
    });

    const questionDimensions = new Set();
    question.options.forEach(option => {
      Object.keys(option.scores || {}).forEach(dim => questionDimensions.add(dim));
    });

    const newDimensions = [...questionDimensions].filter(dim => !exploredDimensions.has(dim));
    return newDimensions.length / Math.max(1, questionDimensions.size);
  }

  // Check if question is targeted for current uncertainty
  isTargetedQuestion(question, currentScores) {
    const uncertainties = this.calculateCurrentUncertainties(currentScores);
    const mostUncertainDim = Object.entries(uncertainties)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return question.options.some(option =>
      option.scores && option.scores.hasOwnProperty(mostUncertainDim)
    );
  }

  // Check if question would be redundant
  isRedundantQuestion(question, currentScores) {
    // A question is redundant if all its dimensions are already well-defined
    const uncertainties = this.calculateCurrentUncertainties(currentScores);

    const questionDimensions = new Set();
    question.options.forEach(option => {
      Object.keys(option.scores || {}).forEach(dim => questionDimensions.add(dim));
    });

    return [...questionDimensions].every(dim => (uncertainties[dim] || 10) < 2);
  }

  // Check if question is critical for final decisions
  isDecisionCriticalQuestion(question, currentScores) {
    const criticalDimensions = ML_CONFIG.QUESTION_FLOW.REQUIRED_DIMENSIONS;

    return question.options.some(option =>
      Object.keys(option.scores || {}).some(dim =>
        criticalDimensions.includes(dim) && (currentScores[dim] || 0) === 0
      )
    );
  }

  // Select starter question with some variety
  selectStarterQuestion(questionBank) {
    const starterQuestions = questionBank.filter(q => q.type === 'starter');

    if (starterQuestions.length === 0) {
      return questionBank[0];
    }

    // Add some randomness to starter selection
    const weights = starterQuestions.map((q, i) => 10 - i); // Prefer higher priority
    const selectedIndex = this.weightedRandomSelection(
      starterQuestions.map((q, i) => ({ question: q, score: weights[i] }))
    );

    return starterQuestions[selectedIndex];
  }

  // Weighted random selection to add variety
  weightedRandomSelection(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.score || 1), 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= (items[i].score || 1);
      if (random <= 0) {
        return i;
      }
    }

    return 0; // Fallback
  }

  // Get expected response time for a question (would be learned from data)
  getExpectedResponseTime(question) {
    // Simplified - in real implementation, this would come from analytics
    const baseTime = 15; // seconds
    const complexity = question.options.length * 2;
    const textLength = question.question.length / 10;

    return baseTime + complexity + textLength;
  }

  // Dynamic question path optimization
  optimizeQuestionPath(currentAnswers, currentScores, questionBank, targetLength = 6) {
    const remainingQuestions = targetLength - Object.keys(currentAnswers).length;

    if (remainingQuestions <= 0) return null;

    // Plan the optimal sequence of remaining questions
    const answeredIds = Object.keys(currentAnswers);
    const unansweredQuestions = questionBank.filter(q => !answeredIds.includes(q.id));

    // Use greedy approach to select best sequence
    const plannedSequence = [];
    let tempScores = { ...currentScores };
    let tempAnswers = { ...currentAnswers };

    for (let i = 0; i < remainingQuestions && unansweredQuestions.length > 0; i++) {
      const nextQuestion = this.selectNextQuestion(
        tempAnswers,
        tempScores,
        unansweredQuestions,
        Object.keys(tempAnswers).length
      );

      if (!nextQuestion) break;

      plannedSequence.push(nextQuestion);

      // Simulate answering with most informative option
      const bestOption = this.findMostInformativeOption(nextQuestion, tempScores);
      if (bestOption) {
        tempAnswers[nextQuestion.id] = {
          questionText: nextQuestion.question,
          answer: bestOption.text,
          optionIndex: nextQuestion.options.indexOf(bestOption)
        };

        // Update temp scores
        Object.entries(bestOption.scores || {}).forEach(([dimension, value]) => {
          if (dimension === 'courseStyle') {
            tempScores.courseStyle = {
              ...tempScores.courseStyle,
              [value]: (tempScores.courseStyle[value] || 0) + 1
            };
          } else {
            tempScores[dimension] = Math.max(0, Math.min(10, (tempScores[dimension] || 0) + value));
          }
        });
      }

      // Remove selected question from available options
      const index = unansweredQuestions.indexOf(nextQuestion);
      if (index > -1) {
        unansweredQuestions.splice(index, 1);
      }
    }

    return {
      nextQuestion: plannedSequence[0],
      plannedSequence: plannedSequence,
      projectedAccuracy: this.estimatePathAccuracy(plannedSequence, tempScores)
    };
  }

  // Find the most informative option for simulation
  findMostInformativeOption(question, currentScores) {
    if (!question.options || question.options.length === 0) return null;

    const uncertainties = this.calculateCurrentUncertainties(currentScores);

    let bestOption = question.options[0];
    let bestInformationGain = 0;

    question.options.forEach(option => {
      let informationGain = 0;

      Object.entries(option.scores || {}).forEach(([dimension, value]) => {
        // Higher gain for addressing uncertain dimensions with significant values
        informationGain += (uncertainties[dimension] || 0) * Math.abs(value);
      });

      if (informationGain > bestInformationGain) {
        bestInformationGain = informationGain;
        bestOption = option;
      }
    });

    return bestOption;
  }

  // Estimate accuracy of a planned question path
  estimatePathAccuracy(plannedSequence, finalScores) {
    // Simplified accuracy estimation based on coverage and balance
    const dimensionCoverage = this.calculateSequenceCoverage(plannedSequence);
    const scoreBalance = this.calculateScoreBalance(finalScores);

    return (dimensionCoverage + scoreBalance) / 2;
  }

  calculateSequenceCoverage(sequence) {
    const coveredDimensions = new Set();

    sequence.forEach(question => {
      question.options.forEach(option => {
        Object.keys(option.scores || {}).forEach(dim => coveredDimensions.add(dim));
      });
    });

    return Math.min(1, coveredDimensions.size / ML_CONFIG.SIMILARITY_DIMENSIONS.length);
  }

  calculateScoreBalance(scores) {
    // Prefer scores that are not all in the middle (more definitive profile)
    const nonZeroScores = ML_CONFIG.SIMILARITY_DIMENSIONS
      .map(dim => scores[dim] || 0)
      .filter(score => score > 0);

    if (nonZeroScores.length === 0) return 0;

    const avgDistanceFromMiddle = nonZeroScores
      .map(score => Math.abs(score - 5))
      .reduce((a, b) => a + b, 0) / nonZeroScores.length;

    return Math.min(1, avgDistanceFromMiddle / 5);
  }

  // Update effectiveness based on user feedback
  updateQuestionEffectiveness(questionId, effectiveness) {
    this.dataManager.updateQuestionEffectiveness(questionId, effectiveness);
    this.questionEffectiveness = this.dataManager.getQuestionEffectiveness();
  }

  // A/B testing for question variations
  getQuestionVariant(baseQuestion, userContext = {}) {
    // Could implement A/B testing for different question phrasings
    // For now, return the base question
    return baseQuestion;
  }

  // Analytics for question performance
  getQuestionAnalytics() {
    const questionPaths = this.dataManager.getQuestionPaths();
    const analytics = {};

    questionPaths.forEach(path => {
      path.questionSequence.forEach((questionId, index) => {
        if (!analytics[questionId]) {
          analytics[questionId] = {
            totalUses: 0,
            positionDistribution: {},
            averagePosition: 0,
            completionRate: 0,
            effectiveness: 0
          };
        }

        const qa = analytics[questionId];
        qa.totalUses++;
        qa.positionDistribution[index] = (qa.positionDistribution[index] || 0) + 1;
        qa.averagePosition = (qa.averagePosition * (qa.totalUses - 1) + index) / qa.totalUses;
        qa.effectiveness = (qa.effectiveness * (qa.totalUses - 1) + path.effectiveness) / qa.totalUses;
      });
    });

    return analytics;
  }
}

export default QuestionSelector;
