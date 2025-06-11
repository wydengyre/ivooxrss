All code changes in this repository require running the same checks that GitHub Actions runs.

Run the following commands from the repository root before committing:

```
npm ci
just ci
```

If any of these commands fail, include the output in your PR description.

If `just ci` fails because Biome reports formatting issues, you can apply
Biome's fixes automatically by running:

```
just lint
```
This target runs `npm run lint` for you and formats the entire repository.
