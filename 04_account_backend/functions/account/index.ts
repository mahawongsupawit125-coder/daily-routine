// core.js and account-data.js are copied from frontend sources by scripts/account-bundle.cjs.
import './core.js';
import './account-data.js';
import {createHandler} from './handler.mjs';
const runtime=globalThis as typeof globalThis & {Jai: unknown;JaiAccountData: {cloudState: unknown}};
Deno.serve(createHandler({
 core:runtime.Jai,cloudState:runtime.JaiAccountData.cloudState,
 url:Deno.env.get('SUPABASE_URL')!,key:Deno.env.get('SUPABASE_ANON_KEY')!,
 secret:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
 origins:['https://mahawongsupawit125-coder.github.io'],
}));
