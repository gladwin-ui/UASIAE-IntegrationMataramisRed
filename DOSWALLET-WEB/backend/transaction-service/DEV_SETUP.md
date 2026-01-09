# Transaction Service - Developer Setup

To run tests and use the transaction service locally, ensure the following:

1. Install Python dependencies

```bash
python -m pip install -r backend/transaction-service/requirements.txt
```

2. Ensure a MySQL server is running and your `.env` in the project root (or backend/.env) contains the correct DB settings for `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

3. Run the services (in separate terminals or via `start_all_services`):

- `python start_all_services.py` (project root) or
- `docker-compose up --build -d`

4. Run tests:

```bash
pytest backend/transaction-service/tests/test_atomic_idempotency.py -q -s
```

Note: Tests will auto-skip if the MySQL Python driver (`mysql-connector-python`) is not installed.
