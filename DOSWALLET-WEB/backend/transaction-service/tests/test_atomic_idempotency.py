import pytest
import sys, os

# Skip tests early if mysql connector is not installed or DB not reachable
try:
    import mysql.connector  # noqa: F401
except Exception:
    pytest.skip("mysql connector not installed, skipping DB tests", allow_module_level=True)

import importlib.util

# Utility to load modules from path to avoid name collision among 'models' modules
def load_module_from_path(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

current_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))

# Load transaction-service models
tx_models = load_module_from_path('tx_models', os.path.join(parent_dir, 'models.py'))
# Load wallet-service models
wallet_models = load_module_from_path('wallet_models', os.path.abspath(os.path.join(parent_dir, '..', 'wallet-service', 'models.py')))
# Load shared database helper
db_module = load_module_from_path('shared_db', os.path.abspath(os.path.join(parent_dir, '..', 'shared', 'database.py')))

Transaction = tx_models.Transaction
Wallet = wallet_models.Wallet
execute_query = db_module.execute_query

TEST_SENDER = 99991
TEST_RECEIVER = 99992


def setup_module(module):
    # Cleanup any existing test data
    execute_query("DELETE FROM transactions WHERE user_id IN (%s,%s) OR receiver_id IN (%s,%s)", (TEST_SENDER, TEST_RECEIVER, TEST_SENDER, TEST_RECEIVER))
    execute_query("DELETE FROM wallets WHERE user_id IN (%s,%s)", (TEST_SENDER, TEST_RECEIVER))


def teardown_module(module):
    # Cleanup test data
    execute_query("DELETE FROM transactions WHERE user_id IN (%s,%s) OR receiver_id IN (%s,%s)", (TEST_SENDER, TEST_RECEIVER, TEST_SENDER, TEST_RECEIVER))
    execute_query("DELETE FROM wallets WHERE user_id IN (%s,%s)", (TEST_SENDER, TEST_RECEIVER))


def test_deposit_and_transfer_idempotency():
    # Deposit to sender
    deposit_tx_id = Transaction.deposit_atomic(TEST_SENDER, 100.0, payment_method="test", description="setup deposit", idempotency_key="setup-dep-1")
    assert deposit_tx_id

    sender_balance = Wallet.get_balance(TEST_SENDER)
    assert float(sender_balance) == pytest.approx(100.0)

    # Perform transfer with idempotency key
    idemp_key = "transfer-123"
    tx1 = Transaction.transfer_atomic(TEST_SENDER, TEST_RECEIVER, 30.0, description="test transfer", idempotency_key=idemp_key)
    # tx1 may be a dict or id
    if isinstance(tx1, dict):
        txid = tx1.get('transaction_id')
    else:
        txid = tx1
    assert txid

    # Balances updated
    assert float(Wallet.get_balance(TEST_SENDER)) == pytest.approx(70.0)
    assert float(Wallet.get_balance(TEST_RECEIVER)) == pytest.approx(30.0)

    # Repeat transfer with same idempotency key -> should not create a second transfer
    tx2 = Transaction.transfer_atomic(TEST_SENDER, TEST_RECEIVER, 30.0, description="test transfer", idempotency_key=idemp_key)
    if isinstance(tx2, dict):
        txid2 = tx2.get('transaction_id')
    else:
        txid2 = tx2
    assert txid2 == txid

    # Balances unchanged
    assert float(Wallet.get_balance(TEST_SENDER)) == pytest.approx(70.0)
    assert float(Wallet.get_balance(TEST_RECEIVER)) == pytest.approx(30.0)


def test_insufficient_funds():
    with pytest.raises(Exception):
        Transaction.transfer_atomic(TEST_SENDER, TEST_RECEIVER, 1000.0, description="too big")


def test_create_and_confirm_payment_idempotency():
    idempotency = 'pay-1'
    # cleanup
    execute_query("DELETE FROM transactions WHERE idempotency_key = %s", (idempotency,))

    tx_id = Transaction.create_payment_request(50.0, description='qr test', idempotency_key=idempotency, qr_payload='QR:PAY1')
    assert tx_id

    tx = Transaction.get_by_id(tx_id)
    assert tx['status'] == 'pending'

    confirmed_id = Transaction.confirm_payment_by_idempotency(idempotency, provider_reference='ref-abc')
    assert confirmed_id == tx_id

    tx2 = Transaction.get_by_id(tx_id)
    assert tx2['status'] == 'completed'


def test_food_delivery_charge_to_merchant():
    # Setup: deposit into user
    execute_query("DELETE FROM transactions WHERE user_id = %s OR receiver_id = %s", (12345, 90001))
    execute_query("DELETE FROM wallets WHERE user_id IN (%s,%s)", (12345, 90001))
    Transaction.deposit_atomic(12345, 200.0, payment_method='test', description='setup', idempotency_key='fd-setup')

    # Charge user and transfer to merchant
    tx = Transaction.transfer_atomic(12345, 90001, 15.0, description='food order', idempotency_key='fd-charge-1')
    if isinstance(tx, dict):
        txid = tx.get('transaction_id')
    else:
        txid = tx
    assert txid
    assert float(Wallet.get_balance(12345)) == pytest.approx(185.0)
    assert float(Wallet.get_balance(90001)) == pytest.approx(15.0)
