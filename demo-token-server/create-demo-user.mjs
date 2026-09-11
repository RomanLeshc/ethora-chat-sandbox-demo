import { getEthoraSDKService } from '@ethora/sdk-backend';
process.env.ETHORA_CHAT_API_URL ||= 'https://api.chat.ethora.com';
const chat = getEthoraSDKService();
try {
  const r = await chat.createUser('ethora-sandbox-demo', { firstName: 'Sandbox', lastName: 'Demo' });
  console.log('createUser:', JSON.stringify(r));
} catch (e) { console.log('createUser error (may already exist):', e?.message || e); }
try {
  const r = await chat.createChatRoom('ethora-sandbox-demo-room', { title: 'Ethora sandbox demo', uuid: 'ethora-sandbox-demo-room', type: 'group' });
  console.log('createChatRoom:', JSON.stringify(r));
} catch (e) { console.log('createChatRoom error (may already exist):', e?.message || e); }
try {
  const r = await chat.grantUserAccessToChatRoom('ethora-sandbox-demo-room', 'ethora-sandbox-demo');
  console.log('grantAccess:', JSON.stringify(r));
} catch (e) { console.log('grantAccess error:', e?.message || e); }
