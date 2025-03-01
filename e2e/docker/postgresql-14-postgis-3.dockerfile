FROM postgres:14.17-bookworm

# Overcome proxies that may cause apt-get install errors - https://gist.github.com/trastle/5722089
RUN echo 'Acquire::http::Pipeline-Depth 0;\nAcquire::http::No-Cache true;\nAcquire::BrokenProxy true;' >  /etc/apt/apt.conf.d/99fixbadproxy &&\
  apt-get update && \
  # Install postgis - to be activated
  apt-get install -y postgresql-14-postgis-3 && \
  rm -rf /var/lib/apt/lists/*

# Enable postgis extension on startup
COPY ./enable-postgis.sh /docker-entrypoint-initdb.d
