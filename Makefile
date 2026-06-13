.PHONY: deploy test dev

deploy:
	genlayer deploy --contract contracts/DAOGuard.py --args "$(CHARTER)"

test:
	genlayer call $(ADDR) stats

dev:
	python3 -m http.server 3000 --directory ui/
