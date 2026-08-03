import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { pigeonholeModel } from '../../js/assessment-v2/pilots.js';
import { classifyContentOrigin, canPublishAsPremiumV2, LEGACY_CONTENT_STATUS, V2_CONTENT_STATUS } from '../../js/assessment-v2/legacy-policy.js';

test('eski premium etiketi V2 doğrulaması olmadan yayın yetkisi vermez', () => {
  const legacy = { premium: true, question: 'Eski soru', answerIndex: 0 };
  assert.equal(classifyContentOrigin(legacy), LEGACY_CONTENT_STATUS);
  assert.equal(canPublishAsPremiumV2(legacy), false);
});

test('yalnız V2 item modelinden ve solver kanıtından gelen içerik doğrulanmış sayılır', () => {
  const item = materializeItemModel(pigeonholeModel);
  assert.equal(classifyContentOrigin(item), V2_CONTENT_STATUS);
  assert.equal(canPublishAsPremiumV2(item), true);
});
