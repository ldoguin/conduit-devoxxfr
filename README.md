# Hands-on-Lab Devoxx 2023 (CouchBase, GitLab, Qovery)

## Pré-requis

- Un compte GitLab
- Un compte sur Docker Hub
- Un trial sur CouchBase Capella
- Un token **Qovery** (`QOVERY_CLI_ACCESS_TOKEN`)

### Remarque: 

- `[🔴 Couchbase]`: vous êtes dans l'interface Couchbase Capella
- `[🟣 Qovery]`: vous êtes dans l'interface Qovery 
- `[🟠 GitLab]`: vous êtes dans l'interface GitLab


## [🟠 GitLab] 🍴 Forker le projet

- Forker ce projet
- Supprimer la relation de fork
  - Aller dans **Settings/General/Advanced**
  - Puis **Remove fork relationship**

## [🔴 Couchbase] 📝 Création d'un compte + BDD, Configuration générale/globale

### Création 

- Allez sur https://cloud.couchbase.com/
- Créez un compte 
- Allez dans **Settings** puis **Security/Database Access** et choisir **Create database Access**
  > - database access name = user
  > - pwd = password 
  > - (conservez votre user et votre mot de passe)
- Sélectionnez **All buckets, All scopes, Read/Write**
- Puis, cliquez sur **Create database Access**

### Récupérez la Connection String
> Settings, Internet
- Copiez la connection string (ex: `cb.4dzz6anchbsbxnv.cloud.couchbase.com`)
- Concernant les IP : sélectionnez : **Allow All Addresses** 

### Créez un bucket

- Allez dans l'onglet **Data Tools**
- Dans le menu de gauche, sélectionnez **Bucket**
  - Create bucket : `name: default`
    > - gardez les données par défaut
    > - **Enable flush** 


#### Creation de quelques informations

Au niveau de la console dans **Data Tools**:

```SQL
CREATE SCOPE `default`.data
CREATE COLLECTION `default`.data.docs
CREATE PRIMARY INDEX `#primary` ON `default`.`data`.`docs`

# Pour vérification
INSERT INTO `default`.data.docs (KEY, VALUE) VALUES ("key1", { "type" : "message", "name" : "👋 hello world 🌍" });

INSERT INTO `default`.data.docs (KEY, VALUE) VALUES ("key2", { "type" : "message", "name" : "👋 greetings 🎉" });

```

## [🟠 GitLab] 📝 Configuration générale/globale

### "Ouvrir" le projet

> Vous pouvez utiliser 
> - Gitpod
> - Le WebIDE de GitLab (**solution la plus simple pour faire les exercice**)
> - Votre IDE favoris (il faudra cloner le projet sur votre poste)

#### Settings

Dans les **Settings CI/CD** du projet, à la section **Variables**, ajouter les variables suivantes:

- `DOCKER_REGISTRY_PASSWORD` (cochez **mask variable**, décochez **protect variable**)
- `DOCKER_REGISTRY_USER` (décochez **protect variable**)
- `QOVERY_CLI_ACCESS_TOKEN` (cochez **mask variable**, décochez **protect variable**)


## [🟠 GitLab] Construire les images du container une 1ères fois

### Initialiser le pipeline pour construire et publier l'images

Ajouter un fichier `.gitlab-ci.yml` avec le contenu suivant:

```yaml
stages:
  - build-and-push
  - deploy
```

### Ajouter les variables qui seront utilisées par l'ensemble des jobs de CI

Ajouter ceci au fichier `.gitlab-ci.yml` :

```yaml
include:
  - ci/configurations-variables.yml

variables:
  !reference [.configuration, variables]
```

Allez jeter un coup d'oeil au fichier `ci/configurations-variables.yml`

### Activer les job de build (+ push) des images Docker

Ajoutez le job de CI pour construire l'image docker :

```yaml
# -----------------------------
#  🐳 Web application
# -----------------------------
kaniko:build:push:web-app:
  stage: build-and-push
  image:
    name: gcr.io/kaniko-project/executor:debug
    entrypoint: [""]
  variables:
    DOCKER_REGISTRY_IMAGE: $DOCKER_REGISTRY_USER/${APPLICATION_NAME}
  rules:
    # Production
    - if: $CI_COMMIT_BRANCH == "main"
      variables:
        DOCKER_IMAGE_TAG: ${CI_COMMIT_SHORT_SHA}
    # Development
    - if: $CI_MERGE_REQUEST_IID
      variables:
        DOCKER_IMAGE_TAG: ${CI_COMMIT_SHORT_SHA}
    # Release
    - if: $CI_COMMIT_TAG
      variables:
        DOCKER_IMAGE_TAG: ${CI_COMMIT_TAG}
  script: |
    echo "${JSON_CONFIG}" > /kaniko/.docker/config.json
    cat /kaniko/.docker/config.json
    /kaniko/executor \
      --context $CI_PROJECT_DIR \
      --dockerfile Dockerfile \
      --destination $DOCKER_REGISTRY_IMAGE:$DOCKER_IMAGE_TAG
    
    echo "🐳 Docker image (🌍 web app): ${DOCKER_REGISTRY_IMAGE}:${DOCKER_IMAGE_TAG}"
```

Committez et pousser vos modifications (**sur la branche `main`**):

```bash
git add .
git commit -m "🐳 first build"
git push
```

Cela va déclencher le pipeline, builder l'image et la publier sur le Docker Hub.

Dans les logs des jobs, relevez le nom de des images et de leur tag: sous la forme de `user/image_name:tag`.

Par exemple:
```bash
🐳 Docker image (🌍 web app): k33g/web-app-demo:5b3d5576
```

## [🟣 Qovery] Initialisation du projet & 1er déploiement

Dans votre **organisation** Qovery

### Créer une registry

- Allez dans les settings de votre organisation
- Cliquez sur **Container registries**
- Ajoutez une registry de type **DOCKER_HUB**
- Ajoutez vos credentials docker

### Créer le projet, l'environnement, et déployer l'application

- Créez un nouveau projet: `CouchBaseProject` (renommez le projet)
  - Modifiez aussi dans `ci/configurations-variables.yml`
- Créez un environnement pour ce projet: `couchbase_env`
- Ajoutez (à l'environnement) un nouveau service: `realworld-app-demo`
  - Choisir **create an application**
  - name: `realworld-app-demo`
  - application source: choisir **Docker registry**:
    - choisir votre registry (celle que vous avez créée)
    - Image name: `k33g/web-app-demo` (*ceci est un exemple*)
    - Image tag: `5b3d5576` (*ceci est un exemple*)
    - cliquez sur **Continue**
    - laissez les paramètres de ressources en l'état, cliquez sur **Continue**
    - pour le port public exposé, ajoutez `4000`, cliquez sur **Continue**
    - et enfin, cliquez sur **Create** (pas **Create and Deploy**)
- Cliquez sur le service **realworld-app-demo**
- Sélectionnez l'onglet **Variables**
  - Ajoutez les variables: (le plus simple, créer un fichier variables.env et l'uploader)
  ```
  DB_ENDPOINT="couchbases://cb.4dzz6anchbsbxnv.cloud.couchbase.com"
  DB_HOST="cb.4dzz6anchbsbxnv.cloud.couchbase.com"
  DB_USERNAME="bob"
  DB_PASSWORD="morane"
  DB_BUCKET="default"
  DB_SCOPE="_default"
  ```
  > 👋 vérifier lors de l'import des variables qu'il ny'ait pas de quotes ou simples quotes

- Sur la **"barre jaune"**, cliquez sur **Deploy now**
- Retournez sur l'onglet **Deployments**
- ⏳ Patientez, le déploiement est en cours
- Une fois l'application déployée, cliquez sur la ligne de l'application
  - Cliquez sur le bouton **Open links** pour obtenir l'URL de votre application
  - Vérifiez que l'application a bien été déployée


## [🟠 GitLab] Déployer les modifications avec GitLab CI

### Créer les variables de CI dans le projet

```bash
DB_ENDPOINT="couchbases://cb.4dzz6anchbsbxnv.cloud.couchbase.com"
DB_HOST="cb.4dzz6anchbsbxnv.cloud.couchbase.com"
DB_USERNAME="bob"
DB_PASSWORD="morane"
DB_BUCKET="default"
DB_SCOPE="_default"
```

### Ajouter les "helpers"

Le template `ci/qovery-helpers.yml` contient des scripts pour faciliter le déploiement de l'applications via Qovery avec GitLab CI. 

Ajoutez le template le fichier `.gitlab-ci.yml` :

```yaml
include:
  - ci/configurations-variables.yml
  - ci/qovery-helpers.yml
  - ci/configurations-variables.yml
  - ci/qovery-helpers.yml
  - ci/couchbase-helpers.yml
  - ci/cypress-helpers.yml
  - ci/hey-helpers.yml
  - ci/various-dependencies.yml

variables:
  !reference [.configuration, variables]
```

### Ajouter le job de déploiement
> Ce job fonctionne aussi avec les merge requests

Ajouter ceci à la suite du job de build d'image Docker:

```yaml
# -----------------------------
#  🚀 Web application
# -----------------------------
qovery:deploy:
  stage: deploy
  image: debian:buster-slim
  rules:
    # Production
    - if: $CI_COMMIT_BRANCH == "main"
      variables:
        DOCKER_IMAGE_TAG: ${CI_COMMIT_SHORT_SHA}
        CURRENT_QOVERY_ENVIRONMENT: ${QOVERY_ENVIRONMENT}
    # Development
    - if: $CI_MERGE_REQUEST_IID
      variables:
        DOCKER_IMAGE_TAG: ${CI_COMMIT_SHORT_SHA}
        CURRENT_QOVERY_ENVIRONMENT: ${QOVERY_ENVIRONMENT}-${CI_COMMIT_REF_NAME}
    # Release
    - if: $CI_COMMIT_TAG
      variables:
        DOCKER_IMAGE_TAG: ${CI_COMMIT_TAG}
        CURRENT_QOVERY_ENVIRONMENT: ${QOVERY_ENVIRONMENT}
  artifacts:
    paths:
      - deploy.env
    reports:
      dotenv: deploy.env
  environment:
    name: ${CI_PROJECT_NAME}-${CI_COMMIT_REF_NAME}
    url: $DYNAMIC_ENVIRONMENT_URL
    on_stop: qovery:remove:environment
  before_script:
    - !reference [.install-qovery-cli, before_script]
    - !reference [.install-dnsutils, before_script]
  script:
    - !reference [.qovery_tools, script]
    - !reference [.clone-environment-if-not-exists-and-mr, script]
    - set_env DB_ENDPOINT ${DB_ENDPOINT}
    - set_env DB_HOST ${DB_HOST}
    - set_env DB_USERNAME ${DB_USERNAME}
    - set_env DB_PASSWORD ${DB_PASSWORD}
    - set_env DB_BUCKET ${DB_BUCKET}
    - set_env DB_SCOPE "${CI_PROJECT_NAME}-${CI_COMMIT_REF_NAME}"
    - DB_SCOPE="${CI_PROJECT_NAME}-${CI_COMMIT_REF_NAME}"
    - echo "🌍 DB_SCOPE = ${DB_SCOPE}" # 🔎 check
    - echo "DB_SCOPE=${DB_SCOPE}" >> deploy.env # 💾 save the variable for the next job
    - !reference [.create-scope, script]
    - !reference [.deploy-container, script]
    - !reference [.update-environment-url, script]
    - set_env API_ROOT ${DYNAMIC_ENVIRONMENT_URL}
    - echo "API_ROOT=${DYNAMIC_ENVIRONMENT_URL}" >> deploy.env # 💾 save the variable for the next job

```

### Ajouter le job de déprovisionnement d'environnement

Puis ajouter ce job

```yaml

qovery:remove:environment:
  stage: deploy
  image: debian:buster-slim
  rules:
    - if: $CI_MERGE_REQUEST_IID
      when: manual
    - if: $CI_COMMIT_BRANCH == "main"
      when: never
    - if: $CI_COMMIT_TAG
      when: never
  environment:
    name: ${CI_PROJECT_NAME}-${CI_COMMIT_REF_NAME}
    action: stop
  allow_failure: true
  # Install the Qovery CLI
  before_script:
    - !reference [.install-qovery-cli, before_script]
    - !reference [.install-dnsutils, before_script]
  script:
    - !reference [.remove-environment, script]
    - !reference [.drop-scope, script]
```

### Modifier l'application

Modifiez `<title></title>` dans `client/public/index.html` puis

```bash
git add .
git commit -m "📝 index.html"
git push
```
(sur la branche `main`)

Cela va déclenchez un redéploiement. 

⏳ Patientez et vérifier

Dans GitLab, allez à la rubrique **Environments**, vous devriez avoir une ligne avec un lien vers une URL.

### Modifier l'application bis

- Refaite la même chose mais en faisant une **merge request**, puis allez vérifier que vous avez un deuxième environnement (dans GitLab mais aussi dans Qovery).
- Testez l'URL du 2ème environnement
- Mergez pour redéployer en "production" vos modificarions


### Ajouter les tests


```yaml
# -----------------------------
#  🧪 Test application
# -----------------------------

app:test:
  stage: testing
  image: gitpod/workspace-node
  rules:
    # Production
    #- if: $CI_COMMIT_BRANCH == "main"
    # Development
    - if: $CI_MERGE_REQUEST_IID
    # Release
    #- if: $CI_COMMIT_TAG
  artifacts:
    when: always
    reports:
      dotenv: deploy.env
    paths:
      - deploy.env
      - test-results.xml
      - cypress/videos/comments-spec.js.mp4
    reports:
      junit: test-results.xml
  needs:
    - job: qovery:deploy
      artifacts: true
  # Install Cypress and dep
  before_script:
    - !reference [.install-cypress, before_script]
  script:
    - cat deploy.env
    #- source deploy.env
    - !reference [.cypress-run, script]
    - echo "👋📝 content of deploy.env"
    - cat deploy.env
    #- echo "API_ROOT=${API_ROOT}" >> deploy.env # 💾 save the variable for the next job

app:test:micro-benchmark:
  stage: testing
  image: gitpod/workspace-base
  rules:
    # Production
    #- if: $CI_COMMIT_BRANCH == "main"
    # Development
    - if: $CI_MERGE_REQUEST_IID
    # Release
    #- if: $CI_COMMIT_TAG
  artifacts:
    when: always
    reports:
      dotenv: deploy.env
    paths:
      - deploy.env
      - benchmark.txt
  needs:
    - job: app:test
      artifacts: true
  # Install Hey
  before_script:
    - !reference [.install-hey, before_script]
  script:
    - echo "👋📝 content of deploy.env"
    - cat deploy.env
    - !reference [.hey-run, script]
```

```bash
git add .
git commit -m "📝 add test"
git push
```
