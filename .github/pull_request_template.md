## Summary

-

## Use Cases

- [ ] UC-01 Takeout ZIP import
- [ ] UC-02 YouTube share save
- [ ] UC-03 Daily review
- [ ] UC-04 Weekly report
- [ ] UC-05 Optional AI insight
- [ ] Other / not applicable:

## Harness Checks

- [ ] I followed `AGENTS.md`.
- [ ] I kept UI, domain logic, infrastructure, and native code in their proper layers.
- [ ] I updated tests for changed domain/application behavior.
- [ ] I updated docs or ADRs for product, privacy, Drive, AI, payment, or sync decisions.

## Privacy Checks

- [ ] No raw Takeout/watch-history/user-note data is uploaded by default.
- [ ] No broad Drive scope was added.
- [ ] Sensitive values are not logged.
- [ ] User deletion behavior is preserved or documented.

## Verification

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Android build or device smoke test, if native code changed
