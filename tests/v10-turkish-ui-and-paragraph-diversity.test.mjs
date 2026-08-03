import test from 'node:test';
import assert from 'node:assert/strict';
import { cognitivePatternLabel } from '../js/engines/cognitive-report-v10.js';
import { createDynamicParagraphSession } from '../js/engines/paragraph-engine-v4.js';

const TECHNICAL_PATTERNS = [
  'Argument Weakness Dynamic',
  'Contradiction Detection Dynamic',
  'Set Logic No Overlap',
  'Conditional Contrapositive',
  'Binary Switches',
  'Task Dependency Block',
  'UNMAPPED_TECHNICAL_PATTERN'
];

test('admin bilişsel profilinde İngilizce teknik kimlik gösterilmez', () => {
  for (const pattern of TECHNICAL_PATTERNS) {
    const label = cognitivePatternLabel(pattern);
    assert.ok(label.length > 0);
    assert.doesNotMatch(label, /Argument|Contradiction|Set Logic|Conditional|Binary|Task|Dynamic|Technical|Pattern/i);
  }
});

test('paragraf dedektifi oturumunda renkli başlık ve yapay dosya çerçevesi kullanılmaz', () => {
  const banned = /(mavi|yeşil|turuncu|mor|sarı|kırmızı) başlıklı|kulüp raporunda|proje dosyasında|araştırma kartında|sunum taslağında/i;
  for (let seed = 1; seed <= 100; seed += 1) {
    const rounds = createDynamicParagraphSession({ id: `p-${seed}`, grade: 8, age: 13 }, `seed-${seed}`, 8, {});
    assert.equal(rounds.length, 8);
    assert.equal(new Set(rounds.map((item) => item.familyId)).size, 8);
    for (const round of rounds) assert.doesNotMatch(`${round.context} ${round.prompt}`, banned);
  }
});
