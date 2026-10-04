export type OldHousePredictionReflection = 'keep' | 'adjust'

export type OldHousePredictionRecord = {
  predictionId?: string
  evidenceIds: string[]
  revealed: boolean
  reflection?: OldHousePredictionReflection
}

/** Only information already read may be put in a prediction's basisIds. */
export type OldHousePredictionCase = {
  predictions: ReadonlyArray<{ id: string; basisIds: readonly string[] }>
  evidence: ReadonlyArray<{ id: string }>
}

export type OldHousePredictionAssessment = {
  hasPrediction: boolean
  hasRelevantEvidence: boolean
  supported: boolean
  feedback: string
}

export function createPredictionRecord(): OldHousePredictionRecord {
  return { evidenceIds: [], revealed: false }
}

function copyRecord(record: OldHousePredictionRecord): OldHousePredictionRecord {
  return { ...record, evidenceIds: [...record.evidenceIds] }
}

/**
 * A child may change a prediction before reading on, while keeping their
 * selected clues. After reading on, preserve what they originally thought;
 * use createPredictionRecord() when they explicitly choose to try again.
 */
export function selectPrediction(record: OldHousePredictionRecord, predictionId: string): OldHousePredictionRecord {
  if (record.revealed || !predictionId.trim()) return copyRecord(record)
  return { predictionId, evidenceIds: [...record.evidenceIds], revealed: false }
}

export function togglePredictionEvidence(record: OldHousePredictionRecord, evidenceId: string): OldHousePredictionRecord {
  if (record.revealed || !evidenceId.trim()) return copyRecord(record)
  const evidenceIds = record.evidenceIds.includes(evidenceId)
    ? record.evidenceIds.filter(id => id !== evidenceId)
    : [...record.evidenceIds, evidenceId]
  return { predictionId: record.predictionId, evidenceIds, revealed: false }
}

/** Reading on is always available; neither guessing nor choosing a clue is compulsory. */
export function revealPrediction(record: OldHousePredictionRecord): OldHousePredictionRecord {
  return { ...copyRecord(record), revealed: true }
}

export function reflectPrediction(record: OldHousePredictionRecord, reflection: OldHousePredictionReflection): OldHousePredictionRecord {
  if (!record.revealed) return copyRecord(record)
  return { ...copyRecord(record), reflection }
}

/**
 * Assess the connection between a prediction and an already-read clue.
 * The author's outcome deliberately is not an input: a reasonable prediction
 * does not become wrong merely because the author writes something different.
 */
export function assessPrediction(record: OldHousePredictionRecord, predictionCase: OldHousePredictionCase): OldHousePredictionAssessment {
  const prediction = predictionCase.predictions.find(item => item.id === record.predictionId)
  const knownEvidenceIds = new Set(predictionCase.evidence.map(item => item.id))
  const validEvidenceIds = record.evidenceIds.filter(id => knownEvidenceIds.has(id))
  const hasPrediction = Boolean(prediction)
  const hasRelevantEvidence = Boolean(prediction && validEvidenceIds.some(id => prediction.basisIds.includes(id)))
  const supported = hasPrediction && hasRelevantEvidence
  let feedback: string

  if (!hasPrediction) {
    feedback = record.revealed
      ? '已经读到了作者的安排。回头看看，前面哪些线索帮助你理解了这一步？'
      : validEvidenceIds.length > 0
        ? '你找到了已读线索。试着说说它让你想到什么；也可以直接往下读。'
        : '可以先想想接下来会怎样，也可以直接往下读，再回头找线索。'
  } else if (supported) {
    feedback = record.revealed
      ? '你的预测有已读线索支持。与作者的安排不同也没关系；说说你想保留还是调整哪一点。'
      : '你的预测有已读线索支持。往下读，看看作者怎样安排，再比较自己的想法。'
  } else if (validEvidenceIds.length === 0) {
    feedback = record.revealed
      ? '保留你刚才的预测。回头找找已读线索，想想当时为什么这样猜。'
      : '这是你的预测。选一条已读线索，或口头说说你为什么这样想。'
  } else {
    feedback = record.revealed
      ? '保留你刚才的想法。回头解释所选线索怎样支持它；需要时可以调整预测的理由。'
      : '试着解释这条线索怎样支持你的预测，也可以选一条联系更直接的线索。'
  }

  return { hasPrediction, hasRelevantEvidence, supported, feedback }
}
