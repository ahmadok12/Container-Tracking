// Cloudflare Pages Function: /api/tracktainer
// Set TRACKTAINER_API_KEY as an encrypted secret in Pages > Settings > Variables and Secrets.
import { handle } from '../../lib/proxy.js';

export function onRequestGet({ request, env }) {
  return handle(request, env);
}
