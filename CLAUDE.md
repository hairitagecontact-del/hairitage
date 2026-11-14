# HAIR'ITAGE — Système de fidélité sur mesure

## Contexte projet
Salon de coiffure appartenant au frère de Nihal. Deux espaces : barbershop (hommes) + salon coiffure & esthétique (femmes). On construit un système de carte de fidélité digitale (Apple Wallet + Google Wallet) 100% sur mesure, sans passer par Tappy ni aucun abonnement tiers.

## Les 3 cartes
| Carte | Public | Tampons | Cadeau |
|-------|--------|---------|--------|
| Homme | Barbershop | 5 | 1 coupe gratuite |
| Coiffure | Salon femmes | 8 | À confirmer (brushing, soin, coloration, coupe+brushing) |
| Esthétique | Institut beauté | 8 | À confirmer (soin visage, épilation, manucure, au choix) |

Les cadeaux exacts pour Coiffure et Esthétique ne sont pas encore fixés — attendre confirmation du frère.

## Ce qui a déjà été fait
- **Démo interactive** (configurateur + mockup téléphone) : https://claude.ai/artifact/6RF5jSp7pN9fg9BX3cUNe2
- **Guide de mise en place** : https://claude.ai/artifact/SEJfvm7yntyhexH1ABMg2Q
- **Code complet écrit** dans `app/` — prêt à déployer dès que les comptes sont créés

## Stack technique décidé
- **Frontend/API** : Next.js (App Router) déployé sur Vercel
- **Base de données** : Supabase (PostgreSQL)
- **Apple Wallet** : PassKit (certificats via Apple Developer Account)
- **Google Wallet** : Google Wallet API (compte de service JSON)
- **Hébergement** : Vercel (gratuit)
- **Domaine** : hairitage.vercel.app par défaut, hairitage.ma ou .com si acheté

## Prochaine étape : déploiement
1. Créer les 4 comptes (Apple Developer, Google Cloud, GitHub+Vercel, Supabase)
2. Remplir `.env` à partir de `.env.example`
3. `npm install` dans `app/`
4. Exécuter le SQL dans Supabase
5. `vercel deploy`

## Comptes à créer (statut : EN ATTENTE)
- [ ] Apple Developer Account (99$/an) — developer.apple.com
- [ ] Google Cloud Console — compte de service + Google Wallet API activée
- [ ] GitHub — pour déployer sur Vercel
- [ ] Vercel — connecté à GitHub
- [ ] Supabase — projet "hairitage", région Europe

## Architecture prévue
```
/app
  /page.tsx              → page d'accueil publique
  /join/[type]/page.tsx  → le client scanne QR → choisit sa carte → ajout Wallet
  /caisse/page.tsx       → interface ton frère (ajouter tampon)
  /dashboard/page.tsx    → stats et gestion clients
/api
  /passes/create         → génère un pass Apple ou Google
  /passes/update         → met à jour les tampons + push notification
  /customers             → CRUD clients
```

## Branding
- Or : #C9A84C
- Fond sombre : #0F0F0D
- Police display : Cormorant Garamond
- Police body : Inter
- Logo : double H stylisé (SVG disponible dans les artifacts)

## Instructions pour Claude
- Ne pas réexpliquer le contexte du projet à chaque session — tout est ici
- Toujours coder en TypeScript
- Priorité : fonctionnel d'abord, design ensuite
- Commenter uniquement ce qui est non-évident
- Langue des commits et du code : anglais. Langue avec l'utilisateur : français
