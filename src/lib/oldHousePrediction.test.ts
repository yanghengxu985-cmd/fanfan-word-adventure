import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assessPrediction,
  createPredictionRecord,
  reflectPrediction,
  revealPrediction,
  selectPrediction,
  togglePredictionEvidence,
  type OldHousePredictionCase,
} from './oldHousePrediction'

const predictionCase: OldHousePredictionCase = {
  predictions: [
    { id: 'wait', basisIds: ['shelter', 'kind'] },
    { id: 'find-shelter', basisIds: ['shelter', 'old'] },
    { id: 'unrelated', basisIds: [] },
  ],
  evidence: [{ id: 'shelter' }, { id: 'kind' }, { id: 'old' }, { id: 'colour' }],
}

test('each stop and retry starts with a fresh, independent prediction record', () => {
  const first = createPredictionRecord()
  const second = createPredictionRecord()
  first.evidenceIds.push('shelter')
  assert.deepEqual(second, { evidenceIds: [], revealed: false })
  assert.notEqual(first.evidenceIds, second.evidenceIds)
})

test('changing an unrevealed prediction keeps clues and never mutates its previous record', () => {
  const initial = createPredictionRecord()
  const withClue = togglePredictionEvidence(initial, 'shelter')
  const first = selectPrediction(withClue, 'wait')
  const second = selectPrediction(first, 'find-shelter')
  assert.equal(first.predictionId, 'wait')
  assert.equal(second.predictionId, 'find-shelter')
  assert.deepEqual(second.evidenceIds, ['shelter'])
  assert.notEqual(first.evidenceIds, second.evidenceIds)
  assert.deepEqual(initial, { evidenceIds: [], revealed: false })
  assert.deepEqual(togglePredictionEvidence(second, 'shelter').evidenceIds, [])
  assert.deepEqual(selectPrediction(second, ' '), second)
  assert.deepEqual(togglePredictionEvidence(second, ' '), second)
})

test('several reasonable predictions can be supported without a single correct outcome', () => {
  for (const predictionId of ['wait', 'find-shelter']) {
    const record = togglePredictionEvidence(selectPrediction(createPredictionRecord(), predictionId), 'shelter')
    const before = assessPrediction(record, predictionCase)
    const after = assessPrediction(revealPrediction(record), predictionCase)
    assert.equal(before.supported, true)
    assert.equal(before.hasRelevantEvidence, true)
    assert.equal(after.supported, true)
    assert.match(after.feedback, /不同也没关系/)
  }
})

test('unknown or unrelated clues do not silently become a reason for a prediction', () => {
  const validPrediction = selectPrediction(createPredictionRecord(), 'wait')
  for (const evidenceId of ['colour', 'outcome-spoiler', 'old']) {
    const assessment = assessPrediction(togglePredictionEvidence(validPrediction, evidenceId), predictionCase)
    assert.equal(assessment.hasPrediction, true)
    assert.equal(assessment.hasRelevantEvidence, false)
    assert.equal(assessment.supported, false)
    assert.doesNotMatch(assessment.feedback, /猜错|错误|答错/)
  }
  const unsupported = togglePredictionEvidence(selectPrediction(createPredictionRecord(), 'unrelated'), 'shelter')
  assert.equal(assessPrediction(unsupported, predictionCase).supported, false)
  assert.equal(assessPrediction(selectPrediction(createPredictionRecord(), 'unknown'), predictionCase).hasPrediction, false)
})

test('reading on is available immediately and never inserts a prediction or clue', () => {
  const record = createPredictionRecord()
  const revealed = revealPrediction(record)
  assert.deepEqual(revealed, { evidenceIds: [], revealed: true })
  assert.equal(record.revealed, false)
  const assessment = assessPrediction(revealed, predictionCase)
  assert.equal(assessment.hasPrediction, false)
  assert.equal(assessment.supported, false)
  assert.doesNotMatch(assessment.feedback, /猜错|错误|答错/)
})

test('reading on preserves the original guess and evidence instead of replacing them with the story', () => {
  const before = togglePredictionEvidence(selectPrediction(createPredictionRecord(), 'find-shelter'), 'old')
  const revealed = revealPrediction(before)
  assert.deepEqual(selectPrediction(revealed, 'wait'), revealed)
  assert.deepEqual(togglePredictionEvidence(revealed, 'kind'), revealed)
  assert.deepEqual(revealPrediction(revealed), revealed)
  assert.equal(revealed.predictionId, 'find-shelter')
  assert.deepEqual(revealed.evidenceIds, ['old'])
  assert.equal(before.revealed, false)
})

test('reflection is optional, only follows reading on, and never rewrites the earlier guess', () => {
  const before = selectPrediction(createPredictionRecord(), 'find-shelter')
  assert.deepEqual(reflectPrediction(before, 'adjust'), before)
  const revealed = revealPrediction(before)
  for (const reflection of ['keep', 'adjust'] as const) {
    const reflected = reflectPrediction(revealed, reflection)
    assert.equal(reflected.reflection, reflection)
    assert.equal(reflected.predictionId, 'find-shelter')
    assert.deepEqual(reflected.evidenceIds, [])
    assert.equal(revealed.reflection, undefined)
  }
})
