# Contributing

We welcome contributions! Please follow these steps to contribute to the Invoice Agent.

1.  **Create a Branch:**
    Always work on a new branch for every feature or bug fix. Do not push directly to `main`.
    ```bash
    git checkout -b feature/my-new-feature
    ```

2.  **Make Changes:**
    Implement your changes, adhering to the project structure and coding standards defined in `AGENTS.md`.

3.  **Test:**
    Run the test suite to ensure no regressions.
    ```bash
    python3 -m pytest tests/
    ```

4.  **Submit a PR:**
    Push your branch and open a Pull Request.
    Assign a **Jules** task for code review before merging.

5.  **Merge:**
    Once approved and all checks pass, merge into `main`.
