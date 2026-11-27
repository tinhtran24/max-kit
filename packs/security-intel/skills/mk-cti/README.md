# mk-cti

Cyber threat intelligence and OSINT analysis for authorised investigations: domain and tenant reconnaissance, breach and leak checks, identity and infrastructure pivots, darknet monitoring, IOC export and case reports.

## Use

Ask the agent for the investigation you need; the skill loads from `SKILL.md`. New users can start with `experience/tutorial.md`. Methods live in `techniques/`, operator guidance in `handbook/`.

Only investigate targets you are authorised to assess, and follow the case and evidence rules in `SKILL.md`.

## Install

The skill ships in the max-kit `security-intel` pack:

```sh
# max-kit.config.json: "packs": ["security-intel"]
npm run sync
pip3 install -r .claude/skills/mk-cti/scripts/requirements.txt   # Python helpers
```

## Origin and licence

Adapted from the MIT-licensed project at https://github.com/7onez/cti-expert. The full licence text is in the max-kit `THIRD_PARTY_NOTICES.md` (section `mk-cti`).
