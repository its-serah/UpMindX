import requests

api_key = "9bHVpkFYQULtfv6rgpYrRC3pI4OPSkG"  # replace with your API key
headers = {"Authorization": f"Bearer {api_key}"}
url = "https://api.mistral.ai/v1/models"

response = requests.get(url, headers=headers)
print(response.json())
