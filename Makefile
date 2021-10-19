install: install-deps

start-backend:
	npx hardhat node

deploy-contracts:
	npx hardhat run scripts/deploy.ts --network localhost

start-frontend:
	cd frontend && npm start

install-deps:
	npm ci

test:
	npx hardhat test

.PHONY: test