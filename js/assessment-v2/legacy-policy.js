export const LEGACY_CONTENT_STATUS = 'UNVERIFIED_LEGACY';
export const V2_CONTENT_STATUS = 'VERIFIED_ITEM_MODEL_V2';

export function classifyContentOrigin(item = {}) {
  return item.schemaVersion === '2.0'
    && item.itemModelId
    && item.solverProof?.verified === true
    ? V2_CONTENT_STATUS
    : LEGACY_CONTENT_STATUS;
}

export function canPublishAsPremiumV2(item = {}) {
  return classifyContentOrigin(item) === V2_CONTENT_STATUS;
}
