import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase a initialisation paresseuse.
 *
 * Le client n'est cree qu'au premier acces, pas au chargement du module. Sans
 * ca, une variable d'environnement absente fait echouer le BUILD — la collecte
 * des pages instancie le module — au lieu de produire une erreur a l'execution
 * sur la seule route concernee.
 *
 * Meme correctif que celui applique au client Prisma.
 */

let client: SupabaseClient | undefined;

function createSupabaseAdmin(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !serviceKey) {
        throw new Error(
            'Configuration Supabase absente : NEXT_PUBLIC_SUPABASE_URL et ' +
            'SUPABASE_SERVICE_KEY sont requis pour les operations de stockage.',
        );
    }

    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        if (!client) client = createSupabaseAdmin();
        return (client as unknown as Record<string | symbol, unknown>)[prop];
    },
});
