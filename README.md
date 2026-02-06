# AfriAgri Invest

Plateforme d'investissement agricole permettant aux utilisateurs d'investir dans des fermes virtuelles et de générer des rendements composés.

## 🌾 Description

AfriAgri Invest est une application web complète qui permet aux utilisateurs de :
- S'inscrire et se connecter de manière sécurisée
- Investir dans des packs de fermes agricoles
- Suivre leurs gains et rendements en temps réel
- Effectuer des retraits via USDT (TRC20) ou MTN Mobile Money

## 🚀 Technologies

- **Frontend** : Next.js 14+ (App Router), Tailwind CSS v4, Framer Motion
- **Backend** : Next.js API Routes, Prisma ORM
- **Base de données** : SQLite (développement) / PostgreSQL (production)
- **Authentification** : NextAuth.js avec JWT
- **State Management** : Zustand
- **Graphiques** : Recharts

## 📦 Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/dreamafricahub-netizen/AfriAgri-Invest.git
cd AfriAgri-Invest
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

4. Initialiser la base de données :
```bash
npx prisma generate
npx prisma db push
```

5. Lancer le serveur de développement :
```bash
npm run dev
```

6. Ouvrir [http://localhost:3000](http://localhost:3000)

## ✨ Fonctionnalités

- **Authentification** : Inscription, connexion, récupération de mot de passe
- **Investissement** : Achat de packs de fermes avec différents rendements
- **Dashboard** : Suivi des investissements, gains et statistiques
- **Parrainage** : Système de parrainage avec commissions
- **Paiements** : Intégration USDT TRC20 et MTN Mobile Money
- **Responsive** : Interface optimisée pour mobile et desktop

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Contributeurs

- [DreamAfricaHub](https://github.com/dreamafricahub-netizen)
