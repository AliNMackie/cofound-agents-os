import json

with open('plan_v3.json', 'r') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'resource_drift' or data.get('type') == 'planned_change':
            change = data.get('change', {})
            reason = change.get('action', '')
            if 'delete' in change.get('actions', []):
                print(f"DEBUG: Resource {change.get('address')} is being {change.get('actions')}")
                if change.get('reason'):
                     print(f"REASON: {change.get('reason')}")
                
                # Check for "forces replacement" info in the change details
                # In the JSON plan, look for "before" and "after" diffs for fields with "requires_new"
