const { WordTokenizer } = require("natural");

const tokenizer = new WordTokenizer();
let extractor;

const loadModel = async () => {
  if (!extractor) {
    const { pipeline } = await import("@xenova/transformers");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
};

const meanPooling = (tensorLike) => {
  const data = Array.from(tensorLike.data || []);
  if (!data.length) return [];

  const [tokens, dims] = tensorLike.dims;
  const out = new Array(dims).fill(0);

  for (let t = 0; t < tokens; t += 1) {
    for (let d = 0; d < dims; d += 1) {
      out[d] += data[t * dims + d];
    }
  }

  return out.map((v) => v / Math.max(tokens, 1));
};

const cosineSimilarity = (a, b) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const jaccardFallback = (textA, textB) => {
  const a = new Set(tokenizer.tokenize((textA || "").toLowerCase()));
  const b = new Set(tokenizer.tokenize((textB || "").toLowerCase()));
  const intersection = new Set([...a].filter((token) => b.has(token)));
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  return intersection.size / union.size;
};

const semanticSimilarity = async (textA, textB) => {
  try {
    const model = await loadModel();
    const aOut = await model(textA || "", { pooling: "none", normalize: true });
    const bOut = await model(textB || "", { pooling: "none", normalize: true });
    const a = meanPooling(aOut);
    const b = meanPooling(bOut);
    if (!a.length || !b.length) return jaccardFallback(textA, textB);
    return cosineSimilarity(a, b);
  } catch (error) {
    return jaccardFallback(textA, textB);
  }
};

module.exports = { semanticSimilarity };
