#!/bin/bash
set -e

if [ "$USE_MYSQL" = "True" ] || [ "$USE_MYSQL" = "true" ] || [ "$USE_MYSQL" = "1" ]; then
    echo "Aguardando o banco de dados MySQL ($DB_HOST:$DB_PORT) estar pronto e aceitando conexões..."
    while ! python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.db import connection
connection.cursor()
" 2>/dev/null; do
        sleep 2
    done
    echo "MySQL pronto, autenticado e acessível!"
fi

echo "Executando migrações..."
python manage.py migrate --noinput

if [ "$RUN_SEED" = "True" ] || [ "$RUN_SEED" = "true" ] || [ "$RUN_SEED" = "1" ]; then
    echo "Executando seed de dados..."
    python seed_data.py
fi

echo "Iniciando aplicação: $@"
exec "$@"
