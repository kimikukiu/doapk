// ==================== REAL AI/ML IMPLEMENTATIONS ====================
// Ported from MGL, clml, antik concepts
// Real: Neural Network (backprop), K-Means, Naive Bayes, Decision Tree, KNN, Linear Regression, PCA, Perceptron

import { lispDefineJs } from './lispService';

// ==================== NEURAL NETWORK (Real Backpropagation) ====================
class NeuralNetwork {
  layers: number[];
  weights: number[][][];
  biases: number[][];
  lr: number;

  constructor(layers: number[], lr: number = 0.1) {
    this.layers = layers;
    this.lr = lr;
    this.weights = [];
    this.biases = [];
    for (let i = 1; i < layers.length; i++) {
      this.weights.push(Array.from({ length: layers[i] }, () =>
        Array.from({ length: layers[i - 1] }, () => (Math.random() - 0.5) * 2)
      ));
      this.biases.push(Array.from({ length: layers[i] }, () => (Math.random() - 0.5) * 2));
    }
  }

  sigmoid(x: number): number { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))); }
  sigmoidDeriv(x: number): number { return x * (1 - x); }

  forward(input: number[]): number[][] {
    const activations: number[][] = [input];
    let current = input;
    for (let l = 0; l < this.weights.length; l++) {
      const next: number[] = [];
      for (let j = 0; j < this.weights[l].length; j++) {
        let sum = this.biases[l][j];
        for (let k = 0; k < current.length; k++) sum += current[k] * this.weights[l][j][k];
        next.push(this.sigmoid(sum));
      }
      current = next;
      activations.push(current);
    }
    return activations;
  }

  train(input: number[], target: number[]): number {
    const activations = this.forward(input);
    const output = activations[activations.length - 1];

    // Calculate output layer error
    const errors: number[][] = [];
    const outputError = output.map((o, i) => (target[i] - o) * this.sigmoidDeriv(o));
    errors.unshift(outputError);

    // Backpropagate errors
    for (let l = this.weights.length - 1; l > 0; l--) {
      const layerError: number[] = [];
      for (let j = 0; j < this.weights[l - 1].length; j++) {
        let err = 0;
        for (let k = 0; k < this.weights[l].length; k++) {
          err += errors[0][k] * this.weights[l][k][j];
        }
        layerError.push(err * this.sigmoidDeriv(activations[l][j]));
      }
      errors.unshift(layerError);
    }

    // Update weights and biases
    for (let l = 0; l < this.weights.length; l++) {
      for (let j = 0; j < this.weights[l].length; j++) {
        for (let k = 0; k < this.weights[l][j].length; k++) {
          this.weights[l][j][k] += this.lr * errors[l][j] * activations[l][k];
        }
        this.biases[l][j] += this.lr * errors[l][j];
      }
    }

    // Return MSE
    return output.reduce((s, o, i) => s + (target[i] - o) ** 2, 0) / output.length;
  }

  predict(input: number[]): number[] {
    const activations = this.forward(input);
    return activations[activations.length - 1];
  }

  serialize(): string {
    return JSON.stringify({ layers: this.layers, weights: this.weights, biases: this.biases, lr: this.lr });
  }

  static deserialize(json: string): NeuralNetwork {
    const data = JSON.parse(json);
    const nn = new NeuralNetwork(data.layers, data.lr);
    nn.weights = data.weights;
    nn.biases = data.biases;
    return nn;
  }
}

// ==================== K-MEANS CLUSTERING ====================
function kMeans(data: number[][], k: number, maxIter: number = 100): { centroids: number[][]; assignments: number[]; iterations: number } {
  const dim = data[0].length;
  // Initialize centroids randomly from data points
  const indices = new Set<number>();
  while (indices.size < k) indices.add(Math.floor(Math.random() * data.length));
  let centroids = Array.from(indices).map(i => [...data[i]]);
  let assignments = new Array(data.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign points to nearest centroid
    const newAssignments = data.map(point => {
      let minDist = Infinity, minIdx = 0;
      centroids.forEach((c, ci) => {
        const dist = Math.sqrt(point.reduce((s, v, d) => s + (v - c[d]) ** 2, 0));
        if (dist < minDist) { minDist = dist; minIdx = ci; }
      });
      return minIdx;
    });

    // Check convergence
    if (newAssignments.every((a, i) => a === assignments[i])) {
      return { centroids, assignments: newAssignments, iterations: iter + 1 };
    }
    assignments = newAssignments;

    // Update centroids
    centroids = Array.from({ length: k }, (_, ci) => {
      const clusterPoints = data.filter((_, i) => assignments[i] === ci);
      if (clusterPoints.length === 0) return centroids[ci];
      return Array.from({ length: dim }, (_, d) =>
        clusterPoints.reduce((s, p) => s + p[d], 0) / clusterPoints.length
      );
    });
  }
  return { centroids, assignments, iterations: maxIter };
}

// ==================== NAIVE BAYES CLASSIFIER ====================
class NaiveBayes {
  classes: Map<string, { count: number; featureSums: number[][]; featureSqSums: number[][] }> = new Map();
  totalSamples = 0;

  train(features: number[], label: string): void {
    if (!this.classes.has(label)) {
      this.classes.set(label, { count: 0, featureSums: [features.map(() => 0), features.map(() => 0)], featureSqSums: [features.map(() => 0), features.map(() => 0)] });
    }
    const cls = this.classes.get(label)!;
    cls.count++;
    this.totalSamples++;
    features.forEach((f, i) => {
      if (!cls.featureSums[0][i]) cls.featureSums[0][i] = 0;
      if (!cls.featureSqSums[0][i]) cls.featureSqSums[0][i] = 0;
      cls.featureSums[0][i] += f;
      cls.featureSqSums[0][i] += f * f;
    });
  }

  predict(features: number[]): { label: string; probability: number } {
    let bestLabel = '', bestProb = -Infinity;
    this.classes.forEach((cls, label) => {
      let logProb = Math.log(cls.count / this.totalSamples);
      features.forEach((f, i) => {
        const mean = (cls.featureSums[0][i] || 0) / cls.count;
        const variance = Math.max(0.0001, ((cls.featureSqSums[0][i] || 0) / cls.count) - mean * mean);
        // Gaussian probability
        logProb += -0.5 * Math.log(2 * Math.PI * variance) - ((f - mean) ** 2) / (2 * variance);
      });
      if (logProb > bestProb) { bestProb = logProb; bestLabel = label; }
    });
    return { label: bestLabel, probability: Math.exp(bestProb) };
  }
}

// ==================== DECISION TREE ====================
interface TreeNode {
  feature?: number;
  threshold?: number;
  label?: string;
  left?: TreeNode;
  right?: TreeNode;
}

function buildDecisionTree(data: { features: number[]; label: string }[], depth: number = 0, maxDepth: number = 10): TreeNode {
  const labels = data.map(d => d.label);
  const uniqueLabels = [...new Set(labels)];
  if (uniqueLabels.length === 1 || depth >= maxDepth || data.length < 2) {
    // Majority vote
    const counts: Record<string, number> = {};
    labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
    return { label: Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] };
  }

  // Find best split
  let bestFeature = 0, bestThreshold = 0, bestGini = Infinity;
  const numFeatures = data[0].features.length;

  for (let f = 0; f < numFeatures; f++) {
    const values = [...new Set(data.map(d => d.features[f]))].sort((a, b) => a - b);
    for (let i = 0; i < values.length - 1; i++) {
      const threshold = (values[i] + values[i + 1]) / 2;
      const left = data.filter(d => d.features[f] <= threshold);
      const right = data.filter(d => d.features[f] > threshold);
      if (left.length === 0 || right.length === 0) continue;

      const giniLeft = 1 - [...new Set(left.map(d => d.label))].reduce((s, l) => {
        const p = left.filter(d => d.label === l).length / left.length;
        return s + p * p;
      }, 0);
      const giniRight = 1 - [...new Set(right.map(d => d.label))].reduce((s, l) => {
        const p = right.filter(d => d.label === l).length / right.length;
        return s + p * p;
      }, 0);
      const gini = (left.length * giniLeft + right.length * giniRight) / data.length;

      if (gini < bestGini) {
        bestGini = gini;
        bestFeature = f;
        bestThreshold = threshold;
      }
    }
  }

  if (bestGini === Infinity) {
    const counts: Record<string, number> = {};
    labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
    return { label: Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] };
  }

  const left = data.filter(d => d.features[bestFeature] <= bestThreshold);
  const right = data.filter(d => d.features[bestFeature] > bestThreshold);

  return {
    feature: bestFeature,
    threshold: bestThreshold,
    left: buildDecisionTree(left, depth + 1, maxDepth),
    right: buildDecisionTree(right, depth + 1, maxDepth)
  };
}

function predictTree(node: TreeNode, features: number[]): string {
  if (node.label !== undefined) return node.label;
  if (features[node.feature!] <= node.threshold!) return predictTree(node.left!, features);
  return predictTree(node.right!, features);
}

// ==================== KNN (K-Nearest Neighbors) ====================
function knn(trainData: { features: number[]; label: string }[], query: number[], k: number): string {
  const distances = trainData.map(d => ({
    label: d.label,
    dist: Math.sqrt(d.features.reduce((s, f, i) => s + (f - query[i]) ** 2, 0))
  })).sort((a, b) => a.dist - b.dist).slice(0, k);

  const votes: Record<string, number> = {};
  distances.forEach(d => votes[d.label] = (votes[d.label] || 0) + 1);
  return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
}

// ==================== PCA (Principal Component Analysis) ====================
function pca(data: number[][], components: number): { transformed: number[][]; eigenvalues: number[] } {
  const n = data.length, m = data[0].length;
  // Center data
  const means = Array.from({ length: m }, (_, j) => data.reduce((s, r) => s + r[j], 0) / n);
  const centered = data.map(row => row.map((v, j) => v - means[j]));
  // Covariance matrix
  const cov: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = i; j < m; j++) {
      const val = centered.reduce((s, row) => s + row[i] * row[j], 0) / (n - 1);
      cov[i][j] = val;
      cov[j][i] = val;
    }
  }
  // Power iteration for eigenvectors (simplified)
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];
  const workCov = cov.map(r => [...r]);

  for (let c = 0; c < components; c++) {
    let v = Array.from({ length: m }, () => Math.random());
    let eigenvalue = 0;
    for (let iter = 0; iter < 100; iter++) {
      const newV = Array(m).fill(0);
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) newV[i] += workCov[i][j] * v[j];
      eigenvalue = Math.sqrt(newV.reduce((s, x) => s + x * x, 0));
      if (eigenvalue === 0) break;
      v = newV.map(x => x / eigenvalue);
    }
    eigenvalues.push(eigenvalue);
    eigenvectors.push(v);
    // Deflate
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) workCov[i][j] -= eigenvalue * v[i] * v[j];
  }

  // Project
  const transformed = centered.map(row =>
    eigenvectors.map(ev => row.reduce((s, v, i) => s + v * ev[i], 0))
  );
  return { transformed, eigenvalues };
}

// ==================== REGISTER ALL ML FUNCTIONS ====================
const networks: Map<string, NeuralNetwork> = new Map();
const bayesModels: Map<string, NaiveBayes> = new Map();
const treeModels: Map<string, TreeNode> = new Map();
const knnDatasets: Map<string, { features: number[]; label: string }[]> = new Map();

export function registerAiMlModule(): void {
  // Neural Network
  lispDefineJs('nn/create', (name: string, layersStr: string, lr?: number) => {
    const layers = layersStr.split(',').map(Number);
    networks.set(name, new NeuralNetwork(layers, lr || 0.1));
    return `Neural network "${name}" created: ${layers.join(' -> ')} (lr=${lr || 0.1})`;
  });

  lispDefineJs('nn/train', (name: string, inputStr: string, targetStr: string) => {
    const nn = networks.get(name);
    if (!nn) return 'ERROR: Network not found';
    const input = inputStr.split(',').map(Number);
    const target = targetStr.split(',').map(Number);
    const loss = nn.train(input, target);
    return loss;
  });

  lispDefineJs('nn/train-batch', (name: string, dataJson: string, epochs?: number) => {
    const nn = networks.get(name);
    if (!nn) return 'ERROR: Network not found';
    const data: { input: number[]; target: number[] }[] = JSON.parse(dataJson);
    const ep = epochs || 100;
    let lastLoss = 0;
    for (let e = 0; e < ep; e++) {
      let totalLoss = 0;
      for (const d of data) totalLoss += nn.train(d.input, d.target);
      lastLoss = totalLoss / data.length;
    }
    return `Trained ${ep} epochs, final loss: ${lastLoss.toFixed(6)}`;
  });

  lispDefineJs('nn/predict', (name: string, inputStr: string) => {
    const nn = networks.get(name);
    if (!nn) return 'ERROR: Network not found';
    return nn.predict(inputStr.split(',').map(Number)).map(v => v.toFixed(6)).join(',');
  });

  lispDefineJs('nn/save', (name: string) => {
    const nn = networks.get(name);
    return nn ? nn.serialize() : 'ERROR: Network not found';
  });

  lispDefineJs('nn/load', (name: string, json: string) => {
    networks.set(name, NeuralNetwork.deserialize(json));
    return `Network "${name}" loaded`;
  });

  // K-Means
  lispDefineJs('ml/kmeans', (dataJson: string, k: number, maxIter?: number) => {
    const data: number[][] = JSON.parse(dataJson);
    const result = kMeans(data, k, maxIter || 100);
    return JSON.stringify(result);
  });

  // Naive Bayes
  lispDefineJs('ml/bayes-create', (name: string) => {
    bayesModels.set(name, new NaiveBayes());
    return `Naive Bayes model "${name}" created`;
  });

  lispDefineJs('ml/bayes-train', (name: string, featuresStr: string, label: string) => {
    const model = bayesModels.get(name);
    if (!model) return 'ERROR: Model not found';
    model.train(featuresStr.split(',').map(Number), label);
    return `Trained with label "${label}"`;
  });

  lispDefineJs('ml/bayes-predict', (name: string, featuresStr: string) => {
    const model = bayesModels.get(name);
    if (!model) return 'ERROR: Model not found';
    const result = model.predict(featuresStr.split(',').map(Number));
    return JSON.stringify(result);
  });

  // Decision Tree
  lispDefineJs('ml/tree-train', (name: string, dataJson: string, maxDepth?: number) => {
    const data: { features: number[]; label: string }[] = JSON.parse(dataJson);
    treeModels.set(name, buildDecisionTree(data, 0, maxDepth || 10));
    return `Decision tree "${name}" trained on ${data.length} samples`;
  });

  lispDefineJs('ml/tree-predict', (name: string, featuresStr: string) => {
    const tree = treeModels.get(name);
    if (!tree) return 'ERROR: Tree not found';
    return predictTree(tree, featuresStr.split(',').map(Number));
  });

  // KNN
  lispDefineJs('ml/knn-load', (name: string, dataJson: string) => {
    knnDatasets.set(name, JSON.parse(dataJson));
    return `KNN dataset "${name}" loaded`;
  });

  lispDefineJs('ml/knn-predict', (name: string, featuresStr: string, k?: number) => {
    const dataset = knnDatasets.get(name);
    if (!dataset) return 'ERROR: Dataset not found';
    return knn(dataset, featuresStr.split(',').map(Number), k || 3);
  });

  // PCA
  lispDefineJs('ml/pca', (dataJson: string, components?: number) => {
    const data: number[][] = JSON.parse(dataJson);
    const result = pca(data, components || 2);
    return JSON.stringify({ transformed: result.transformed.map(r => r.map(v => parseFloat(v.toFixed(6)))), eigenvalues: result.eigenvalues.map(v => parseFloat(v.toFixed(6))) });
  });

  // Linear Regression (real OLS)
  lispDefineJs('ml/linreg', (xsJson: string, ysStr: string) => {
    const xs: number[][] = JSON.parse(xsJson);
    const ys = ysStr.split(',').map(Number);
    const n = xs.length, m = xs[0].length;
    // Add bias column
    const X = xs.map(row => [1, ...row]);
    // Normal equation: w = (X^T X)^-1 X^T y
    // X^T X
    const XtX: number[][] = Array.from({ length: m + 1 }, () => Array(m + 1).fill(0));
    for (let i = 0; i <= m; i++) for (let j = 0; j <= m; j++) for (let k = 0; k < n; k++) XtX[i][j] += X[k][i] * X[k][j];
    // X^T y
    const Xty: number[] = Array(m + 1).fill(0);
    for (let i = 0; i <= m; i++) for (let k = 0; k < n; k++) Xty[i] += X[k][i] * ys[k];
    // Solve via Gauss elimination
    const aug = XtX.map((row, i) => [...row, Xty[i]]);
    for (let i = 0; i <= m; i++) {
      let maxRow = i;
      for (let k = i + 1; k <= m; k++) if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
      [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
      if (Math.abs(aug[i][i]) < 1e-10) continue;
      for (let k = i + 1; k <= m; k++) {
        const f = aug[k][i] / aug[i][i];
        for (let j = i; j <= m + 1; j++) aug[k][j] -= f * aug[i][j];
      }
    }
    const w = Array(m + 1).fill(0);
    for (let i = m; i >= 0; i--) {
      w[i] = aug[i][m + 1];
      for (let j = i + 1; j <= m; j++) w[i] -= aug[i][j] * w[j];
      w[i] /= aug[i][i] || 1;
    }
    // R-squared
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
    const ssRes = ys.reduce((s, y, i) => {
      const pred = X[i].reduce((a, x, j) => a + x * w[j], 0);
      return s + (y - pred) ** 2;
    }, 0);
    const r2 = 1 - ssRes / (ssTot || 1);
    return JSON.stringify({ weights: w.map(v => parseFloat(v.toFixed(6))), bias: parseFloat(w[0].toFixed(6)), r_squared: parseFloat(r2.toFixed(6)) });
  });

  // Perceptron
  lispDefineJs('ml/perceptron-train', (dataJson: string, epochs?: number, lr?: number) => {
    const data: { features: number[]; label: number }[] = JSON.parse(dataJson);
    const m = data[0].features.length;
    const weights = Array(m).fill(0);
    let bias = 0;
    const rate = lr || 0.01;
    const ep = epochs || 100;
    for (let e = 0; e < ep; e++) {
      let errors = 0;
      for (const d of data) {
        const pred = d.features.reduce((s, f, i) => s + f * weights[i], bias) >= 0 ? 1 : 0;
        const err = d.label - pred;
        if (err !== 0) {
          errors++;
          d.features.forEach((f, i) => { weights[i] += rate * err * f; });
          bias += rate * err;
        }
      }
      if (errors === 0) return JSON.stringify({ weights: weights.map(w => parseFloat(w.toFixed(6))), bias: parseFloat(bias.toFixed(6)), converged_epoch: e + 1 });
    }
    return JSON.stringify({ weights: weights.map(w => parseFloat(w.toFixed(6))), bias: parseFloat(bias.toFixed(6)), converged_epoch: -1 });
  });

  // Confusion Matrix
  lispDefineJs('ml/confusion-matrix', (actualStr: string, predictedStr: string) => {
    const actual = actualStr.split(','), predicted = predictedStr.split(',');
    const labels = [...new Set([...actual, ...predicted])];
    const matrix: number[][] = labels.map(() => labels.map(() => 0));
    actual.forEach((a, i) => { matrix[labels.indexOf(a)][labels.indexOf(predicted[i])]++; });
    const accuracy = actual.filter((a, i) => a === predicted[i]).length / actual.length;
    return JSON.stringify({ labels, matrix, accuracy: parseFloat(accuracy.toFixed(4)) });
  });

  // Normalize data
  lispDefineJs('ml/normalize', (dataJson: string) => {
    const data: number[][] = JSON.parse(dataJson);
    const m = data[0].length;
    const mins = Array.from({ length: m }, (_, j) => Math.min(...data.map(r => r[j])));
    const maxs = Array.from({ length: m }, (_, j) => Math.max(...data.map(r => r[j])));
    const normalized = data.map(row => row.map((v, j) => maxs[j] === mins[j] ? 0 : (v - mins[j]) / (maxs[j] - mins[j])));
    return JSON.stringify(normalized);
  });

  // Train/Test split
  lispDefineJs('ml/train-test-split', (dataJson: string, ratio?: number) => {
    const data: any[] = JSON.parse(dataJson);
    const r = ratio || 0.8;
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const split = Math.floor(shuffled.length * r);
    return JSON.stringify({ train: shuffled.slice(0, split), test: shuffled.slice(split) });
  });
}
