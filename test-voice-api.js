// Voice API test script
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testVoiceGeneration(artistStyle) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/generate-voice',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const payload = {
    lyrics: 'Testing the brand new voice generation pipeline.',
    artistStyle,
    tempo: 1.05
  };

  const response = await makeRequest(options, payload);
  const isAudio = response.headers['content-type']?.includes('audio/mpeg');
  console.log(`- ${artistStyle}: status ${response.statusCode} (${isAudio ? 'audio' : 'non-audio'})`);
}

async function testVoicePreview() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/preview-voice',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const payload = {
    lyrics: 'This is a tiny preview clip to validate the endpoint flow.',
    artistStyle: 'taylor-swift',
    duration: 8
  };

  const response = await makeRequest(options, payload);
  const isAudio = response.headers['content-type']?.includes('audio/mpeg');
  console.log(`- preview: status ${response.statusCode} (${isAudio ? 'audio' : 'non-audio'})`);
}

async function testInvalidArtistStyle() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/generate-voice',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const payload = { lyrics: 'Invalid artist payload', artistStyle: 'unknown' };
  const response = await makeRequest(options, payload);
  console.log(`- invalid artist: status ${response.statusCode}`);
}

async function testPreviewRateLimit() {
  console.log('- preview rate limit (5 requests in quick succession)');
  const promises = [];
  for (let i = 0; i < 6; i++) {
    promises.push(testVoicePreview());
  }
  await Promise.all(promises);
}

async function run() {
  console.log('🎙️  Testing voice endpoints...');
  const artists = ['taylor-swift', 'drake', 'adele', 'billie-eilish'];
  for (const artist of artists) {
    await testVoiceGeneration(artist);
  }

  await testVoicePreview();
  await testInvalidArtistStyle();
  await testPreviewRateLimit();

  console.log('✅ Voice API tests completed (check statuses above)');
}

// Allow slow servers to start
setTimeout(() => {
  run().catch((err) => console.error('Voice API test error:', err));
}, 2000);

module.exports = {
  testVoiceGeneration,
  testVoicePreview,
  testInvalidArtistStyle
};
