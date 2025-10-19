import requests


api_key = "9bHVpkFYQULtfv6rgpYrRC3pI4OPSkGt"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

model_name = "mistral-7b-instruct" 

data = {
    "model": model_name,
    "messages": [
        {"role": "user", "content": "Define Mental Health"}
    ]
}

url = "https://api.mistral.ai/v1/completions"

try:
    response = requests.post(url, headers=headers, json=data)
    result = response.json()

    if "choices" in result:

        print(result["choices"][0]["message"]["content"])
    elif "object" in result and result["object"] == "error":
       
        print("API error:", result["message"])
    else:
        print(result)

except requests.exceptions.RequestException as e:
    print("Request failed:", e)