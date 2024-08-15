FROM mysql:8.0.35-oraclelinux8

# Create a general log file that we can tail
# Logs must be enabled using the `make logs` command
RUN touch /var/log/mysql-general.log && chmod 777 /var/log/mysql-general.log

ADD ./boot.sql /docker-entrypoint-initdb.d/boot.sql
ADD ./data.sql /docker-entrypoint-initdb.d/data.sql

RUN chmod -R 777 /docker-entrypoint-initdb.d
