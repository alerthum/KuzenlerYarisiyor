import test, { after, before } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let env;
before(async () => {
  const rules = await readFile(new URL('../../firebase/firestore.rules', import.meta.url), 'utf8');
  env = await initializeTestEnvironment({ projectId: 'zihin-arenasi-test', firestore: { rules } });
});
after(async () => { await env?.cleanup(); });

test('anonim kullanıcı hassas koleksiyonları okuyamaz veya yazamaz', async () => {
  const db = env.unauthenticatedContext().firestore();
  for (const path of ['accounts/x', 'learners/x', 'attempts/x', 'questionReports/x', 'aiInsights/x']) {
    await assertFails(getDoc(doc(db, path)));
    await assertFails(setDoc(doc(db, path), { id: 'x' }));
  }
});
