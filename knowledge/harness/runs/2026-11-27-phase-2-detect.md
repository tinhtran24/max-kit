---
features: [MK-DETECT-001]
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: "709f294"
---

# Run 2026-11-27: phase-2-detect

## Approach

Detection only proposes values and --write fills empty fields, so user settings are never overwritten. High tier because profiles change which commands the guards block or confirm. Rollback: revert the branch.

## Verification

| Round | Covered | Result |
| --- | --- | --- |
| 1 | Golden detection for 9 sample repos (rails rspec and minitest, laravel with pest, django with pytest, go with goose, node with prisma and pnpm, node without tests, php with dbmate, plain); detect --write merge rules; init --detect; migration guard per stack with generator and container; rails risky commands | passed |

```sh
npm test
npm run check
```

Output summary: `ℹ tests 45 ℹ pass 45 ℹ fail 0`; check: `check passed`.

## Remaining

- Monorepos with several stacks in one checkout get the first matching profile; out of scope for now.
- Not yet run against real production repos; only fixtures.
