###
# This Makefile provides portable, stack-agnostic commands (unlike npm)
#
# These commands are meant to be run from your local machine, not from
# within the docker container. Each command handles exec'ing into the
# docker container to run the command

ifneq (,)
	This makefile requires GNU Make.
endif

test:
	docker exec -it rnv_test_nestjs npm run test

exec:
	docker exec -it rnv_test_nestjs sh

rebuild:  
	docker-compose down -v && \
	docker-compose up --build


# Prevents the makefile from accessing a file/folder, when
# a file/folder with the same name exists in the root of the project
# E.g. `make test` would try to "make" a "test" folder if it existed in the root
.PHONY: test \
	exec \
	rebuild
