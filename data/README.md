Data files to feed visualizations.

# inci-a-15m.json
SQS metrics for a bunch of job queues (incl available message count for DLQs)
over a 4-day period during a bottleneck incident.
- Aggregated into 15m (900s) bins
- NumberOf- metrics are reduced by sum()
- ApproximateNumberOf- metrics are reduced by max()
- Values in reverse chronological order
- Metric labels in dataset have format: "<queue>:<metric>", i.e. "orderIndexRequest:ApproximateAgeOfOldestMessage"
