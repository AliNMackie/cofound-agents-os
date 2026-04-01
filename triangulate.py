import requests
import json
import os

key = os.environ.get("CH_API_KEY")
companies = [("02259954", "SEASALT LIMITED"), ("08316049", "OONI LIMITED")]

for crn, name in companies:
    print(f"\n{'='*60}")
    print(f"  {name} ({crn})")
    print(f"{'='*60}")

    # Profile
    profile = requests.get(
        f"https://api.company-information.service.gov.uk/company/{crn}",
        auth=(key, "")
    ).json()
    print(f"Status:        {profile.get('company_status')}")
    print(f"Type:          {profile.get('type')}")
    print(f"Incorporated:  {profile.get('date_of_creation')}")
    print(f"SIC Codes:     {profile.get('sic_codes', [])}")
    print(f"Address:       {json.dumps(profile.get('registered_office_address', {}))}")
    accounts = profile.get("accounts", {})
    print(f"Last Accounts: {accounts.get('last_accounts', {}).get('made_up_to', 'N/A')} | Next due: {accounts.get('next_due', 'N/A')}")
    conf = profile.get("confirmation_statement", {})
    print(f"Conf. Stmt:    Last: {conf.get('last_made_up_to', 'N/A')} | Next due: {conf.get('next_due', 'N/A')} | Overdue: {conf.get('overdue', False)}")

    # Charges
    charges_resp = requests.get(
        f"https://api.company-information.service.gov.uk/company/{crn}/charges",
        auth=(key, "")
    )
    if charges_resp.status_code == 200:
        charges = charges_resp.json()
        total = charges.get("total_count", 0)
        outstanding = [c for c in charges.get("items", []) if c.get("status") == "outstanding"]
        satisfied = [c for c in charges.get("items", []) if c.get("status") == "fully-satisfied"]
        print(f"\nCharges:       Total={total} | Outstanding={len(outstanding)} | Satisfied={len(satisfied)}")
        for c in charges.get("items", [])[:8]:
            desc = c.get("classification", {}).get("description", c.get("charge_number", ""))
            created = c.get("created_on", "?")
            satisfied_on = c.get("satisfied_on", "OUTSTANDING")
            persons = [p.get("name", "") for p in c.get("persons_entitled", [])]
            print(f"  [{c.get('status','?'):18}] {desc[:50]} | Filed: {created} | Satisfied: {satisfied_on} | Holder: {', '.join(persons)[:40]}")
    else:
        print("Charges:       None on record")

    # Insolvency
    insolvency_resp = requests.get(
        f"https://api.company-information.service.gov.uk/company/{crn}/insolvency",
        auth=(key, "")
    )
    if insolvency_resp.status_code == 200:
        cases = insolvency_resp.json().get("cases", [])
        print(f"\nInsolvency:    {len(cases)} case(s)")
        for c in cases:
            print(f"  Type: {c.get('type')} | Dates: {c.get('dates')} | Practitioners: {c.get('practitioners')}")
    else:
        print("\nInsolvency:    None on record")

    # Filing history
    filings_resp = requests.get(
        f"https://api.company-information.service.gov.uk/company/{crn}/filing-history?items_per_page=15",
        auth=(key, "")
    )
    if filings_resp.status_code == 200:
        filings = filings_resp.json().get("items", [])
        print(f"\nRecent Filings ({len(filings)} shown):")
        for f in filings:
            print(f"  [{f.get('date', '?')}] {f.get('description', f.get('type', ''))[:80]}")
    else:
        print("\nFiling history unavailable")

print("\nDone.")
