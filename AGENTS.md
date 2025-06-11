All code changes in this repository require running the same checks that GitHub Actions runs.

Run the following commands from the repository root before committing:

```
npm ci
just ci
```

If any of these commands fail, include the output in your PR description.

If `just ci` fails due to formatting errors reported by Biome, you can fix them
automatically by running:

```
npm run lint
```
This will apply Biome's formatting fixes to the entire repository.
