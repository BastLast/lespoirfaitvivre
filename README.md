# Loto FDJ Statistiques

Site de statistiques interactif basé sur les résultats officiels du Loto français (FDJ) depuis le changement de règles de novembre 2019.

## Fonctionnalités

- **989+ tirages** analysés automatiquement
- **Mise à jour automatique** des données depuis l'API FDJ à chaque visite
- **10 onglets** d'analyse :
  - Fréquences de sortie (avec filtres par période)
  - Retards actuels et historiques
  - Statistiques du N° Chance
  - Paires & triplets les plus/moins fréquents
  - Heatmap visuelle des paires
  - Évolution temporelle par numéro
  - Répartition (dizaines, parité, somme, écart)
  - Suggestions de grilles (froids, glacés, mix équilibré)
  - Rétroanalyse des suggestions (validation historique)
  - Analyseur de combinaison personnalisée

## Architecture

```text
├── index.html              # Structure HTML
├── css/style.css           # Styles
├── data/loto_data.json     # Données fallback
├── js/
│   ├── app.js              # Point d'entrée (init, tabs, filtres)
│   ├── state.js            # État partagé (allDraws, filteredDraws, charts)
│   ├── data.js             # Chargement données (cache, FDJ API, CSV parser)
│   ├── charts.js           # Helpers Chart.js (makeChart, couleurs)
│   ├── stats.js            # Fonctions de calcul statistique
│   └── render/
│       ├── summary.js      # Résumé + dernier tirage
│       ├── frequency.js    # Onglet fréquences
│       ├── retards.js      # Onglet retards
│       ├── chance.js       # Onglet N° Chance
│       ├── pairs.js        # Onglet paires & triplets
│       ├── heatmap.js      # Onglet heatmap
│       ├── evolution.js    # Onglet évolution temporelle
│       ├── repartition.js  # Onglet répartition
│       ├── suggestions.js  # Onglet suggestions
│       ├── retroanalysis.js# Onglet rétroanalyse
│       └── analyzer.js     # Onglet analyseur de combinaison
```

## Déploiement

Site statique avec ES modules — déployable sur GitHub Pages :

1. Activer GitHub Pages dans Settings → Pages → Source: `main` / `/ (root)`
2. Le site sera accessible à `https://<username>.github.io/<repo>/`

## Données

- Les données sont récupérées automatiquement depuis FDJ à chaque visite (ZIP → CSV → parse côté client)
- Cache localStorage de 6h pour éviter de surcharger l'API
- Fallback sur `data/loto_data.json` si FDJ est inaccessible

⚠️ Le Loto est un jeu de hasard. Les statistiques passées n'influencent pas les tirages futurs.
