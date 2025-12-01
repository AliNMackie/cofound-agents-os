# DeckSmith Infrastructure Standards

## 🚨 The 3 Golden Rules
All infrastructure in the "Vesper" workspace MUST adhere to these non-negotiable rules.

### 1. Region Lock
*   **Rule:** ALL resources must be deployed in `europe-west2` (London).
*   **Why:** Data sovereignty and latency optimization for UK/EU operations.
*   **Verification:** Check `region` and `location` fields in Terraform.

### 2. Access Control
*   **Rule:** NO public IPs. NO `allUsers`.
*   **Why:** Zero Trust security model.
*   **Implementation:**
    *   Cloud Run: `ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"` or `"INGRESS_TRAFFIC_INTERNAL_ONLY"`.
    *   IAM: Only specific Service Accounts may hold `roles/run.invoker`.

### 3. Data Safety
*   **Rule:** `deletion_protection = true` on ALL stateful resources.
*   **Scope:** Firestore Databases, Cloud Storage Buckets, SQL Instances.
*   **Why:** Prevent catastrophic data loss from accidental Terraform destroys.

---

## 🏗️ Approved Patterns

### Public Web Service
*   **Pattern:** Load Balancer (Global) -> Cloud Armor -> Cloud Run (Internal Ingress).
*   **Note:** Direct public access to Cloud Run is FORBIDDEN.

### Secure Bucket
*   **Pattern:** Private + CMEK (optional) + Versioning + Uniform Access.
*   **Terraform:**
    ```hcl
    resource "google_storage_bucket" "secure_store" {
      location                    = "europe-west2"
      uniform_bucket_level_access = true
      versioning {
        enabled = true
      }
    }
    ```

### Service Accounts
*   **Pattern:** One Service Account per logical component (e.g., `vesper-n8n-sa`, `vesper-scheduler-sa`).
*   **Principle:** Least Privilege. Never use the default Compute Engine service account.
