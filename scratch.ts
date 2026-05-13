import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({ apiKey: 'fake-key' });

async function main() {
  try {
    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: [{ role: 'user', content: 'test' }]
    });
    console.log(Object.keys(result));
  } catch (e) {
    console.error(e);
  }
}
main();
