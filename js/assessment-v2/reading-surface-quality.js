import { materializeItemModel } from './materialize.js';

function normalize(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-zçğıöşü0-9\s]/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(value) {
  return normalize(value).split(' ').filter(Boolean);
}

function trigrams(value) {
  const list = words(value);
  const out = new Set();
  for (let i = 0; i <= list.length - 3; i += 1) out.add(list.slice(i, i + 3).join(' '));
  return out;
}

function jaccard(left, right) {
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / union.size;
}

function contentOverlap(left, right) {
  const stop = new Set(['bir', 'bu', 've', 'ile', 'de', 'da', 'için', 'ancak', 'gibi', 'daha', 'ise', 'olarak', 'olan', 'olduğu', 'olur']);
  const a = new Set(words(left).filter(word => word.length > 3 && !stop.has(word)));
  const b = new Set(words(right).filter(word => word.length > 3 && !stop.has(word)));
  if (!b.size) return 0;
  let shared = 0;
  for (const word of b) if (a.has(word)) shared += 1;
  return shared / b.size;
}

export function auditReadingSurfaceModels(models) {
  const errors = [];
  const samples = models.map(model => {
    const task = model.generateTask({});
    const item = materializeItemModel(model, {});
    const profile = task.surfaceProfile || {};
    const optionTexts = [item.answerText, ...item.distractors.map(d => d.text)];
    const lengths = optionTexts.map(text => words(text).length);
    const answerLength = lengths[0];
    const maxLength = Math.max(...lengths);
    const passageWordCount = words(item.context).length;
    const overlap = contentOverlap(item.context, item.answerText);

    if (task.options.length !== 5) errors.push(`${model.id}:five_options_required`);
    if (item.distractors.length !== 4) errors.push(`${model.id}:four_distinct_distractors_required`);
    if (!profile.genre || !profile.voice || !profile.sourceMode || !profile.stemFamily) errors.push(`${model.id}:surface_profile_incomplete`);
    if (!Array.isArray(profile.rhetoricalMoves) || profile.rhetoricalMoves.length < 2) errors.push(`${model.id}:rhetorical_moves_too_shallow`);
    if (passageWordCount < 35 || passageWordCount > 150) errors.push(`${model.id}:passage_word_count:${passageWordCount}`);
    if (overlap > 0.72) errors.push(`${model.id}:answer_copies_passage:${overlap.toFixed(2)}`);
    for (let i = 1; i < lengths.length; i += 1) {
      const ratio = lengths[i] / Math.max(answerLength, 1);
      if (ratio < 0.38 || ratio > 2.25) errors.push(`${model.id}:option_length_outlier:${i}:${ratio.toFixed(2)}`);
    }

    return {
      modelId: model.id,
      genre: profile.genre,
      voice: profile.voice,
      sourceMode: profile.sourceMode,
      stemFamily: profile.stemFamily,
      rhetoricalMoves: profile.rhetoricalMoves,
      context: item.context,
      prompt: item.prompt,
      passageWordCount,
      answerWordCount: answerLength,
      answerIsLongest: answerLength === maxLength,
      answerPassageOverlap: Number(overlap.toFixed(3)),
      trigramSet: trigrams(item.context)
    };
  });

  const genres = new Set(samples.map(row => row.genre));
  const voices = new Set(samples.map(row => row.voice));
  const sourceModes = new Set(samples.map(row => row.sourceMode));
  const stemFamilies = new Set(samples.map(row => row.stemFamily));
  if (genres.size < 8) errors.push(`catalog:genre_diversity:${genres.size}`);
  if (voices.size < 7) errors.push(`catalog:voice_diversity:${voices.size}`);
  if (sourceModes.size < 8) errors.push(`catalog:source_mode_diversity:${sourceModes.size}`);
  if (stemFamilies.size < 10) errors.push(`catalog:stem_diversity:${stemFamilies.size}`);

  const dataHeavyCount = samples.filter(row => /araştırma/.test(row.sourceMode)).length;
  if (dataHeavyCount > 3) errors.push(`catalog:too_many_research_frames:${dataHeavyCount}`);

  const forbiddenFrames = [
    /belediyesi[^.]{0,80}ölçtü/iu,
    /uzmanlar[^.]{0,100}belirtti/iu,
    /bu dönemde[^.]{0,100}arttı/iu,
    /notları ise araştırılmadı/iu,
    /aynı sokakta[^.]{0,100}ortalama/iu
  ];
  const rejectedDraftLeakTerms = [
    'okur mektuplarının sayısı',
    'akgöl',
    'gölgedeki kaldırımlar',
    'uzatılan saatler',
    'aralıklı tekrar',
    'yerel tohum arşivi'
  ];
  for (const model of models) {
    const item = materializeItemModel(model, {});
    const completeSurface = normalize([
      item.context,
      item.prompt,
      item.answerText,
      ...item.distractors.flatMap(row => [row.text, row.feedback]),
      ...item.hints,
      ...item.solution.map(row => row.explanation)
    ].join(' '));
    for (const frame of forbiddenFrames) {
      if (frame.test(item.context)) errors.push(`${model.id}:forbidden-ai-frame:${frame.source}`);
    }
    for (const term of rejectedDraftLeakTerms) {
      if (completeSurface.includes(normalize(term))) errors.push(`${model.id}:rejected-draft-leak:${term}`);
    }
  }

  let maxSimilarity = 0;
  let mostSimilarPair = [];
  for (let i = 0; i < samples.length; i += 1) {
    for (let j = i + 1; j < samples.length; j += 1) {
      const score = jaccard(samples[i].trigramSet, samples[j].trigramSet);
      if (score > maxSimilarity) {
        maxSimilarity = score;
        mostSimilarPair = [samples[i].modelId, samples[j].modelId];
      }
      if (score > 0.16) errors.push(`catalog:template_similarity:${samples[i].modelId}:${samples[j].modelId}:${score.toFixed(3)}`);
    }
  }

  const longestAnswerRate = samples.filter(row => row.answerIsLongest).length / samples.length;
  if (longestAnswerRate > 0.58) errors.push(`catalog:correct_answer_length_cue:${longestAnswerRate.toFixed(2)}`);

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      modelCount: samples.length,
      genreCount: genres.size,
      voiceCount: voices.size,
      sourceModeCount: sourceModes.size,
      stemFamilyCount: stemFamilies.size,
      dataHeavyCount,
      longestAnswerRate: Number(longestAnswerRate.toFixed(3)),
      maxTrigramSimilarity: Number(maxSimilarity.toFixed(3)),
      mostSimilarPair: Object.freeze(mostSimilarPair)
    }),
    samples: Object.freeze(samples.map(({ trigramSet, ...row }) => Object.freeze(row)))
  });
}
