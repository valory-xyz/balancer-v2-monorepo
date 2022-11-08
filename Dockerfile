FROM node:14.20.0 as safe-builder
COPY pkg/pool-utils/safe-contracts /app
WORKDIR /app

# in case the build fails because it cannot download the solidity compilers
# run these commands locally, and comment them out from here. Notice the path!
RUN yarn
RUN yarn build

FROM node:14.20.0 as balancer-builder

ENV USE_SAFE_CONTRACTS='true'

COPY . /app
WORKDIR /app

COPY --from=safe-builder /app/build/artifacts pkg/pool-utils/safe-contracts/build/artifacts

# in case the build fails because it cannot download the solidity compilers
# run these commands locally, and comment them out from here. Notice the path!
RUN yarn
RUN yarn build

RUN rm -rf pkg/deployments
WORKDIR /app/pkg/pool-utils/

RUN apt-get update && apt-get install -y netcat

ENTRYPOINT ["bash", "/app/entrypoint.sh"]
