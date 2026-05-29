#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKDIR="${OPENDID_WORKDIR:-$BACKEND_DIR/.opendid}"
COMPOSE_DIR="${OPENDID_COMPOSE_DIR:-$WORKDIR/compose}"

ISSUER_CONFIG="$COMPOSE_DIR/issuer-config"
VERIFIER_CONFIG="$COMPOSE_DIR/verifier-config"

ISSUER_DB_URL="${OPENDID_ISSUER_DB_URL:-jdbc:postgresql://opendid-issuer-db:5432/issuer}"
VERIFIER_DB_URL="${OPENDID_VERIFIER_DB_URL:-jdbc:postgresql://opendid-verifier-db:5432/verifier}"
DB_USERNAME="${OPENDID_DB_USERNAME:-omn}"
DB_PASSWORD="${OPENDID_DB_PASSWORD:-omn}"
TAS_URL="${OPENDID_TAS_URL:-http://host.docker.internal:8090}"
LSS_URL="${OPENDID_LSS_URL:-http://host.docker.internal:8098}"
EVM_NETWORK_URL="${OPENDID_EVM_NETWORK_URL:-http://host.docker.internal:8545}"
EVM_CHAIN_ID="${OPENDID_EVM_CHAIN_ID:-1337}"
EVM_CONTRACT_ADDRESS="${OPENDID_EVM_CONTRACT_ADDRESS:-}"
EVM_CONTRACT_PRIVATE_KEY="${OPENDID_EVM_CONTRACT_PRIVATE_KEY:-}"
ISSUER_WALLET_PASSWORD="${OPENDID_ISSUER_WALLET_PASSWORD:-omnioneopendid12!@}"
VERIFIER_WALLET_PASSWORD="${OPENDID_VERIFIER_WALLET_PASSWORD:-omnioneopendid12!@}"

require_file() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "Required file was not found: $file" >&2
    echo "Run: npm run opendid:prepare" >&2
    exit 1
  fi
}

write_issuer_application() {
  require_file "$ISSUER_CONFIG/application.yml"
  cat > "$ISSUER_CONFIG/application.yml" <<EOF
spring:
  application:
    name: Issuer
  profiles:
    active: dev
    group:
        dev:
          - database
          - wallet
          - logging
          - spring-docs
          - blockchain
        sample:
          - database-sample
          - wallet
          - logging
          - spring-docs
          - blockchain
        lss:
          - lss
  jackson:
    default-property-inclusion: non_null
    serialization:
      fail-on-empty-beans: false

server:
  port: 8091

management:
  endpoints:
    web:
      exposure:
        include:
          - "health"
          - "shutdown"
  endpoint:
    health:
      show-details: "never"
    shutdown:
      enabled: true

tas:
  url: $TAS_URL
EOF
}

write_issuer_database() {
  require_file "$ISSUER_CONFIG/application-database.yml"
  cat > "$ISSUER_CONFIG/application-database.yml" <<EOF
spring:
  liquibase:
    change-log: classpath:/db/changelog/master.xml
    enabled: true
  datasource:
    driver-class-name: org.postgresql.Driver
    url: $ISSUER_DB_URL
    username: $DB_USERNAME
    password: $DB_PASSWORD
  jpa:
    open-in-view: true
    show-sql: true
    hibernate:
      ddl-auto: none
      naming:
        physical-strategy: org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy
    properties:
      hibernate:
        format_sql: false
EOF
}

write_issuer_wallet() {
  require_file "$ISSUER_CONFIG/application-wallet.yml"
  cat > "$ISSUER_CONFIG/application-wallet.yml" <<EOF
wallet:
  file-path: /app/config/issuer.wallet
  password: $ISSUER_WALLET_PASSWORD

zkp-wallet:
  file-path: /app/config/issuer-zkp.wallet
  password: $ISSUER_WALLET_PASSWORD
EOF
}

write_verifier_application() {
  require_file "$VERIFIER_CONFIG/application.yml"
  cat > "$VERIFIER_CONFIG/application.yml" <<EOF
spring:
  application:
    name: Verifier
  profiles:
    active: dev
    group:
        dev:
          - databases
          - wallet
          - logging
          - spring-docs
          - verifier
          - blockchain
        sample:
          - databases-sample
          - wallet
          - logging
          - spring-docs
          - verifier
        lss:
          - lss
  jackson:
    default-property-inclusion: non_null
    serialization:
      fail-on-empty-beans: false
  liquibase:
    change-log: classpath:/db/changelog/master.xml
    enabled: true
  datasource:
    driver-class-name: org.postgresql.Driver
    url: $VERIFIER_DB_URL
    username: $DB_USERNAME
    password: $DB_PASSWORD
  jpa:
    open-in-view: true
    show-sql: true
    hibernate:
      ddl-auto: none
      naming:
        physical-strategy: org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy
    properties:
      hibernate:
        format_sql: false

logging:
  level:
    org.omnione: debug

server:
  port: 8092

tas:
  url: $TAS_URL

wallet:
  file-path: /app/config/verifier.wallet
  password: $VERIFIER_WALLET_PASSWORD

springdoc:
  swagger-ui:
    path: /swagger-ui.html
    groups-order: ASC
    operations-sorter: method
    disable-swagger-default-url: true
    display-request-duration: true
  api-docs:
    path: /api-docs
  show-actuator: true
  default-consumes-media-type: application/json
  default-produces-media-type: application/json

management:
  endpoints:
    web:
      exposure:
        include: health, shutdown, refresh
  endpoint:
    shutdown:
      enabled: true
    startup:
      enabled: true
EOF
}

write_blockchain_config() {
  local dir="$1"
  require_file "$dir/application-blockchain.yml"
  require_file "$dir/blockchain.properties"

  cat > "$dir/application-blockchain.yml" <<EOF
blockchain:
  file-path: /app/config/blockchain.properties
EOF

  cat > "$dir/blockchain.properties" <<EOF
fabric.mspId=Org1MSP

fabric.configFilePath=
fabric.privateKeyFilePath=
fabric.certificateFilePath=
fabric.networkName=mychannel
fabric.chaincodeName=opendid

evm.network.url=$EVM_NETWORK_URL
evm.chainId=$EVM_CHAIN_ID
evm.gas.limit=10000000
evm.gas.price=0
evm.connection.timeout=10000

evm.contract.address=$EVM_CONTRACT_ADDRESS
evm.contract.privateKey=$EVM_CONTRACT_PRIVATE_KEY
EOF
}

write_lss_config() {
  local file="$1/application-lss.yml"
  if [ -f "$file" ]; then
    cat > "$file" <<EOF
lss:
  url: $LSS_URL
EOF
  fi
}

require_file "$COMPOSE_DIR/docker-compose.yml"
write_issuer_application
write_issuer_database
write_issuer_wallet
write_verifier_application
write_blockchain_config "$ISSUER_CONFIG"
write_blockchain_config "$VERIFIER_CONFIG"
write_lss_config "$ISSUER_CONFIG"
write_lss_config "$VERIFIER_CONFIG"

cat <<EOF

OpenDID local compose config patched:
  $COMPOSE_DIR

Applied:
  issuer profile: dev
  verifier profile: dev
  issuer DB: $ISSUER_DB_URL
  verifier DB: $VERIFIER_DB_URL
  TAS URL: $TAS_URL
  LSS URL: $LSS_URL
  EVM URL: $EVM_NETWORK_URL

Still required before full OpenDID issuance:
  - create or mount real issuer/verifier wallet files
  - set wallet passwords through OPENDID_ISSUER_WALLET_PASSWORD / OPENDID_VERIFIER_WALLET_PASSWORD
  - set EVM contract address/private key if the selected profile requires chain writes
  - confirm TA/API server availability at $TAS_URL
EOF
