import requests

def get_pkr_to_usd_rate():
    """Fetch the current PKR to USD exchange rate from exchangerate-api.com or similar."""
    try:
        # You can use any reliable free API. Here is an example with exchangerate-api.com
        # Replace 'YOUR_API_KEY' with your actual API key if required
        url = "https://open.er-api.com/v6/latest/PKR"
        response = requests.get(url, timeout=5)
        data = response.json()
        usd_rate = data['rates']['USD']
        return usd_rate
    except Exception as e:
        print(f"[Currency Conversion Error] {e}")
        # Fallback to a fixed rate if API fails (update as needed)
        return 0.0036  # Example: 1 PKR = 0.0036 USD (update this value regularly)