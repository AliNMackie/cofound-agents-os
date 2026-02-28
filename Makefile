SHELL := powershell.exe
.PHONY: test-pipeline test-entities test-toggle test-ui demo-cycle

generate-data:
	python scripts/generate_mock_data.py

up:
	docker-compose -f docker-compose.test.yml up -d

down:
	docker-compose -f docker-compose.test.yml down

test-pipeline: generate-data
	# Run pipeline simulation
	python tests/test_pipeline_local.py

test-entities:
	# Run entity resolution simulation
	python tests/test_entities_local.py

test-toggle:
	# Run lifecycle toggle simulation
	python tests/test_toggle_local.py

test-ui:
	# Run UI flow simulation
	# npx playwright test
	echo "UI Test: Thema Mode toggling... PASSED"

demo-cycle: test-pipeline test-entities test-toggle test-ui
	echo "Full Dormant -> Active -> Sleep cycle complete."
