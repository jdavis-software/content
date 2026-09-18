# Go test-cache semantics probe

From the repository root, with Node 22+ and an installed Go 1.23+ toolchain:

```bash
node examples/go-cache/verify.mjs
```

The script copies this standard-library-only fixture into a fresh temporary directory, gives it private build/module caches, disables network dependency/toolchain downloads and Go workspace discovery, then checks:

1. The first package-list test runs.
2. The identical invocation reports `(cached)`.
3. `-count=1` executes the tests again without purging compilation outputs.

It cleans only its own temporary directory. It does not use `go clean`, touch PostgreSQL, run Docker, or modify global Go configuration. No npm install is required. Compilation of the standard library into the temporary cache can take time. The Go version in the result is the actual local compiler; the module directive is a minimum for this small fixture, not a recommended production toolchain pin.

This checks cache semantics, not speed, isolation of a real application, database correctness, or workflow replay. Results with a vendor-modified Go command may differ and will fail rather than be silently accepted.
