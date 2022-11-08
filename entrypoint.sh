yarn hardhat node & > logs

until nc -w30 -z localhost 8545; do
      echo "node not ready"
      sleep 1
done

yarn hardhat run --network localhost scripts/deploy.ts || exit 1
tail -f logs
