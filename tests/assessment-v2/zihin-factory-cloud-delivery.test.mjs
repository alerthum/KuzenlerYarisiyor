import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { unwrapFactoryApprovedPackage } from '../../scripts/import-zihin-factory-tr8-pilot.mjs';

const workflow = readFileSync(
  new URL('../../.github/workflows/import-zihin-factory-tr8-pilot.yml', import.meta.url),
  'utf8'
);
const controlledBank = readFileSync(
  new URL('../../js/assessment-v2/controlled-live-beta-bank.js', import.meta.url),
  'utf8'
);
const policy = readFileSync(
  new URL('../../js/assessment-v2/trusted-live-policy.js', import.meta.url),
  'utf8'
);

test('cloud import is manual, explicit and creates only a draft content PR', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.match(workflow, /IMPORT_APPROVED_TR8_PILOT/);
  assert.match(workflow, /secrets\.FACTORY_ADMIN_TOKEN/);
  assert.match(workflow, /approved-package/);
  assert.match(workflow, /gh pr create --draft/);
  assert.match(workflow, /gh workflow run quality-gates\.yml/);
  assert.doesNotMatch(workflow, /gh pr merge|vercel --prod|firebase deploy|wrangler deploy/i);
});

test('generated pilot is statically wired but remains empty until its own content PR', () => {
  assert.match(controlledBank, /ZIHIN_FACTORY_APPROVED_TR8_ROUNDS/);
  assert.match(policy, /ZIHIN_FACTORY_APPROVED_TR8_KEYS/);
  assert.match(policy, /\.\.\.ZIHIN_FACTORY_APPROVED_TR8_KEYS/);
});

test('Factory approved-package API envelope is unwrapped and errors stay fail-closed', () => {
  const packageArtifact = { kind: 'zihin-factory-approved-tr8-paragraph-pilot' };
  assert.equal(unwrapFactoryApprovedPackage({ ok: true, package: packageArtifact }), packageArtifact);
  assert.equal(unwrapFactoryApprovedPackage(packageArtifact), packageArtifact);
  assert.throws(
    () => unwrapFactoryApprovedPackage({ ok: false, error: 'pilot_package_not_eligible' }),
    /pilot_package_not_eligible/
  );
});
