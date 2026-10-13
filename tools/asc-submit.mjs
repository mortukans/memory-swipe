// Submits the current "Prepare for Submission" iOS version to App Review via the ASC API.
//   node tools/asc-submit.mjs            (ASC_KEY_PATH / ASC_KEY_ID / ASC_ISSUER_ID env overrides as in asc-status.mjs)
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

const KEY_PATH = process.env.ASC_KEY_PATH ?? 'D:/VM Linux 2/PROJECTS/uzmini-cenu/.secrets/AuthKey_VT9T8N85PX.p8';
const KID = process.env.ASC_KEY_ID ?? 'VT9T8N85PX';
const ISS = process.env.ASC_ISSUER_ID ?? '5cb73313-0bc9-4f59-ab41-723263fae956';
const APP = '6818539794';

const key = readFileSync(KEY_PATH, 'utf8');
const now = Math.floor(Date.now() / 1000);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const data = `${b64({ alg: 'ES256', kid: KID, typ: 'JWT' })}.${b64({ iss: ISS, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' })}`;
const sig = crypto.sign('SHA256', Buffer.from(data), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
const token = `${data}.${sig}`;
const api = async (method, p, body) => {
  const r = await fetch(`https://api.appstoreconnect.apple.com${p}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  const j = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}: ${JSON.stringify(j?.errors ?? j).slice(0, 1500)}`);
  return j;
};

const version = (await api('GET', `/v1/apps/${APP}/appStoreVersions?filter[platform]=IOS&limit=5`)).data.find(
  (v) => v.attributes.appStoreState === 'PREPARE_FOR_SUBMISSION',
);
if (!version) throw new Error('no version in Prepare for Submission');
const build = await api('GET', `/v1/appStoreVersions/${version.id}/build`);
console.log(`version ${version.attributes.versionString} (${version.attributes.appStoreState}) with build ${build.data?.attributes?.version}`);

let sub = (await api('GET', `/v1/reviewSubmissions?filter[app]=${APP}&filter[state]=READY_FOR_REVIEW&limit=1`)).data[0];
if (!sub) {
  sub = (await api('POST', '/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' }, relationships: { app: { data: { type: 'apps', id: APP } } } } })).data;
  console.log('created review submission', sub.id);
} else console.log('using draft submission', sub.id, sub.attributes.state);

const items = (await api('GET', `/v1/reviewSubmissions/${sub.id}/items`)).data;
if (!items.some((i) => i.relationships?.appStoreVersion?.data?.id === version.id)) {
  const it = await api('POST', '/v1/reviewSubmissionItems', {
    data: { type: 'reviewSubmissionItems', relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } }, appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } },
  });
  console.log('added version to submission:', it.data.attributes.state);
} else console.log('version already in submission');

const r = await api('PATCH', `/v1/reviewSubmissions/${sub.id}`, { data: { type: 'reviewSubmissions', id: sub.id, attributes: { submitted: true } } });
console.log('SUBMITTED:', r.data.attributes.state, r.data.attributes.submittedDate);
const after = (await api('GET', `/v1/appStoreVersions/${version.id}`)).data;
console.log('version state now:', after.attributes.appStoreState);
