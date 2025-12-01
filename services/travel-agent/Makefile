.PHONY: setup test run-local

setup:
	python3 -m venv venv
	. venv/bin/activate && pip install -r requirements.txt

test:
	pytest

run-local:
	export FLASK_APP=src/main.py && flask run
