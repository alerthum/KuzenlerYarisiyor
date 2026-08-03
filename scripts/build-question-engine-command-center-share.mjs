#!/usr/bin/env node
import { buildCommandCenterShare, SHARE_PATH, formatSize, MAX_SHARE_BYTES } from './lib/command-center-share.mjs';

const result = buildCommandCenterShare({ write: true });
const over = result.bytes > MAX_SHARE_BYTES;
console.log(JSON.stringify({
  ok: !over,
  path: SHARE_PATH,
  bytes: result.bytes,
  size: formatSize(result.bytes),
  maxBytes: MAX_SHARE_BYTES,
  dataFreshness: result.meta.dataFreshness,
  liveStatus: result.meta.liveStatus,
  failedShardCount: result.meta.failedShardCount,
  decision: result.shareDoc.latestDecision?.decision,
  productReady: result.shareDoc.latestDecision?.productReady
}, null, 2));
process.exit(over ? 2 : 0);
