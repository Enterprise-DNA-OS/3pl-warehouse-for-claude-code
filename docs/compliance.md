# Warehouse record checks

Default jurisdiction: New Zealand. Sources checked 1 October 2026. These checks flag missing records for a responsible person. They do not assess an incident, notify a regulator, authorise work or certify compliance. Australian state rules and specialist goods handling require their own reviewed configuration.

| Rule | Implemented check | Source |
|---|---|---|
| NZ-HSWA-56 | A record marked notifiable without a notification date is flagged immediately. | [WorkSafe notification guidance](https://www.worksafe.govt.nz/notifications/what-events-need-to-be-notified/), HSWA section 56: notify as soon as possible after becoming aware. |
| NZ-HSWA-57 | Retain-until must be at least five calendar years after the notification date. | [WorkSafe notification guidance](https://www.worksafe.govt.nz/notifications/what-events-need-to-be-notified/), HSWA section 57. |
| POLICY-EXPIRY | Expired lots appear in compliance and cannot be allocated or dispatched. | Warehouse operating policy, not a statutory expiry rule. |
| POLICY-QUARANTINE | Quarantined lots are reported and cannot be allocated or dispatched. | Warehouse operating policy, not a claim about a legal hold. |

The operator classifies incidents and records actual notification evidence. A missing notification is urgent and must be handled through the appropriate regulator’s process. A populated date is not proof that notification was timely. The application offers no delete command for incident records. Backups and access controls must preserve them through the retention period.

Use `set incidents <name> --data=<file>` to record notification and retention dates from evidence. Use `hold` and `release` with a reason for stock decisions. A release does not bypass an expiry block. Capacity, rates and pallet rounding are operational controls, not statutory compliance. Dangerous goods, cold-chain monitoring, customs and food safety certification are outside this base.
