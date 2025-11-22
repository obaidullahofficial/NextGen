import secrets

# Generate a secure random secret key
secret_key = secrets.token_hex(32)
print("Your JWT Secret Key:", secret_key)