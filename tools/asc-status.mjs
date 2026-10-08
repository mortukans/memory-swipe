// Read-only App Store Connect status for Memory Swipe. Needs the ASC API key .p8 (not in the repo).
//   ASC_KEY_PATH=... node tools/asc-status.mjs
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
const get = async (p) => {
  const r = await fetch(`https://api.appstoreconnect.apple.com${p}`, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  if (!r.ok) throw new Error(`${p} → ${r.status} ${JSON.stringify(j.errors?.[0]?.detail ?? j).slice(0, 200)}`);
  return j;
};

const versions = (await get(`/v1/apps/${APP}/appStoreVersions?filter[platform]=IOS&limit=5`)).data;
for (const v of versions) {
  const build = await get(`/v1/appStoreVersions/${v.id}/build`).catch(() => null);
  console.log(`VERSION ${v.attributes.versionString}: ${v.attributes.appStoreState} | build ${build?.data?.attributes?.version ?? '(none)'} | release ${v.attributes.releaseType}`);
  const locs = (await get(`/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations`)).data;
  for (const l of locs) {
    const sets = (await get(`/v1/appStoreVersionLocalizations/${l.id}/appScreenshotSets?include=appScreenshots`)).data;
    console.log(`  ${l.attributes.locale}: description ${(l.attributes.description ?? '').length} chars, screenshots ${sets.map((s) => `${s.attributes.screenshotDisplayType}=${s.relationships?.appScreenshots?.data?.length ?? 0}`).join(' ') || 'none'}`);
  }
}
const builds = (await get(`/v1/builds?filter[app]=${APP}&sort=-uploadedDate&limit=3`)).data;
for (const b of builds) console.log(`BUILD ${b.attributes.version}: ${b.attributes.processingState}, uploaded ${b.attributes.uploadedDate}`);
const subs = (await get(`/v1/reviewSubmissions?filter[app]=${APP}&limit=5`)).data;
for (const s of subs) console.log(`SUBMISSION ${s.attributes.state}${s.attributes.submittedDate ? ' submitted ' + s.attributes.submittedDate : ''}`);
const ps = await get(`/v1/apps/${APP}/dataUsagePublishState`).catch((e) => ({ err: e.message }));
console.log('APP PRIVACY published:', ps.data ? ps.data.attributes.published : ps.err);
const info = (await get(`/v1/apps/${APP}/appInfos`)).data[0];
const age = await get(`/v1/appInfos/${info.id}/ageRatingDeclaration`).catch(() => null);
console.log('AGE RATING set:', age ? Object.values(age.data.attributes).some((v) => v !== null) : 'unknown');
