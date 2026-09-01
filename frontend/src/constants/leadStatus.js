export const LEAD_STATUS = [
  'New',
  'Assigned',
  'In Process',
  'Contacted',
  'Visit Planned',
  'Visit Done',
  'Revisit',
  'Negotiation',
  'Broker',
  'Converted',
  'Dropped',
];

export const LEAD_TYPE = ['Broker', 'Client'];

export const LEAD_ORIGIN = ['manual', 'social'];

// Statuses that require a visitDate when logging a follow-up.
export const VISIT_STATUSES = ['Visit Planned', 'Visit Done', 'Revisit'];

export const LEAD_STATUS_COLOR = {
  New: 'info',
  Assigned: 'info',
  'In Process': 'warning',
  Contacted: 'warning',
  'Visit Planned': 'secondary',
  'Visit Done': 'secondary',
  Revisit: 'warning',
  Negotiation: 'warning',
  Broker: 'default',
  Converted: 'success',
  Dropped: 'error',
};
