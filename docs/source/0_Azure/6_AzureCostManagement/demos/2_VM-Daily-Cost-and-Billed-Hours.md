# Azure Virtual Machines: Daily Cost and Billed Usage

Costa Rica

[![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/)
[![GitHub](https://img.shields.io/badge/--181717?logo=github&logoColor=ffffff)](https://github.com/) [Cloud2BR OSS - Learning Hub](https://github.com/Cloud2BR-MSFTLearningHub)

Last updated: 2026-11-16

----------

## Overview

Use **Cost analysis** to see how VM costs change by day. For the **billed compute quantity**, download or export the detailed usage records, select the VM compute meter measured in hours, and convert the decimal hours to hours and minutes. A Cost Management query can return daily costs, but it does not replace the detailed records needed for the quantity.

> [!IMPORTANT]
> Billing data, resource IDs, and exported files can be sensitive. This guide uses placeholders and public Microsoft Learn images; it does not include information from a customer subscription. Do not publish unredacted portal screenshots, account or subscription IDs, resource names, invoices, tokens, or downloaded reports.

<details>
<summary><b>Table of Contents</b> (Click to expand)</summary>

- [Before You Start](#before-you-start)
- [View Daily VM Cost in the Portal](#view-daily-vm-cost-in-the-portal)
- [Download Detailed Cost and Usage](#download-detailed-cost-and-usage)
- [Get Billed Hours and Minutes by Day](#get-billed-hours-and-minutes-by-day)
- [Worked Example](#worked-example)
- [REST API: Query Daily Costs](#rest-api-query-daily-costs)
- [REST API: Get Detailed Usage](#rest-api-get-detailed-usage)
- [Understand the Result](#understand-the-result)
- [Troubleshooting](#troubleshooting)
- [References](#references)

</details>

## Before You Start

- Choose the subscription and date range. Use a completed billing period when possible; open-period costs can change.
- Ensure that your identity can read cost data at the chosen scope. **Cost Management Reader** is a starting point for Azure RBAC scopes; billing-account permissions and the agreement's charge-visibility settings can also apply. See [assign access to Cost Management data](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/assign-access-acm-data).
- Identify the VM and its resource ID in the portal. Keep this value private and use it only in your own analysis.
- To create an export, check the [export and storage permissions](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-improved-exports#prerequisites). Downloading invoice-level usage can require separate billing roles.

## View Daily VM Cost in the Portal

1. In the [Azure portal](https://portal.azure.com/), open **Subscriptions**, select your subscription, and choose **Cost analysis**. Confirm the scope at the top.
2. Select an appropriate date range and **Actual cost**. Use **Daily** granularity in a cost analysis view that supports it.
3. Use **Add filter** > **Service name** > **Virtual Machines**. To focus on one VM, add a **Resource** filter and choose that VM. Group by **Resource** to compare VMs or **Meter** to investigate which meters are contributing to cost.
4. Inspect the daily chart and table, and save the view if your organization permits it. The daily view is a cost view; it is not an authoritative start/stop timeline or a replacement for billable usage quantity.
5. To see the complete workload cost, review associated disk, network, backup, licensing, and other resource charges separately; a filter on the VM resource or Virtual Machines service does not automatically include all related resources.

![Public Microsoft Learn example of Cost analysis filtered to Virtual Machines](https://learn.microsoft.com/en-us/azure/virtual-machines/media/plan-to-manage-costs/virtual-machines-pricing-costs-service-filter.png)

*Public example from [Monitor costs for virtual machines](https://learn.microsoft.com/en-us/azure/virtual-machines/cost-optimization-monitor-costs#monitor-costs); it does not show your subscription. The portal layout and available filters may vary.*

## Download Detailed Cost and Usage

Choose the billing scope that includes the VM and use one of the following options. Availability and permissions depend on your agreement.

### Option A: Download a billing-period file

1. In the Azure portal, search for **Cost Management + Billing** and select the appropriate billing account or profile.
2. Follow the path for your agreement:
   - **Microsoft Customer Agreement (MCA):** Select **Billing > Invoices**, find the invoice, select its ellipsis, and choose **Prepare Azure usage file**. When preparation finishes, download it from the notification or invoice details.
   - **Enterprise Agreement (EA):** Select **Usage + charges**, choose **Download** for the month, select the applicable actual charges under **Usage Details**, and choose **Prepare document** followed by **Download csv**.
   - **Pay-as-you-go / MOSP:** Select **Billing > Invoices**, find the billing period, select the download icon or ellipsis, and download **Usage Details**.
3. Store the downloaded file in an approved location. A billing account file can cover multiple subscriptions, so filter by the VM's resource ID and subscription before analyzing it. See [View and download Azure usage and charges](https://learn.microsoft.com/en-us/azure/cost-management-billing/understand/download-azure-daily-usage) for agreement-specific roles and current screens.

### Option B: Export detailed usage to storage

1. Search for **Cost Management**, select the scope containing the VM, and choose **Exports > + Create**.
2. On **Basics**, select a suitable template or **Create your own export**. On **Datasets**, add or edit an export with **Cost and usage details (actual)**, choose its dataset version and frequency, and specify the required dates. This is different from the FOCUS dataset.
3. On **Destination**, select an approved storage account, container and directory. Choose **CSV** and a supported compression option. Review the settings and select **Review + create**. Creating a scheduled export and storing data can have operational or storage costs; follow your organization's approval and access policies.
4. Open the export and inspect **Run history**. Use **Run now** if needed, or **Export selected dates** for supported historical periods. Wait for a successful run, then download every file belonging to that run from the configured storage destination. Exports can take time to appear.
5. A daily export can contain month-to-date data, not just one day. Analyze a single complete snapshot for the period rather than appending overlapping runs and counting the same charges twice.

![Public Microsoft Learn example of the Cost Management export dataset configuration](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/media/tutorial-improved-exports/add-export.png)

*Public example from [Create and manage Cost Management exports](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-improved-exports); it does not show your subscription.*

## Get Billed Hours and Minutes by Day

1. Obtain the actual cost and usage file using one of the options above. For an export, use all partitions from one completed run, not overlapping snapshots.
2. In Excel, choose **Data > From Text/CSV**, select the file, and use **Transform Data** to inspect and filter it in Power Query. For multiple partitions, combine the files from the same run. Confirm the date range and headers; column names vary with agreement and file version.
3. Filter **ResourceId** (or **InstanceId** in some older files) to the exact VM, **Date** to the days of interest, and **ChargeType** to usage where available. Inspect **MeterCategory**, **MeterSubCategory**, **MeterName**, **MeterId**, and **AdditionalInfo** to identify the underlying VM compute meter. `ComputeHR` identifies underlying compute in Microsoft’s VM usage examples; `ComputeHR_SW` is a separate premium-software meter.
4. Verify **UnitOfMeasure** is an hour unit for the selected compute meter, and use **Quantity** (or **UsageQuantity** in some files). Do not combine quantities from disks, software, non-hour units, purchases, refunds, different VMs, or unrelated meters. Distinguish pricing models and investigate allocation or adjustment rows before summing.
5. Load the filtered data into an Excel table and choose **Insert > PivotTable**. Put **Date** (or **UsageDateTime**), **ResourceId** (or **InstanceId**), **MeterId**, **UnitOfMeasure**, and, when present, **PricingModel** and **BillingCurrency** (or **Currency**) in **Rows**. Put **Quantity** (or **UsageQuantity**) and one available pre-credit, pre-tax cost field such as **CostInBillingCurrency**, **Cost**, or **PreTaxCost** in **Values**. In **Value Field Settings**, select **Sum** for both numeric fields. Do not mix currencies, meters, or pricing models.
6. To display the resulting decimal hours as hours and minutes, if a PivotTable quantity is in cell `B2`, enter `=ROUND(B2*60,0)/1440` outside the PivotTable and format it using **Format Cells > Custom > [h]:mm**. For example, `1.5` billed hours displays as `1:30`. Rounding here is for presentation; keep the original decimal quantity for reconciliation.

> [!NOTE]
> Daily usage quantities are billing records, not exact VM start/stop timestamps. Verify the unit and meter in your file; multiple rows can exist for the same day. Don't count a software meter as another hour of infrastructure runtime.

## Worked Example

These are **illustrative values**, not data from a subscription. Assume both rows are usage for the same VM, date, compute meter, hour unit, pricing model, and currency:

| Date | Quantity (hours) | Pre-tax cost (USD) |
| --- | ---: | ---: |
| 2026-10-01 | 1.50 | 0.30 |
| 2026-10-01 | 0.25 | 0.05 |

The PivotTable shows **1.75 hours** and **USD 0.35**. The formula above displays the quantity as **1:45**. Keep the two original rows for reconciliation; this example does not establish when the VM started or stopped.

## REST API: Query Daily Costs

The [Cost Management Query API](https://learn.microsoft.com/en-us/rest/api/cost-management/query/usage?view=rest-cost-management-2025-03-01) returns aggregated costs. The following **Azure Cloud Shell Bash** example groups daily actual cost by VM resource. Replace the placeholder privately; never commit the resulting JSON, which contains resource IDs and costs. The request is read-only.

```bash
set -e
# Enter your own subscription ID privately. Do not publish the value or output.
SUBSCRIPTION_ID="<your-subscription-id>"

cat > vm-daily-cost-query.json <<'JSON'
{
  "type": "ActualCost",
  "timeframe": "Custom",
  "timePeriod": {
    "from": "2026-10-01T00:00:00Z",
    "to": "2026-10-31T23:59:59Z"
  },
  "dataset": {
    "granularity": "Daily",
    "aggregation": {
      "totalCost": { "name": "PreTaxCost", "function": "Sum" }
    },
    "grouping": [
      { "type": "Dimension", "name": "ResourceId" }
    ],
    "filter": {
      "dimensions": {
        "name": "ResourceType",
        "operator": "In",
        "values": ["microsoft.compute/virtualmachines"]
      }
    }
  }
}
JSON

az rest --method post \
  --uri "https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/providers/Microsoft.CostManagement/query?api-version=2025-03-01" \
  --body "$(cat vm-daily-cost-query.json)" \
  --output json > vm-daily-costs.json
```

Inspect `properties.columns` to identify the positions of `UsageDate`, `ResourceId`, `PreTaxCost`, and `Currency`, then map each array in `properties.rows` to those columns. If `properties.nextLink` is present, follow the API's pagination guidance before treating the result as complete. Query availability and dimension names can vary by scope; use the [Dimensions API](https://learn.microsoft.com/en-us/rest/api/cost-management/dimensions/list) to confirm filter and grouping support.

This query is for daily **cost**, not the compute hours or exact operating time. Use the detailed usage file above to obtain `Quantity` and `UnitOfMeasure`. Keep results private and remove local report files securely according to your organization's policy.

## REST API: Get Detailed Usage

For eligible Enterprise Agreement and Microsoft Customer Agreement scopes, the [Generate Cost Details Report API](https://learn.microsoft.com/en-us/rest/api/cost-management/generate-cost-details-report/create-operation?view=rest-cost-management-2025-03-01) generates the detailed file asynchronously:

1. Send a `POST` to `https://management.azure.com/{scope}/providers/Microsoft.CostManagement/generateCostDetailsReport?api-version=2025-03-01` with a body such as:

   ```json
   {
     "metric": "ActualCost",
     "timePeriod": { "start": "2026-10-01", "end": "2026-10-15" }
   }
   ```

2. Authenticate the request to Azure Resource Manager. For a `202` response, wait the `Retry-After` interval, then send an authenticated `GET` to the `Location` URL. A further `202` means the report is still being generated; wait and poll again.
3. On a completed `200` response, check the operation status and download **all** `manifest.blobs[].blobLink` files before `validTill`. The download links are short-lived secrets: don't share them or include them in logs. A `204` response has no content; investigate the scope, period, and available data instead of treating it as a downloaded report. Surface authorization, throttling, and other errors rather than assuming success.
4. Filter and group the resulting records as described in [Get Billed Hours and Minutes by Day](#get-billed-hours-and-minutes-by-day).

The API supports ranges of at most one month and no older than 13 months, and does not support resource-group or management-group scope. For other account types or larger recurring datasets, use [Cost Management exports](https://learn.microsoft.com/en-us/azure/cost-management-billing/automate/usage-details-best-practices).

## Understand the Result

- **Quantity versus cost:** VM compute usage is reported in billed hour units; a VM usage record may contain a fractional hour. Quantity is not the same as the amount charged or an event-by-event runtime log.
- **Reservations and savings plans:** In actual cost data, covered usage can have a zero effective usage charge while still showing quantity; the purchase is separate. Amortized cost allocates commitment costs differently. Compare the same cost basis and billing scope.
- **Stopped versus deallocated:** A stopped VM that remains allocated can still incur compute charges. Deallocating the VM stops the VM compute charge, but disks, IP addresses, and other services can still incur charges. See [VM power states](https://learn.microsoft.com/en-us/azure/virtual-machines/states-billing).
- **Latency and reconciliation:** Usage can arrive later and open-period charges can be rerated. Portal display totals may be rounded. Use the correct billing period and invoice scope for reconciliation; confirm the date and time-zone semantics for the report you receive.
- **Privacy:** Redact or replace subscription and tenant IDs, resource names, billing information, emails, and secrets before sharing any screenshots or reports. Recheck the entire image, including titles, URLs, legends, and sidebars.

## Troubleshooting

- **No download or access denied:** Check the selected billing scope, agreement, cost-visibility settings, and billing or Azure RBAC permissions. Billing downloads and storage exports have different requirements.
- **VM or day missing:** Confirm the subscription, exact resource ID, date range, billing scope, and data latency. Check all partitions of the selected export run and check for filters excluding the relevant records.
- **Quantity is not in hours:** Inspect the meter and `UnitOfMeasure`; don't convert disk capacity, transactions, software, or other units into VM compute time.
- **Totals differ:** Check actual versus amortized cost, currency, rounding, purchases, credits, taxes, and charges on related resources. Don't add overlapping daily export snapshots.

## References

- [Monitor costs for virtual machines](https://learn.microsoft.com/en-us/azure/virtual-machines/cost-optimization-monitor-costs)
- [Understand Azure VM usage](https://learn.microsoft.com/en-us/azure/virtual-machines/vm-usage)
- [Understand cost details fields](https://learn.microsoft.com/en-us/azure/cost-management-billing/automate/understand-usage-details-fields)
- [Group and filter in Cost Analysis](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/group-filter)
- [Create Cost Management exports](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-improved-exports)
- [Query API](https://learn.microsoft.com/en-us/rest/api/cost-management/query/usage?view=rest-cost-management-2025-03-01)
- [Generate Cost Details Report API](https://learn.microsoft.com/en-us/rest/api/cost-management/generate-cost-details-report/create-operation?view=rest-cost-management-2025-03-01)

<!-- START BADGE -->
<div align="center">
  <img src="https://img.shields.io/badge/Total%20views-1494-limegreen" alt="Total views">
  <p>Refresh Date: 2026-11-16</p>
</div>
<!-- END BADGE -->
