// SimilarityCalculator.js - Advanced similarity calculations
import { ML_CONFIG } from './MLConfig.js';

export class SimilarityCalculator {
  constructor() {
    this.weights = this.calculateDimensionWeights();
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
      threshold = ML_CONFIG.SIMILARITY_THRESHOLD,
      maxResults = ML_CONFIG.MAX_SIMILAR_PROFILES,
      minResults = ML_CONFIG.MIN_SIMILAR_PROFILES,
      diversityFactor = 0.1 // 0-1, higher = more diverse results
    } = options;

    // Calculate similarities
    let similarities = allProfiles.map(profile => ({
      ...profile,
      similarity: this.calculateSimilarity(targetScores, profile.scores, algorithm)
    }));

    // Filter by threshold
    similarities = similarities.filter(p => p.similarity >= threshold);

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Apply diversity filtering if requested
    if (diversityFactor > 0 && similarities.length > minResults) {
      similarities = this.applyDiversityFilter(similarities, diversityFactor);
    }

    // Limit results
    return similarities.slice(0, maxResults);
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
}

export default SimilarityCalculator;
