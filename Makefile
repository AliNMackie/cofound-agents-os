.PHONY: infra-init infra-apply seed dev-ui install

infra-init:
	cd infrastructure && terraform init

infra-apply:
	cd infrastructure && terraform apply

seed:
	npx ts-node src/scripts/seed-db.ts

dev-ui:
	cd dashboard && npm run dev

install:
	npm install
	cd dashboard && npm install
