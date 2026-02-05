'use client';

import { ArrowLeft, FileText, Shield, Building2, Scale, Users, Globe, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function MentionsLegalesPage() {
    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
                <Link href="/profil" className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-black">Mentions legales</h1>
            </div>

            {/* Editeur */}
            <Section icon={<Building2 className="w-5 h-5 text-blue-500" />} title="Editeur du site">
                <InfoLine label="Raison sociale" value="AfriAgri Invest SAS" />
                <InfoLine label="Forme juridique" value="Societe par Actions Simplifiee" />
                <InfoLine label="Capital social" value="5 000 000 FCFA" />
                <InfoLine label="Siege social" value="Abidjan, Cocody Riviera 3, Cote d'Ivoire" />
                <InfoLine label="RCCM" value="CI-ABJ-2024-B-12345" />
                <InfoLine label="Email" value="contact@afriagri-invest.com" />
                <InfoLine label="Telephone" value="+225 07 00 00 00" />
                <InfoLine label="Directeur de publication" value="M. Kouame Olivier, Directeur General" />
            </Section>

            {/* Hebergement */}
            <Section icon={<Globe className="w-5 h-5 text-purple-500" />} title="Hebergement">
                <InfoLine label="Hebergeur" value="Vercel Inc." />
                <InfoLine label="Adresse" value="340 S Lemon Ave #4133, Walnut, CA 91789, USA" />
                <InfoLine label="Site web" value="vercel.com" />
            </Section>

            {/* Objet */}
            <Section icon={<FileText className="w-5 h-5 text-green-500" />} title="Objet de la plateforme">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    AfriAgri Invest est une plateforme d'investissement participatif dans le secteur agricole africain. Elle permet aux utilisateurs de participer au financement de cooperatives agricoles partenaires et de recevoir des rendements sur leur capital investi.
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-2">
                    La plateforme propose differents packs d'investissement allant de 3 000 FCFA a 500 000 FCFA, avec un systeme de rendements composes calcules quotidiennement.
                </p>
            </Section>

            {/* CGU */}
            <Section icon={<Scale className="w-5 h-5 text-amber-500" />} title="Conditions Generales d'Utilisation">
                <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Article 1 - Acceptation des conditions</h4>
                        <p>L'utilisation de la plateforme AfriAgri Invest implique l'acceptation pleine et entiere des presentes conditions generales d'utilisation. L'inscription sur la plateforme vaut acceptation de ces conditions.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Article 2 - Inscription</h4>
                        <p>L'inscription est gratuite et ouverte a toute personne physique majeure. L'utilisateur s'engage a fournir des informations exactes et a maintenir la confidentialite de ses identifiants de connexion. Un bonus de bienvenue de 3 000 FCFA est credite a l'inscription.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Article 3 - Investissements</h4>
                        <p>Les investissements sont effectues via l'achat de packs agricoles. Chaque pack represente une participation dans les activites d'une cooperative agricole partenaire. Les rendements sont calcules sur la base d'un taux compose journalier de 3.5%.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Article 4 - Retraits</h4>
                        <p>L'utilisateur doit avoir effectue au moins un investissement (achat de pack) avant de pouvoir proceder a un retrait. Les retraits sont traites sous 24 heures ouvrees via les services Mobile Money (MTN, Orange Money, Wave). Le montant minimum de retrait est de 1 000 FCFA.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Article 5 - Programme de parrainage</h4>
                        <p>Chaque utilisateur dispose d'un lien de parrainage unique. Le parrain recoit un bonus equivalent a 10% de chaque investissement realise par ses filleuls, sans limite de duree. Le programme de parrainage peut etre modifie a tout moment par AfriAgri Invest.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Article 6 - Responsabilite</h4>
                        <p>AfriAgri Invest met tout en oeuvre pour assurer la disponibilite et le bon fonctionnement de la plateforme. Toutefois, l'editeur ne saurait etre tenu responsable des interruptions temporaires de service, des evenements de force majeure ou des fluctuations de rendement liees aux activites agricoles.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Article 7 - Modification des CGU</h4>
                        <p>AfriAgri Invest se reserve le droit de modifier les presentes conditions a tout moment. Les utilisateurs seront informes des modifications par notification dans l'application. La poursuite de l'utilisation apres modification vaut acceptation des nouvelles conditions.</p>
                    </div>
                </div>
            </Section>

            {/* Politique de confidentialite */}
            <Section icon={<Shield className="w-5 h-5 text-green-500" />} title="Politique de confidentialite">
                <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Donnees collectees</h4>
                        <p>Nous collectons les donnees suivantes lors de votre inscription : nom complet, adresse email, numero de telephone. Ces donnees sont necessaires a la creation de votre compte et au traitement de vos transactions.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Utilisation des donnees</h4>
                        <p>Vos donnees sont utilisees exclusivement pour : la gestion de votre compte, le traitement de vos investissements et retraits, l'envoi de notifications liees a votre activite, et le fonctionnement du programme de parrainage.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Protection des donnees</h4>
                        <p>Vos donnees personnelles sont stockees de maniere securisee et ne sont jamais vendues ni partagees avec des tiers a des fins commerciales. Nous utilisons le chiffrement SSL/TLS pour proteger vos informations lors de leur transmission.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Vos droits</h4>
                        <p>Conformement a la legislation en vigueur, vous disposez d'un droit d'acces, de rectification et de suppression de vos donnees personnelles. Pour exercer ces droits, contactez-nous a l'adresse : privacy@afriagri-invest.com.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Cookies</h4>
                        <p>La plateforme utilise des cookies strictement necessaires au fonctionnement du service (authentification, preferences utilisateur). Aucun cookie publicitaire ou de tracking n'est utilise.</p>
                    </div>
                </div>
            </Section>

            {/* Programme de parrainage */}
            <Section icon={<Users className="w-5 h-5 text-purple-500" />} title="Programme de parrainage">
                <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <p>Le programme de parrainage AfriAgri Invest recompense les utilisateurs qui recommandent la plateforme a leur entourage.</p>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Fonctionnement</h4>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Chaque utilisateur dispose d'un lien de parrainage unique</li>
                            <li>Le parrain recoit 10% de bonus sur chaque investissement de ses filleuls</li>
                            <li>Ce bonus est credite automatiquement et sans limite de duree</li>
                            <li>Le parrainage contribue au deblocage d'avantages exclusifs</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Conditions</h4>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Le filleul doit s'inscrire via le lien du parrain</li>
                            <li>Le bonus est calcule sur le montant de chaque investissement du filleul</li>
                            <li>Le parrain et le filleul doivent avoir des comptes valides et actifs</li>
                            <li>AfriAgri Invest se reserve le droit de modifier les conditions du programme</li>
                        </ul>
                    </div>
                </div>
            </Section>

            {/* Avertissement */}
            <div className="flex gap-3 items-start p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-sm text-amber-900 dark:text-amber-100">Avertissement sur les risques</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Tout investissement comporte des risques. Les rendements passes ne garantissent pas les rendements futurs. AfriAgri Invest recommande a ses utilisateurs d'investir de maniere responsable et de ne jamais investir des sommes dont ils pourraient avoir besoin a court terme.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-zinc-400 space-y-1 pb-4">
                <p>Derniere mise a jour : Janvier 2025</p>
                <p>AfriAgri Invest SAS - Abidjan, Cote d'Ivoire</p>
                <p>contact@afriagri-invest.com</p>
            </div>
        </div>
    );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h2 className="font-bold text-lg">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function InfoLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start py-2 border-b border-zinc-50 dark:border-zinc-800 last:border-b-0">
            <span className="text-xs text-zinc-500 shrink-0 mr-4">{label}</span>
            <span className="text-sm font-medium text-right">{value}</span>
        </div>
    );
}
