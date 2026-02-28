# Loto FDJ Statistiques

Site de statistiques interactif basé sur les résultats officiels du Loto français (FDJ) depuis le changement de règles de novembre 2019.

## Fonctionnalités

- **989+ tirages** analysés automatiquement
- **Mise à jour automatique** des données depuis l'API FDJ à chaque visite
- **8 onglets** d'analyse :
  - Fréquences de sortie (avec filtres par période)
  - Retards actuels et historiques
  - Statistiques du N° Chance
  - Paires & triplets les plus/moins fréquents
  - Heatmap visuelle des paires
  - Évolution temporelle par numéro
  - Répartition (dizaines, parité, somme, écart)
  - Suggestions de grilles (froids, glacés, mix équilibré)

## Déploiement

Simple site statique HTML — déployable sur GitHub Pages :

1. Activer GitHub Pages dans Settings → Pages → Source: `main` / `/ (root)`
2. Le site sera accessible à `https://<username>.github.io/<repo>/`

## Données

- Les données sont récupérées automatiquement depuis FDJ à chaque visite (ZIP → CSV → parse côté client)
- Cache localStorage de 6h pour éviter de surcharger l'API
- Fallback sur `loto_data.json` si FDJ est inaccessible

⚠️ Le Loto est un jeu de hasard. Les statistiques passées n'influencent pas les tirages futurs.
