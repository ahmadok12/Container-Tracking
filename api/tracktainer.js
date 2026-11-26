// Vercel Function: /api/tracktainer
// Set TRACKTAINER_API_KEY in Vercel > Project > Settings > Environment Variables.
import { handle } from '../lib/proxy.js';

export function GET(request) {
  return handle(request, process.env);
}
