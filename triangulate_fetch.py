import requests
import json
import os
import sys

key = os.environ.get("CH_API_KEY")
companies = [("02259954", "SEASALT LIMITED"), ("08316049", "OONI LIMITED")]

results = {}

for crn, name in companies:
    data = {}

    profile = requests.get(
        f"https://api.company-information.service.gov.uk/company/{crn}",
        auth=(key, "")
    ).json()
    data["profile"] = profile

    charges_resp = requests.get(
        f"https://api.company-information.service.gov.uk/company/{crn}/charges",
        auth=(key, "")
    )
    data["charges"] = charges_resp.json() if charges_resp.status_code == 200 else {}

    insolvency_resp = requests.get(
        f"https://api.company-information.service.gov.uk/company/{crn}/insolvency",
        auth=(key, "")
    )
    data["insolvency"] = insolvency_resp.json() if insolvency_resp.status_code == 200 else {}

    filings_resp = requests.get(
        f"https://api.company-information.service.gov.uk/company/{crn}/filing-history?items_per_page=15",
        auth=(key, "")
    )
    data["filings"] = filings_resp.json() if filings_resp.status_code == 200 else {}

    results[crn] = {"name": name, "data": data}

with open("triangulate_raw.json", "w") as f:
    json.dump(results, f, indent=2)

print("Raw data written to triangulate_raw.json")
