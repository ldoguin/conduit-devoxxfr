FROM python:3-slim-buster
RUN apt update && apt upgrade -y && apt install curl build-essential -y
COPY ./client ./client
COPY ./server ./server
SHELL ["/bin/bash", "-c"]

# nvm environment variables
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 18.15.0
# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash \
    && source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm install -g npm && cd client && npm install \
    && NODE_OPTIONS=--openssl-legacy-provider npm run build \
    && cp -r build/* ../server/public/ && cd ../server && npm install && rm -rf ../client

RUN apt remove curl build-essential -y && rm -rf /var/lib/apt/lists/*

WORKDIR ./server
CMD [ "npm", "run", "start" ]