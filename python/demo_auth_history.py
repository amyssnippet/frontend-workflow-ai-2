"""
Simple demo script to exercise signup, signin, autosave and history list endpoints.
Requires running server on https://flowai-backend.othersys.com
"""
import requests

BASE = "https://flowai-backend.othersys.com"

# 1. Signup
resp = requests.post(f"{BASE}/signup", json={"username": "demo_user", "email": "demo@example.com", "password": "secret123"})
print('signup', resp.status_code, resp.text)

# 2. Signin
resp = requests.post(f"{BASE}/signin", json={"identifier": "demo_user", "password": "secret123"})
print('signin', resp.status_code, resp.text)
if resp.ok:
    data = resp.json()
    access = data.get('access_token')
    refresh = data.get('refresh_token')
    headers = {"Authorization": f"Bearer {access}"}

    # 3. Autosave (create)
    resp2 = requests.post(f"{BASE}/autosave", headers=headers, json={"type": "mermaid", "title": "Demo autosave", "content": "graph TD; A-->B;"})
    print('autosave create', resp2.status_code, resp2.text)
    hid = resp2.json().get('id')

    # 4. Autosave (update)
    resp3 = requests.post(f"{BASE}/autosave", headers=headers, json={"id": hid, "content": "graph TD; A-->B; B-->C;"})
    print('autosave update', resp3.status_code, resp3.text)

    # 5. List history
    resp4 = requests.get(f"{BASE}/history/list", headers=headers)
    print('history list', resp4.status_code, resp4.text)

    # 6. Refresh token
    resp5 = requests.post(f"{BASE}/refresh", json={"refresh_token": refresh})
    print('refresh', resp5.status_code, resp5.text)

else:
    print('signin failed, cannot demo further')
