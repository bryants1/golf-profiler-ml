// SimilarityCalculator.js - Advanced similarity calculations (FIXED)
import { ML_CONFIG } from './MLConfig.js';

export class SimilarityCalculator {
  constructor() {
    this.weights = this.calculateDimensionWeights();
    this.config = { SIMILARITY_THRESHOLD: 0.5, MAX_SIMILAR_PROFILES: 10 };
  }

  // Main similarity calculation with multiple algorithms
  calculateSimilarity(scores1, scores2, algorithm = 'weighted_euclidean') {
    switch (algorithm) {
      case 'cosine':
        return this.cosineSimilarity(scores1, scores2);
      case 'manhattan':
        return this.manhattanSimilarity(scores1, scores2);
      case 'weighted_euclidean':
        return this.weightedEuclideanSimilarity(scores1, scores2);
      case 'pearson':
        return this.pearsonCorrelation(scores1, scores2);
      default:
        return this.weightedEuclideanSimilarity(scores1, scores2);
    }
  }

  // Weighted Euclidean distance (default, works well for golf profiles)
  weightedEuclideanSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    let sumSquaredDiffs = 0;
    let totalWeight = 0;

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      const weight = this.weights[dim] || 1;

      const diff = (val1 - val2) / 10; // Normalize to 0-1
      sumSquaredDiffs += weight * (diff * diff);
      totalWeight += weight;
    });

    const euclideanDistance = Math.sqrt(sumSquaredDiffs / totalWeight);
    return Math.max(0, 1 - euclideanDistance); // Convert distance to similarity
  }

  // Cosine similarity - good for high-dimensional data
  cosineSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;

      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    });

    const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  // Manhattan distance similarity
  manhattanSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    let totalDiff = 0;

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      totalDiff += Math.abs(val1 - val2) / 10; // Normalize
    });

    const avgDiff = totalDiff / dimensions.length;
    return Math.max(0, 1 - avgDiff);
  }

  // Pearson correlation coefficient
  pearsonCorrelation(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    const values1 = dimensions.map(dim => scores1[dim] || 0);
    const values2 = dimensions.map(dim => scores2[dim] || 0);

    const mean1 = values1.reduce((a, b) => a + b) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b) / values2.length;

    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sum1 += diff1 * diff1;
      sum2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Find similar profiles with advanced filtering
  findSimilarProfiles(targetScores, allProfiles, options = {}) {
    const {
      algorithm = 'weighted_euclidean',
      threshold = this.config.SIMILARITY_THRESHOLD,
      maxResults = this.config.MAX_SIMILAR_PROFILES,
      minResults = 3,
      diversityFactor = 0.1 // 0-1, higher = more diverse results
    } = options;

    console.log(`🔍 Finding similar profiles: threshold=${threshold}, max=${maxResults}`);

    // Calculate similarities
    let similarities = allProfiles.map(profile => ({
      ...profile,
      similarity: this.calculateSimilarity(targetScores, profile.scores, algorithm)
    }));

    // Filter by threshold
    similarities = similarities.filter(p => p.similarity >= threshold);
    console.log(`📊 Found ${similarities.length} profiles above threshold`);

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Apply diversity filtering if requested
    if (diversityFactor > 0 && similarities.length > minResults) {
      similarities = this.applyDiversityFilter(similarities, diversityFactor);
    }

    // Limit results
    return similarities.slice(0, maxResults);
  }

  // NEW: Enhanced progressive similarity search with archetype matching
  findSimilarProfilesProgressive(targetScores, allProfiles, options = {}) {
    const {
      algorithm = 'weighted_euclidean',
      maxResults = 10,
      minResults = 3,
      useArchetypeBonus = true,
      diversityFactor = 0.1,
      debug = false
    } = options;

    if (debug) {
      console.log('🔍 Progressive similarity search started');
      console.log('🎯 Target scores:', targetScores);
      console.log('📊 Available profiles:', allProfiles.length);
    }

    // Step 1: Determine target user's archetype
    const targetArchetype = this.determineArchetype(targetScores);
    if (debug) {
      console.log(`🎭 Target archetype: ${targetArchetype.archetype} (${(targetArchetype.confidence * 100).toFixed(0)}% confidence)`);
    }

    // Step 2: Calculate base similarities
    let similarities = allProfiles.map(profile => {
      const baseSimilarity = this.calculateSimilarity(targetScores, profile.scores, algorithm);

      // Determine profile's archetype
      const profileArchetype = this.determineArchetype(profile.scores);

      // Apply archetype bonus
      let archetypeBonus = 0;
      if (useArchetypeBonus && profileArchetype.archetype === targetArchetype.archetype) {
        archetypeBonus = 0.15 * Math.min(targetArchetype.confidence, profileArchetype.confidence);
      } else if (useArchetypeBonus && this.areCompatibleArchetypes(targetArchetype.archetype, profileArchetype.archetype)) {
        archetypeBonus = 0.08 * Math.min(targetArchetype.confidence, profileArchetype.confidence);
      }

      const finalSimilarity = Math.min(1.0, baseSimilarity + archetypeBonus);

      return {
        ...profile,
        similarity: finalSimilarity,
        baseSimilarity,
        archetypeBonus,
        profileArchetype: profileArchetype.archetype
      };
    });

    // Step 3: Progressive threshold adjustment
    let threshold = 0.7;
    let found = [];

    while (found.length < minResults && threshold > 0.3) {
      found = similarities.filter(p => p.similarity >= threshold);
      if (found.length < minResults) {
        threshold -= 0.1;
        if (debug) console.log(`📉 Lowering threshold to ${threshold.toFixed(1)}`);
      }
    }

    // Step 4: Sort and apply diversity
    found.sort((a, b) => b.similarity - a.similarity);

    if (diversityFactor > 0 && found.length > minResults) {
      found = this.applyDiversityFilter(found, diversityFactor);
    }

    const result = found.slice(0, maxResults);

    if (debug) {
      console.log(`✅ Progressive search found ${result.length} profiles`);
      console.log('🎯 Top matches:', result.slice(0, 3).map(p => ({
        archetype: p.profileArchetype,
        similarity: (p.similarity * 100).toFixed(1) + '%',
        base: (p.baseSimilarity * 100).toFixed(1) + '%',
        bonus: '+' + (p.archetypeBonus * 100).toFixed(1) + '%'
      })));
    }

    return result;
  }

  // Determine user archetype based on scores
  determineArchetype(scores) {
    const archetypes = [
      {
        name: 'social_beginner',
        pattern: { skill: [0, 4], social: [6, 10], luxury: [0, 5], competitive: [0, 4] },
        weight: 1.0
      },
      {
        name: 'traditional_serious',
        pattern: { skill: [6, 10], social: [0, 6], luxury: [4, 8], tradition: [7, 10], competitive: [6, 10] },
        weight: 1.0
      },
      {
        name: 'luxury_social',
        pattern: { skill: [3, 8], social: [7, 10], luxury: [7, 10], amenity: [7, 10] },
        weight: 1.0
      },
      {
        name: 'competitive_solo',
        pattern: { skill: [6, 10], social: [0, 4], competitive: [7, 10], pace: [6, 10] },
        weight: 1.0
      },
      {
        name: 'casual_weekend',
        pattern: { skill: [2, 6], social: [4, 8], luxury: [3, 7], competitive: [2, 6] },
        weight: 1.0
      }
    ];

    let bestMatch = { archetype: 'casual_weekend', confidence: 0.3 };

    archetypes.forEach(archetype => {
      let matchScore = 0;
      let totalDimensions = 0;

      Object.entries(archetype.pattern).forEach(([dimension, [min, max]]) => {
        const mappedDim = this.mapDimensionName(dimension);
        const userValue = scores[mappedDim] || 0;

        if (userValue >= min && userValue <= max) {
          matchScore += 1;
        } else {
          // Partial credit for near misses
          const distance = Math.min(Math.abs(userValue - min), Math.abs(userValue - max));
          if (distance <= 2) {
            matchScore += 0.5;
          }
        }
        totalDimensions += 1;
      });

      const confidence = matchScore / totalDimensions;

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          archetype: archetype.name,
          confidence: confidence
        };
      }
    });

    return bestMatch;
  }

  // Map short dimension names to full names
  mapDimensionName(shortName) {
    const mapping = {
      'skill': 'skillLevel',
      'social': 'socialness',
      'luxury': 'luxuryLevel',
      'tradition': 'traditionalism',
      'competitive': 'competitiveness',
      'amenity': 'amenityImportance',
      'pace': 'pace'
    };
    return mapping[shortName] || shortName;
  }

  // Check if two archetypes are compatible
  areCompatibleArchetypes(archetype1, archetype2) {
    const compatibilityMatrix = {
      'social_beginner': ['casual_weekend', 'luxury_social'],
      'traditional_serious': ['competitive_solo'],
      'luxury_social': ['social_beginner', 'casual_weekend'],
      'competitive_solo': ['traditional_serious'],
      'casual_weekend': ['social_beginner', 'luxury_social']
    };

    return compatibilityMatrix[archetype1]?.includes(archetype2) || false;
  }

  // Debug similarity calculation
  debugSimilarityCalculation(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    console.log('🔍 Debug similarity calculation:');
    console.log('👤 User 1 scores:', scores1);
    console.log('👤 User 2 scores:', scores2);

    let totalSimilarity = 0;
    let dimensionCount = 0;

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      const diff = Math.abs(val1 - val2);
      const dimSimilarity = 1 - (diff / 10);

      console.log(`  ${dim}: ${val1} vs ${val2} = ${dimSimilarity.toFixed(3)} similarity`);

      totalSimilarity += dimSimilarity;
      dimensionCount++;
    });

    const avgSimilarity = totalSimilarity / dimensionCount;
    console.log(`📊 Average similarity: ${avgSimilarity.toFixed(3)}`);

    const weightedSimilarity = this.weightedEuclideanSimilarity(scores1, scores2);
    console.log(`⚖️ Weighted similarity: ${weightedSimilarity.toFixed(3)}`);

    return weightedSimilarity;
  }

  // Apply diversity filtering to avoid echo chambers
  applyDiversityFilter(similarities, diversityFactor) {
    if (similarities.length <= 3) return similarities;

    const diverseResults = [similarities[0]]; // Always include most similar
    const remaining = similarities.slice(1);

    while (diverseResults.length < similarities.length && remaining.length > 0) {
      let bestCandidate = null;
      let bestScore = -1;

      for (const candidate of remaining) {
        // Calculate diversity score (how different from already selected)
        let diversityScore = 0;

        for (const selected of diverseResults) {
          const diversity = 1 - this.calculateSimilarity(
            candidate.scores,
            selected.scores,
            'weighted_euclidean'
          );
          diversityScore += diversity;
        }

        diversityScore /= diverseResults.length;

        // Combined score: similarity + diversity
        const combinedScore =
          candidate.similarity * (1 - diversityFactor) +
          diversityScore * diversityFactor;

        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        diverseResults.push(bestCandidate);
        remaining.splice(remaining.indexOf(bestCandidate), 1);
      } else {
        break;
      }
    }

    return diverseResults;
  }

  // Calculate dimension weights based on golf profiling importance
  calculateDimensionWeights() {
    return {
      skillLevel: 1.5,      // Very important for course recommendations
      socialness: 1.2,      // Important for experience type
      traditionalism: 1.3,   // Important for course style
      luxuryLevel: 1.4,     // Important for pricing/amenities
      competitiveness: 1.1,  // Moderately important
      ageGeneration: 0.8,    // Less important, more variable
      amenityImportance: 1.3, // Important for facility recommendations
      pace: 0.9,            // Somewhat important
      genderLean: 0.7       // Less critical for recommendations
    };
  }

  // Specialized similarity for specific recommendation types
  calculateCourseSimilarity(scores1, scores2) {
    // Weight dimensions that matter most for course selection
    const courseWeights = {
      skillLevel: 2.0,
      traditionalism: 1.8,
      luxuryLevel: 1.6,
      competitiveness: 1.2,
      amenityImportance: 1.4
    };

    let sumSquaredDiffs = 0;
    let totalWeight = 0;

    Object.entries(courseWeights).forEach(([dim, weight]) => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      const diff = (val1 - val2) / 10;

      sumSquaredDiffs += weight * (diff * diff);
      totalWeight += weight;
    });

    const distance = Math.sqrt(sumSquaredDiffs / totalWeight);
    return Math.max(0, 1 - distance);
  }

  calculateSocialSimilarity(scores1, scores2) {
    // Weight dimensions that matter for social/group recommendations
    const socialWeights = {
      socialness: 2.0,
      competitiveness: 1.5,
      pace: 1.3,
      ageGeneration: 1.1,
      traditionalism: 0.8
    };

    let sumSquaredDiffs = 0;
    let totalWeight = 0;

    Object.entries(socialWeights).forEach(([dim, weight]) => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      const diff = (val1 - val2) / 10;

      sumSquaredDiffs += weight * (diff * diff);
      totalWeight += weight;
    });

    const distance = Math.sqrt(sumSquaredDiffs / totalWeight);
    return Math.max(0, 1 - distance);
  }

  // Clustering for market segmentation
  performClustering(profiles, numClusters = 5) {
    if (profiles.length < numClusters) return null;

    // Simple k-means clustering implementation
    let centroids = this.initializeCentroids(profiles, numClusters);
    let assignments = new Array(profiles.length);
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;

    while (changed && iterations < maxIterations) {
      changed = false;

      // Assign each profile to nearest centroid
      for (let i = 0; i < profiles.length; i++) {
        let minDistance = Infinity;
        let bestCluster = 0;

        for (let j = 0; j < centroids.length; j++) {
          const distance = 1 - this.calculateSimilarity(
            profiles[i].scores,
            centroids[j],
            'weighted_euclidean'
          );

          if (distance < minDistance) {
            minDistance = distance;
            bestCluster = j;
          }
        }

        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      // Update centroids
      centroids = this.updateCentroids(profiles, assignments, numClusters);
      iterations++;
    }

    return {
      assignments,
      centroids,
      clusters: this.groupProfilesByClusters(profiles, assignments, numClusters)
    };
  }

  initializeCentroids(profiles, numClusters) {
    const centroids = [];
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;

    for (let i = 0; i < numClusters; i++) {
      const centroid = {};
      dimensions.forEach(dim => {
        // Initialize with random values from the data range
        const values = profiles.map(p => p.scores[dim] || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        centroid[dim] = min + Math.random() * (max - min);
      });
      centroids.push(centroid);
    }

    return centroids;
  }

  updateCentroids(profiles, assignments, numClusters) {
    const centroids = [];
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;

    for (let cluster = 0; cluster < numClusters; cluster++) {
      const clusterProfiles = profiles.filter((_, i) => assignments[i] === cluster);

      if (clusterProfiles.length === 0) {
        // Keep the old centroid if no profiles assigned
        centroids.push(centroids[cluster] || {});
        continue;
      }

      const centroid = {};
      dimensions.forEach(dim => {
        const sum = clusterProfiles.reduce((acc, p) => acc + (p.scores[dim] || 0), 0);
        centroid[dim] = sum / clusterProfiles.length;
      });

      centroids.push(centroid);
    }

    return centroids;
  }

  groupProfilesByClusters(profiles, assignments, numClusters) {
    const clusters = Array.from({ length: numClusters }, () => []);

    profiles.forEach((profile, i) => {
      clusters[assignments[i]].push(profile);
    });

    return clusters;
  }

  // Similarity explanation for debugging/transparency
  explainSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    const explanation = {
      overallSimilarity: this.calculateSimilarity(scores1, scores2),
      dimensionBreakdown: {},
      strongestMatches: [],
      biggestDifferences: []
    };

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      const diff = Math.abs(val1 - val2);
      const similarity = 1 - (diff / 10);

      explanation.dimensionBreakdown[dim] = {
        user1: val1,
        user2: val2,
        difference: diff,
        similarity: similarity
      };

      if (similarity > 0.8) {
        explanation.strongestMatches.push({ dimension: dim, similarity });
      }
      if (similarity < 0.3) {
        explanation.biggestDifferences.push({ dimension: dim, difference: diff });
      }
    });

    explanation.strongestMatches.sort((a, b) => b.similarity - a.similarity);
    explanation.biggestDifferences.sort((a, b) => b.difference - a.difference);

    return explanation;
  }
  // Find all users above threshold

  // Find all users above threshold

  // Find all users above threshold
}
  applyDiversityFilter(similarities, diversityFactor) {
    if (similarities.length <= 3) return similarities;

    const diverseResults = [similarities[0]]; // Always include most similar
    const remaining = similarities.slice(1);

    while (diverseResults.length < similarities.length && remaining.length > 0) {
      let bestCandidate = null;
      let bestScore = -1;

      for (const candidate of remaining) {
        // Calculate diversity score (how different from already selected)
        let diversityScore = 0;

        for (const selected of diverseResults) {
          const diversity = 1 - this.calculateSimilarity(
            candidate.scores,
            selected.scores,
            'weighted_euclidean'
          );
          diversityScore += diversity;
        }

        diversityScore /= diverseResults.length;

        // Combined score: similarity + diversity
        const combinedScore =
          candidate.similarity * (1 - diversityFactor) +
          diversityScore * diversityFactor;

        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        diverseResults.push(bestCandidate);
        remaining.splice(remaining.indexOf(bestCandidate), 1);
      } else {
        break;
      }
    }

    return diverseResults;
  }
}
  applyDiversityFilter(similarities, diversityFactor) {
    if (similarities.length <= 3) return similarities;

    const diverseResults = [similarities[0]]; // Always include most similar
    const remaining = similarities.slice(1);

    while (diverseResults.length < similarities.length && remaining.length > 0) {
      let bestCandidate = null;
      let bestScore = -1;

      for (const candidate of remaining) {
        // Calculate diversity score (how different from already selected)
        let diversityScore = 0;

        for (const selected of diverseResults) {
          const diversity = 1 - this.calculateSimilarity(
            candidate.scores,
            selected.scores,
            'weighted_euclidean'
          );
          diversityScore += diversity;
        }

        diversityScore /= diverseResults.length;

        // Combined score: similarity + diversity
        const combinedScore =
          candidate.similarity * (1 - diversityFactor) +
          diversityScore * diversityFactor;

        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        diverseResults.push(bestCandidate);
        remaining.splice(remaining.indexOf(bestCandidate), 1);
      } else {
        break;
      }
    }

    return diverseResults;
  }
}

export default SimilarityCalculator;