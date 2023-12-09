## Install dev and compilation dependencies, build files
FROM debian:bookworm-20231120 AS build

# Install compilation dependencies
RUN apt update && apt install -y --no-install-recommends \
    ca-certificates \
    curl \
    xz-utils \
    git  \
    python3  \
    build-essential \
    pkg-config \
    libglib2.0-dev \
    libexpat1-dev

RUN groupadd --gid 1000 goblin \
    && useradd --uid 1000 --gid goblin --shell /bin/bash --create-home goblin \
    && mkdir -p /goblin \
    && chown goblin:goblin /goblin

USER goblin
# install Rust and Node.js
ENV NODE_VERSION=21.4.0
ENV PATH="${PATH}:/home/goblin/.npm/bin:/home/goblin/nodejs/bin:/home/goblin/.cargo/bin"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --no-modify-path
RUN NODEJS_NAME="node-v${NODE_VERSION}-linux-x64" \
   && NODEJS_TAR="${NODEJS_NAME}.tar.xz" \
   && mkdir -p /home/goblin \
   && cd /home/goblin \
   && curl "https://nodejs.org/dist/v${NODE_VERSION}/${NODEJS_NAME}.tar.xz" -o "/home/goblin/${NODEJS_TAR}" \
   && tar xf ${NODEJS_TAR} \
   && mv "${NODEJS_NAME}" nodejs \
   && rm "${NODEJS_TAR}" \
   && corepack enable

# Copy only the cargo dependency-related files first, to cache efficiently
WORKDIR /goblin
COPY --chown=goblin:goblin packages/backend/native-utils/Cargo.toml packages/backend/native-utils/Cargo.toml
COPY --chown=goblin:goblin packages/backend/native-utils/Cargo.lock packages/backend/native-utils/Cargo.lock
COPY --chown=goblin:goblin packages/backend/native-utils/src/lib.rs packages/backend/native-utils/src/
COPY --chown=goblin:goblin packages/backend/native-utils/migration/Cargo.toml packages/backend/native-utils/migration/Cargo.toml
COPY --chown=goblin:goblin packages/backend/native-utils/migration/src/lib.rs packages/backend/native-utils/migration/src/

# Install cargo dependencies
RUN cargo fetch --locked --manifest-path /goblin/packages/backend/native-utils/Cargo.toml


# Copy only the dependency-related files first, to cache efficiently
COPY --chown=goblin:goblin package.json pnpm*.yaml ./
COPY --chown=goblin:goblin packages/backend/package.json packages/backend/package.json
COPY --chown=goblin:goblin packages/client/package.json packages/client/package.json
COPY --chown=goblin:goblin packages/sw/package.json packages/sw/package.json
COPY --chown=goblin:goblin packages/goblin-js/package.json packages/goblin-js/package.json
COPY --chown=goblin:goblin packages/megalodon/package.json packages/megalodon/package.json
COPY --chown=goblin:goblin packages/backend/native-utils/package.json packages/backend/native-utils/package.json
COPY --chown=goblin:goblin packages/backend/native-utils/npm/linux-x64-musl/package.json packages/backend/native-utils/npm/linux-x64-musl/package.json
COPY --chown=goblin:goblin packages/backend/native-utils/npm/linux-arm64-musl/package.json packages/backend/native-utils/npm/linux-arm64-musl/package.json

# Configure corepack and pnpm, and install dev mode dependencies for compilation
RUN corepack install -g pnpm@8.12.0
# && corepack use pnpm@8.12.0
RUN pnpm i --frozen-lockfile
# --frozen-lockfile

# Copy in the rest of the native-utils rust files
COPY --chown=goblin:goblin packages/backend/native-utils packages/backend/native-utils/

# Compile native-utils
RUN pnpm run --filter native-utils build

# Copy in the rest of the files to compile
COPY --chown=goblin:goblin . ./
RUN env NODE_ENV=production sh -c "pnpm run --filter '!native-utils' build && pnpm run gulp"

# Trim down the dependencies to only those for production
RUN pnpm i --prod --frozen-lockfile


############################# Runtime container
FROM debian:bookworm-20231120
ENV PATH="${PATH}:/home/goblin/.npm/bin:/home/goblin/nodejs/bin"

WORKDIR /goblin

# Create a user and install runtime dependencies
RUN groupadd --gid 1000 goblin \
    && useradd --uid 1000 --gid goblin --shell /bin/bash --create-home goblin \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        less \
        mc \
        nano \
        vim \
        procps \
        libc6 \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
#RUN apt update && apt install -y --no-install-recommends \
#    ffmpeg  \
#    vips-dev  \ #TODO
#    zip  \
#    unzip  \
#    nodejs-current #TODO

COPY . ./

COPY --from=build /home/goblin/ /home/goblin/
COPY --from=build /goblin/packages/megalodon /goblin/packages/megalodon

# Copy node modules
COPY --from=build /goblin/node_modules /goblin/node_modules
COPY --from=build /goblin/packages/backend/node_modules /goblin/packages/backend/node_modules
COPY --from=build /goblin/packages/sw/node_modules /goblin/packages/sw/node_modules
COPY --from=build /goblin/packages/client/node_modules /goblin/packages/client/node_modules
COPY --from=build /goblin/packages/goblin-js/node_modules /goblin/packages/goblin-js/node_modules

# Copy the finished compiled files
COPY --from=build /goblin/built /goblin/built
COPY --from=build /goblin/packages/backend/built /goblin/packages/backend/built
COPY --from=build /goblin/packages/backend/assets/instance.css /goblin/packages/backend/assets/instance.css
COPY --from=build /goblin/packages/backend/native-utils/built /goblin/packages/backend/native-utils/built

RUN corepack enable \
    && corepack install -g pnpm@8.12.0
ENV NODE_ENV=production
VOLUME "/goblin/files"
ENTRYPOINT [ "/sbin/bash", "--" ]
CMD [ "pnpm", "run", "build" ]
