const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

console.log('Checking configuration...');

try {
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env.local file NOT found!');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    let provider = 'openai'; // default
    let openaiKey = null;
    let anthropicKey = null;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || trimmed.length === 0) return;

        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();

        if (key.trim() === 'LLM_PROVIDER') provider = value.replace(/['"]/g, '');
        if (key.trim() === 'OPENAI_API_KEY') openaiKey = value.replace(/['"]/g, '');
        if (key.trim() === 'ANTHROPIC_API_KEY') anthropicKey = value.replace(/['"]/g, '');
    });

    console.log(`ℹ️ Configured Provider: ${provider}`);

    if (provider === 'openai') {
        if (!openaiKey) {
            console.log('❌ OPENAI_API_KEY is missing in .env.local');
        } else if (openaiKey === 'sk-your-openai-key-here') {
            console.log('❌ OPENAI_API_KEY is set to the default placeholder! Please replace it with your actual key.');
        } else if (!openaiKey.startsWith('sk-')) {
            console.log(`⚠️ OPENAI_API_KEY does not start with 'sk-'. It might be invalid. Format: ${openaiKey.substring(0, 5)}...`);
        } else {
            console.log('✅ OPENAI_API_KEY appears formatted correctly.');
        }
    } else if (provider === 'anthropic') {
        if (!anthropicKey) {
            console.log('❌ ANTHROPIC_API_KEY is missing in .env.local');
        } else if (anthropicKey.includes('your-anthropic-key')) {
            console.log('❌ ANTHROPIC_API_KEY seems to be a placeholder.');
        } else if (!anthropicKey.startsWith('sk-ant-')) {
            console.log('⚠️ ANTHROPIC_API_KEY does not start with \'sk-ant-\'. It might be invalid.');
        } else {
            console.log('✅ ANTHROPIC_API_KEY appears formatted correctly.');
        }
    } else {
        console.log(`⚠️ Unknown provider configured: ${provider}. Use 'openai' or 'anthropic'.`);
    }

} catch (err) {
    console.error('An error occurred:', err);
}
